import type { EventItem } from "../types";
import { isEventCategory } from "../categories";
import { fetchWithRetry } from "../ratelimit";
import { ProviderError } from "../errors";
import { isValidDate } from "../input-validation";

export type TicketmasterSearchOptions = {
    date?: string; // legacy single date; treated as from = to
    from?: string; // YYYY-MM-DD, start of range
    to?: string; // YYYY-MM-DD, end of range
    category?: string; // see lib/categories.ts
    radius?: number;
    latitude?: number;
    longitude?: number;
    page?: number;
};

export type EventSearchResult = {
    events: EventItem[];
    hasMore: boolean;
};

type TmEvent = {
    id: string;
    name: string;
    url: string;
    images?: { url: string; width: number }[];
    dates?: { start?: { localDate?: string } };
    _embedded?: {
        venues?: {
            name?: string;
            city?: { name?: string };
            location?: { latitude?: number; longitude?: number };
        }[];
    };
};

type MapboxResponse = {
    features?: {
        geometry?: {
            coordinates?: [number, number];
        };
    }[];
};

type TicketmasterResponse = {
    _embedded?: {
        events?: TmEvent[];
    };
    page?: {
        number?: number;
        totalPages?: number;
    };
};


function isTimeout(error: unknown): boolean {
    return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function toTicketmasterDateTime(date: Date): string {
    return date.toISOString().replace(".000Z", "Z");
}

export async function searchTicketmaster(
    keyword: string,
    city?: string,
    options: TicketmasterSearchOptions = {}
): Promise<EventSearchResult> {
    const apiKey = process.env.TICKETMASTER_API_KEY;

    const hasRequestedCenter = Number.isFinite(options.latitude) && Number.isFinite(options.longitude);
    if (!apiKey) {
        throw new ProviderError("ticketmaster", "Ticketmaster API is not configured (TICKETMASTER_API_KEY).", "not-configured");
    }

    // Nothing to search for: a genuinely empty result, not an error.
    if (!keyword.trim() && !city?.trim() && !hasRequestedCenter) {
        if (!apiKey) {
            console.error("Missing TICKETMASTER_API_KEY in .env.local");
        }

        throw new Error(apiKey ? "Ticketmaster search requires a keyword, city, or map center." : "Ticketmaster API is not configured.");
    }

    const page = Math.max(0, Math.floor(options.page ?? 0));
    const radius =
        options.radius === undefined
            ? undefined
            : Math.min(250, Math.max(10, Math.round(options.radius)));

    const params = new URLSearchParams({
        apikey: apiKey,
        size: "20",
        page: String(page),
        // Relevance order powers "Best match" and the Top picks carousel.
        sort: "relevance,desc",
    });

    if (keyword.trim()) {
        params.set("keyword", keyword.trim());
    }

    if (options.category && isEventCategory(options.category)) {
        params.set("classificationName", options.category);
    }

    if (city?.trim()) {
        const cityName = city.trim().split(",")[0].trim();

        if (cityName) {
            params.set("city", cityName);
        }
    }

    // Explicit map-center coordinates take precedence for "Search this area".
    const hasCenter = Number.isFinite(options.latitude) && Number.isFinite(options.longitude);
    if (hasCenter && radius !== undefined) {
        params.delete("city");
        params.set("latlong", `${options.latitude},${options.longitude}`);
        params.set("radius", String(radius));
        params.set("unit", "miles");
        params.set("sort", "distance,asc");
    }

    // When no explicit map center is supplied, geocode the full city/state using Mapbox.
    if (!hasCenter && city?.trim() && radius !== undefined) {
        const mapboxToken =
            process.env.MAPBOX_ACCESS_TOKEN ??
            process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

        if (!mapboxToken) {
            throw new ProviderError(
                "mapbox",
                "Radius search needs MAPBOX_ACCESS_TOKEN (or NEXT_PUBLIC_MAPBOX_TOKEN) in .env.local",
                "not-configured"
            );
        }

        try {
            const isZipCode = /^\d{5}$/.test(city.trim());
            const geoParams = new URLSearchParams({
                q: city.trim(),
                access_token: mapboxToken,
                limit: "1",
                types: isZipCode ? "postcode" : "place,locality",
                country: "us",
            });

            const geoResponse = await fetchWithRetry(
                `https://api.mapbox.com/search/geocode/v6/forward?${geoParams}`,
                { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) }
            );

            if (!geoResponse.ok) {
                console.error("Mapbox geocoding failed:", geoResponse.status);
                throw new ProviderError("mapbox", `Mapbox geocoding failed (${geoResponse.status}).`, "upstream", geoResponse.status);
            }

            const geoData: MapboxResponse = await geoResponse.json();

            // Mapbox v6 returns [longitude, latitude].
            const coordinates = geoData.features?.[0]?.geometry?.coordinates;

            if (
                !coordinates ||
                coordinates.length !== 2 ||
                !Number.isFinite(coordinates[0]) ||
                !Number.isFinite(coordinates[1])
            ) {
                // Unknown place name: a genuinely empty result, not a provider failure.
                console.info("Mapbox returned no coordinates for:", city);
                return { events: [], hasMore: false };
            }

            const [longitude, latitude] = coordinates;

            // Ticketmaster expects latitude,longitude.
            params.delete("city");
            params.set("latlong", `${latitude},${longitude}`);
            params.set("radius", String(radius));
            params.set("unit", "miles");
            // When a location is supplied, return the closest matching events first.
            params.set("sort", "distance,asc");

            console.info(
                `Mapbox geocoded "${city}" to ${latitude}, ${longitude}; searching ${radius} miles.`
            );
        } catch (error) {
            if (error instanceof ProviderError) throw error;
            console.error("Mapbox geocoding request failed:", error);
            throw new ProviderError("mapbox", "Mapbox geocoding request failed.", isTimeout(error) ? "timeout" : "upstream");
        }
    }

    // Date range. Either end may be omitted. A legacy single `date` means from = to.
    let rangeStart: string | undefined = isValidDate(options.from) ? options.from : undefined;
    let rangeEnd: string | undefined = isValidDate(options.to) ? options.to : undefined;

    if (!rangeStart && !rangeEnd && isValidDate(options.date)) {
        rangeStart = options.date;
        rangeEnd = options.date;
    }

    if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
        [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }

    // Query a slightly wider UTC window, then filter by the venue's local
    // calendar date so events near midnight are less likely to be missed.
    if (rangeStart) {
        const start = new Date(`${rangeStart}T00:00:00.000Z`);
        start.setUTCDate(start.getUTCDate() - 1);
        params.set("startDateTime", toTicketmasterDateTime(start));
    }

    if (rangeEnd) {
        const end = new Date(`${rangeEnd}T00:00:00.000Z`);
        end.setUTCDate(end.getUTCDate() + 2);
        params.set("endDateTime", toTicketmasterDateTime(end));
    }

    try {
        const response = await fetchWithRetry(
            `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
            { next: { revalidate: 300 }, signal: AbortSignal.timeout(10000) }
        );

        if (!response.ok) {
            throw new ProviderError("ticketmaster", `Ticketmaster search failed (${response.status}).`, "upstream", response.status);
        }

        const data: TicketmasterResponse = await response.json();
        const rawEvents = data._embedded?.events ?? [];

        const mappedEvents: EventItem[] = rawEvents.map((event) => {
            const venue = event._embedded?.venues?.[0];
            const image = [...(event.images ?? [])]
                .sort((a, b) => b.width - a.width)[0]?.url;

            return {
                id: event.id,
                partner: "ticketmaster" as const,
                name: event.name,
                date: event.dates?.start?.localDate ?? "",
                venue: venue?.name ?? "",
                city: venue?.city?.name ?? "",
                image,
                url: event.url,
                latitude: Number.isFinite(Number(venue?.location?.latitude)) ? Number(venue?.location?.latitude) : undefined,
                longitude: Number.isFinite(Number(venue?.location?.longitude)) ? Number(venue?.location?.longitude) : undefined,
            };
        });

        const hasRange = Boolean(rangeStart || rangeEnd);

        const events = hasRange
            ? mappedEvents.filter((event) => {
                if (!event.date) return false;
                if (rangeStart && event.date < rangeStart) return false;
                if (rangeEnd && event.date > rangeEnd) return false;
                return true;
            })
            : mappedEvents;

        const totalPages = data.page?.totalPages ?? 0;

        return {
            events,
            hasMore: page + 1 < totalPages,
        };
    } catch (error) {
        if (error instanceof ProviderError) throw error;
        console.error("Ticketmaster request failed:", error);
        throw new ProviderError("ticketmaster", "Ticketmaster request failed.", isTimeout(error) ? "timeout" : "upstream");
    }
}
