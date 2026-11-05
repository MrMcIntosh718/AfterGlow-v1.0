
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/ratelimit";
import { sanitizeSearchQuery } from "@/lib/input-validation";
import { fetchWithRetry } from "@/lib/ratelimit";

type MapboxFeature = {
  id?: string;
  properties?: {
    mapbox_id?: string;
    name?: string;
    feature_type?: string;
    context?: {
      place?: { name?: string };
      region?: { name?: string };
      country?: { name?: string };
    };
  };
};

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { limit: 60, keyPrefix: "locations" });
  if (limited) return limited;
  const query = sanitizeSearchQuery(request.nextUrl.searchParams.get("q") ?? "");

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  if (query.length > 100) {
    return apiError("Search text is too long.", 400, "VALIDATION_ERROR");
  }

  const token =
    process.env.MAPBOX_ACCESS_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    console.error("Missing Mapbox token in environment variables.");

    return apiError("Location search is not configured.", 503, "CONFIGURATION_ERROR");
  }

  const url = new URL(
    "https://api.mapbox.com/search/geocode/v6/forward"
  );

  url.searchParams.set("q", query);
  url.searchParams.set("country", "US");
  url.searchParams.set("types", "place");
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("access_token", token);

  try {
    const response = await fetchWithRetry(url.toString(), {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Mapbox location request failed:", response.status);

      return apiError("Unable to look up locations right now.", 502, "UPSTREAM_ERROR");
    }

    const data = (await response.json()) as {
      features?: MapboxFeature[];
    };

    const suggestions = (data.features ?? [])
      .map((feature) => {
        const properties = feature.properties;
        const context = properties?.context;

        const name = context?.place?.name ?? properties?.name ?? "";
        const region = context?.region?.name ?? "";
        const country = context?.country?.name ?? "United States";

        if (!name || !region) return null;

        return {
          id: properties?.mapbox_id ?? feature.id ?? `${name}-${region}`,
          name,
          region,
          country,
          displayName: `${name}, ${region}, ${country}`,
        };
      })
      .filter(
        (city): city is NonNullable<typeof city> => city !== null
      );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Location autocomplete request failed:", error);

    return apiError("Location search temporarily unavailable.", 502, "UPSTREAM_ERROR");
  }
}
