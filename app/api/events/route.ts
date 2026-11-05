// Save as app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/partners";
import { isEventCategory } from "@/lib/categories";
import { apiError } from "@/lib/api-response";
import { isProviderError, publicMessage } from "@/lib/errors";
import { rateLimit } from "@/lib/ratelimit";
import { isValidDate, sanitizeSearchQuery, sanitizeString, isValidCoordinates } from "@/lib/input-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { limit: 60, keyPrefix: "events" });
  if (limited) return limited;

  const params = request.nextUrl.searchParams;

  const q = sanitizeSearchQuery(params.get("q") ?? "");
  const city = sanitizeString(params.get("city") ?? "", 120);
  const from = (params.get("from") ?? "").trim();
  const to = (params.get("to") ?? "").trim();
  const rawCategory = params.get("category") ?? "";
  const category = isEventCategory(rawCategory) ? rawCategory : "";
  const parsedRadius = Number(params.get("radius") ?? "25");
  const parsedPage = Number(params.get("page") ?? "0");
  const latitudeRaw = params.get("lat");
  const longitudeRaw = params.get("lon");
  const latitude = latitudeRaw === null ? undefined : Number(latitudeRaw);
  const longitude = longitudeRaw === null ? undefined : Number(longitudeRaw);
  const hasCoordinates = latitude !== undefined && longitude !== undefined &&
    isValidCoordinates(latitude, longitude);

  if ((latitudeRaw !== null || longitudeRaw !== null) && !hasCoordinates) {
    return apiError("Provide a valid latitude and longitude pair.", 400, "VALIDATION_ERROR");
  }
  if ((from && !isValidDate(from)) || (to && !isValidDate(to)) || (from && to && from > to)) {
    return apiError("Check the event date range.", 400, "VALIDATION_ERROR");
  }

  const radius = Number.isFinite(parsedRadius)
    ? Math.min(250, Math.max(10, Math.round(parsedRadius)))
    : 25;

  const page = Number.isFinite(parsedPage)
    ? Math.min(100, Math.max(0, Math.floor(parsedPage)))
    : 0;

  if (!q && !city && !hasCoordinates) {
    return apiError("Enter an event, city, or map location to search.", 400, "BAD_REQUEST");
  }

  try {
    const result = await searchEvents(q, city || undefined, {
      from: from || undefined,
      to: to || undefined,
      category: category || undefined,
      radius: (city || hasCoordinates) ? radius : undefined,
      latitude: hasCoordinates ? latitude : undefined,
      longitude: hasCoordinates ? longitude : undefined,
      page,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Events API error:", error);

    // Distinguish "not configured" from "provider down"; neither looks like an empty search.
    if (isProviderError(error) && error.code === "not-configured") {
      return apiError(publicMessage(error), 503, "CONFIGURATION_ERROR");
    }
    return apiError(publicMessage(error), 502, "UPSTREAM_ERROR");
  }
}
