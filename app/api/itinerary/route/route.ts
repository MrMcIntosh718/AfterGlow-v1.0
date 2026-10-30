import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { rateLimit, fetchWithRetry } from "@/lib/ratelimit";
import { isValidCoordinates, isValidStopId } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

type StopInput = { id: string; latitude: number; longitude: number };

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 20, keyPrefix: "itinerary" });
  if (limited) return limited;
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 32_000) return apiError("Request body is too large.", 413, "VALIDATION_ERROR");
  let body: { stops?: StopInput[] };
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 32_000) {
      return apiError("Request body is too large.", 413, "VALIDATION_ERROR");
    }
    body = JSON.parse(rawBody) as { stops?: StopInput[] };
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError("Request body must be a JSON object.", 400, "BAD_REQUEST");
    }
  } catch {
    return apiError("Request body must be valid JSON.", 400, "BAD_REQUEST");
  }
  const stops = body.stops;
  if (!Array.isArray(stops) || stops.length < 2 || stops.length > 25) {
    return apiError("Provide between 2 and 25 stops to calculate route legs.", 400, "VALIDATION_ERROR");
  }
  if (stops.some((stop) =>
    !stop || !isValidStopId(stop.id) ||
    !isValidCoordinates(stop.latitude, stop.longitude)
  )) {
    return apiError("Every stop must have a valid ID and latitude/longitude pair.", 422, "VALIDATION_ERROR");
  }
  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return apiError("Route-leg calculations are not configured.", 503, "CONFIGURATION_ERROR");
  }

  try {
    const coordinates = stops.map((stop) => `${stop.longitude},${stop.latitude}`).join(";");
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`);
    url.searchParams.set("access_token", token);
    url.searchParams.set("overview", "false");
    url.searchParams.set("steps", "false");
    const response = await fetchWithRetry(url.toString(), { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (!response.ok) {
      return apiError("Mapbox could not calculate the route legs for these stops.", 502, "UPSTREAM_ERROR");
    }
    const data = await response.json() as {
      routes?: Array<{ legs?: Array<{ distance: number; duration: number }> }>;
      code?: string;
    };
    const legs = data.routes?.[0]?.legs;
    if (!legs || legs.length !== stops.length - 1) {
      return apiError("No complete driving route was returned for these stops.", 422, "VALIDATION_ERROR");
    }
    return NextResponse.json({
      source: "Mapbox Directions",
      calculatedAt: new Date().toISOString(),
      legs: legs.map((leg, index) => ({
        fromId: stops[index].id,
        toId: stops[index + 1].id,
        distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
        durationMinutes: Math.max(1, Math.round(leg.duration / 60)),
        state: "available" as const,
        source: "Mapbox Directions",
      })),
    });
  } catch (error) {
    console.error("Itinerary route-leg calculation failed:", error);
    return apiError("Route-leg calculation failed temporarily.", 502, "UPSTREAM_ERROR");
  }
}
