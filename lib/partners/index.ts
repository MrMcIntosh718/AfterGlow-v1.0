/**
 * Event search entry point.
 *
 * Only Ticketmaster is queried. Failures are thrown as ProviderError (see
 * lib/errors.ts) so callers can tell "the provider is down" from "no events".
 *
 * Previously this file also exposed searchEverything(), which additionally ran a
 * Google geocode + Places query and a flight search with hardcoded JFK -> LAX
 * placeholders on every home-page search, while the page used only the events.
 * That cost paid API calls for nothing and has been removed. The Amadeus and
 * Google Places modules (flights.ts, googleplaces.ts) and PassKit (passkit.ts)
 * are no longer called from anywhere. They remain integration templates, but
 * should not be presented as active features until implemented and verified.
 */

import type { EventItem } from "../types";
import { searchTicketmaster } from "./ticketmaster";

export type SearchOptions = {
    date?: string; // legacy single date
    from?: string;
    to?: string;
    category?: string;
    radius?: number;
    latitude?: number;
    longitude?: number;
    page?: number;
};

export type EventSearchResult = {
    events: EventItem[];
    hasMore: boolean;
};

export async function searchEvents(
    keyword: string,
    city?: string,
    options: SearchOptions = {}
): Promise<EventSearchResult> {
    // Throws ProviderError on failure. Add more providers here with
    // Promise.allSettled and merge by `${partner}-${id}` when you have them.
    const result = await searchTicketmaster(keyword, city, options);

    const unique = new Map<string, EventItem>();
    for (const event of result.events) {
        unique.set(`${event.partner}-${event.id}`, event);
    }
    return { events: Array.from(unique.values()), hasMore: result.hasMore };
}
