/**
 * Google Places API Integration Module (POI & Attraction Discovery)
 * NOTE: Requires a Google Maps Platform API key in GOOGLE_MAPS_API_KEY.
 */

/**
 * Represents the coordinates retrieved from Google Places Search.
 */
export type Coordinates = { latitude: number; longitude: number };

/** Subset of the Google Places result fields we use. */
interface GooglePlace {
    place_id: string;
    name: string;
    vicinity?: string;
    types?: string[];
    geometry?: { location?: { lat: number; lng: number } };
}

export interface Attraction {
    id: string;
    name: string;
    address: string;
    type: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Geocode a city name into coordinates using the Google Geocoding API.
 */
export async function getCoordinatesFromCity(city: string): Promise<Coordinates | null> {
    const GOOGLE_GEOCODING_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_GEOCODING_API_KEY) {
        console.error("Google Geocoding API Key missing.");
        return null;
    }

    try {
        const params = new URLSearchParams({
            address: city,
            key: GOOGLE_GEOCODING_API_KEY,
        });

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Failed to geocode location.");
        }

        const data: any = await response.json();
        const result = data?.results?.[0];

        if (result && result.geometry?.location) {
            return {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
            };
        } else {
            console.warn("Google Geocoding API found no coordinates for:", city);
            return null;
        }
    } catch (error) {
        console.error("Error during geocoding lookup:", error);
        return null;
    }
}

/**
 * Searches for Points of Interest (POIs) near a given coordinate and search term.
 */
export async function searchAttractions(
    query: string,
    coordinates: Coordinates,
    radiusMeters: number = 5000
): Promise<{ attractions: Attraction[]; hasMore: boolean }> {
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_PLACES_API_KEY) {
        console.error("Google Places API Key missing.");
        return { attractions: [], hasMore: false };
    }

    // Nearby Search takes `keyword` (not `query`, which belongs to Text Search).
    const params = new URLSearchParams({
        key: GOOGLE_PLACES_API_KEY,
        keyword: query,
        location: `${coordinates.latitude},${coordinates.longitude}`,
        radius: String(radiusMeters),
        type: "establishment",
    });

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`
        );

        if (!response.ok) {
            console.error("Google Places search failed:", response.status);
            return { attractions: [], hasMore: false };
        }

        const data: any = await response.json();
        const rawAttractions: GooglePlace[] = data?.results || [];

        const mappedAttractions: Attraction[] = rawAttractions.map((place: GooglePlace) => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity || "Location unavailable",
            type: place.types ? place.types[0] : "unknown",
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng,
        }));

        return {
            attractions: mappedAttractions,
            hasMore: Boolean(data?.next_page_token),
        };
    } catch (error) {
        console.error("Google Places API request failed:", error);
        return { attractions: [], hasMore: false };
    }
}
