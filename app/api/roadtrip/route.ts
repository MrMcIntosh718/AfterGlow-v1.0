import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { rateLimit, fetchWithRetry } from "@/lib/ratelimit";
import { isValidDate, sanitizeString } from "@/lib/input-validation";
import { distanceFromPointToRouteMiles, sampleRouteByDistance, type RouteCoordinate } from "@/lib/roadtrip-geo";

export const dynamic = "force-dynamic";

type Point = { latitude: number; longitude: number };
type Feature = { geometry?: { coordinates?: [number, number] } };
type RoadtripEvent = {
  id: string;
  name: string;
  date: string;
  venue: string;
  city: string;
  url: string;
  image?: string;
  latitude: number;
  longitude: number;
  routeDistanceMiles: number;
};
type Attraction = {
  id: string;
  name: string;
  address: string;
  type: string;
  rating?: number;
  latitude: number;
  longitude: number;
  routeDistanceMiles: number;
};

async function geocode(query: string, token: string): Promise<Point | null> {
  const p = new URLSearchParams({ q: query, country: "US", limit: "1", access_token: token });
  const r = await fetchWithRetry(`https://api.mapbox.com/search/geocode/v6/forward?${p}`, {
    signal: AbortSignal.timeout(8000), cache: "no-store",
  });
  if (!r.ok) return null;
  const data = await r.json() as { features?: Feature[] };
  const c = data.features?.[0]?.geometry?.coordinates;
  return c && Number.isFinite(c[0]) && Number.isFinite(c[1])
    ? { longitude: c[0], latitude: c[1] }
    : null;
}

async function mapConcurrent<T, R>(
  items: readonly T[],
  concurrency: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await task(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function isWithinDates(date: string, from: string, to: string): boolean {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function closestByRouteDistance<T extends { id: string; routeDistanceMiles: number }>(items: T[]): T[] {
  const unique = new Map<string, T>();
  for (const item of items) {
    const previous = unique.get(item.id);
    if (!previous || item.routeDistanceMiles < previous.routeDistanceMiles) unique.set(item.id, item);
  }
  return [...unique.values()].sort((a, b) => a.routeDistanceMiles - b.routeDistanceMiles);
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { limit: 6, keyPrefix: "roadtrip" });
  if (limited) return limited;

  const p = request.nextUrl.searchParams;
  const start = sanitizeString(p.get("start") ?? "", 120);
  const end = sanitizeString(p.get("end") ?? "", 120);
  const from = (p.get("from") ?? "").trim();
  const to = (p.get("to") ?? "").trim();

  if (!start || !end) return apiError("Enter both a starting point and a destination.", 400, "BAD_REQUEST");
  if ((from && !isValidDate(from)) || (to && !isValidDate(to)) || (from && to && from > to)) {
    return apiError("Check your travel dates. The end date must be on or after the start date.", 400, "VALIDATION_ERROR");
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return apiError("Road-trip routing is not configured.", 503, "CONFIGURATION_ERROR");

  try {
    const [origin, destination] = await Promise.all([geocode(start, token), geocode(end, token)]);
    if (!origin || !destination) {
      return apiError("We couldn't find one of those locations. Try a city and state or ZIP code.", 422, "VALIDATION_ERROR");
    }

    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("overview", "full");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("steps", "false");

    const directionsResponse = await fetchWithRetry(url.toString(), {
      signal: AbortSignal.timeout(12000), cache: "no-store",
    });
    if (!directionsResponse.ok) return apiError("Mapbox couldn't calculate this driving route.", 502, "UPSTREAM_ERROR");

    const directions = await directionsResponse.json() as {
      routes?: { distance: number; duration: number; geometry?: { coordinates?: RouteCoordinate[] } }[];
    };
    const route = directions.routes?.[0];
    const coordinates = route?.geometry?.coordinates ?? [];
    if (!route || coordinates.length < 2) {
      return apiError("No driving route found between those locations.", 422, "VALIDATION_ERROR");
    }

    // Ticketmaster's radius searches are centered at distance-spaced points,
    // not arbitrary coordinate-array indexes. Every result is then checked
    // against the complete route polyline before it can be returned.
    const eventPoints = sampleRouteByDistance(coordinates, 45, 18);
    const attractionPoints = sampleRouteByDistance(coordinates, 110, 7);
    const eventCorridorMiles = 20;
    const attractionCorridorMiles = 16;
    const ticketKey = process.env.TICKETMASTER_API_KEY;

    const eventGroups = ticketKey ? await mapConcurrent(eventPoints, 4, async (point) => {
      try {
        const q = new URLSearchParams({
          apikey: ticketKey,
          size: "20",
          sort: "distance,asc",
          latlong: `${point.latitude},${point.longitude}`,
          radius: String(eventCorridorMiles),
          unit: "miles",
        });
        if (from) q.set("startDateTime", `${from}T00:00:00Z`);
        if (to) q.set("endDateTime", `${to}T23:59:59Z`);

        const r = await fetchWithRetry(`https://app.ticketmaster.com/discovery/v2/events.json?${q}`, {
          signal: AbortSignal.timeout(9000), cache: "no-store",
        });
        if (!r.ok) {
          console.error("Road-trip Ticketmaster lookup failed:", r.status);
          return [] as RoadtripEvent[];
        }
        const data = await r.json() as { _embedded?: { events?: any[] } };
        const mapped: RoadtripEvent[] = [];

        for (const event of data._embedded?.events ?? []) {
          const venue = event._embedded?.venues?.[0];
          const latitude = Number(venue?.location?.latitude);
          const longitude = Number(venue?.location?.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

          const date = event.dates?.start?.localDate ?? "";
          if ((from || to) && !isWithinDates(date, from, to)) continue;

          const routeDistanceMiles = distanceFromPointToRouteMiles({ latitude, longitude }, coordinates);
          if (routeDistanceMiles > eventCorridorMiles) continue;

          const images = [...(event.images ?? [])].sort((a: any, b: any) => (b.width ?? 0) - (a.width ?? 0));
          mapped.push({
            id: event.id,
            name: event.name,
            date: date || "Date TBA",
            venue: venue?.name ?? "Venue TBA",
            city: venue?.city?.name ?? "Along your route",
            url: event.url,
            image: images[0]?.url,
            latitude,
            longitude,
            routeDistanceMiles: Math.round(routeDistanceMiles * 10) / 10,
          });
        }
        return mapped;
      } catch (error) {
        console.error("Road-trip event lookup failed:", error);
        return [] as RoadtripEvent[];
      }
    }) : [];

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    const terms = ["zoo", "water park", "amusement park"];
    const attractionJobs = googleKey
      ? attractionPoints.flatMap((point) => terms.map((term) => ({ point, term })))
      : [];

    // Google Places calls are billed; keep concurrency bounded and do not retry them.
    const attractionGroups = googleKey ? await mapConcurrent(attractionJobs, 4, async ({ point, term }) => {
      try {
        const q = new URLSearchParams({
          key: googleKey,
          keyword: term,
          location: `${point.latitude},${point.longitude}`,
          radius: "25000",
          type: "tourist_attraction",
        });
        const r = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${q}`, {
          signal: AbortSignal.timeout(9000), cache: "no-store",
        });
        if (!r.ok) return [] as Attraction[];
        const data = await r.json() as { results?: any[] };
        const mapped: Attraction[] = [];
        for (const place of data.results ?? []) {
          const latitude = place.geometry?.location?.lat;
          const longitude = place.geometry?.location?.lng;
          if (typeof latitude !== "number" || typeof longitude !== "number") continue;
          const routeDistanceMiles = distanceFromPointToRouteMiles({ latitude, longitude }, coordinates);
          if (routeDistanceMiles > attractionCorridorMiles) continue;
          mapped.push({
            id: place.place_id,
            name: place.name,
            address: place.vicinity ?? "Address unavailable",
            type: term,
            rating: typeof place.rating === "number" ? place.rating : undefined,
            latitude,
            longitude,
            routeDistanceMiles: Math.round(routeDistanceMiles * 10) / 10,
          });
        }
        return mapped;
      } catch (error) {
        console.error("Road-trip attraction lookup failed:", error);
        return [] as Attraction[];
      }
    }) : [];

    const events = closestByRouteDistance(eventGroups.flat()).slice(0, 60);
    const attractions = closestByRouteDistance(attractionGroups.flat()).slice(0, 60);

    return NextResponse.json({
      route: {
        distanceMiles: Math.round(route.distance / 1609.344),
        durationMinutes: Math.round(route.duration / 60),
        geometry: coordinates,
      },
      events,
      attractions,
      setup: { ticketmaster: Boolean(ticketKey), googlePlaces: Boolean(googleKey) },
    });
  } catch (error) {
    console.error("Road-trip search failed:", error);
    return apiError("Road-trip search failed temporarily. Please try again.", 502, "UPSTREAM_ERROR");
  }
}
