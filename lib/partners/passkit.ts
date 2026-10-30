/**
 * PassKit API Integration Module (Advanced Event Source)
 * Auth: PassKit REST uses a short-lived JWT signed locally with your REST API key
 * (uid claim) and secret (HS256). There is no OAuth token endpoint.
 * Credentials come from PassKit portal > Developer Tools > REST Credentials.
 */

import { createHmac } from "node:crypto";
import type { EventItem } from "@/lib/types";

export type PasskitSearchOptions = {
    date?: string;
    radius?: number;
    page?: number;
};

export type EventSearchResult = {
    events: EventItem[];
    hasMore: boolean;
};

const PASSKIT_BASE_URL = "https://api.pub2.passkit.io";

function base64url(input: string) {
    return Buffer.from(input).toString("base64url");
}

/**
 * Signs a short-lived JWT locally (no network call).
 */
function getPasskitToken(): string {
    const apiKey = process.env.PASSKIT_CLIENT_ID; // REST API key
    const apiSecret = process.env.PASSKIT_CLIENT_SECRET; // REST API secret

    if (!apiKey || !apiSecret) {
        throw new Error("PassKit credentials missing in .env.local");
    }

    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64url(JSON.stringify({ uid: apiKey, iat: now, exp: now + 3600 }));
    const signature = createHmac("sha256", apiSecret)
        .update(`${header}.${payload}`)
        .digest("base64url");

    return `${header}.${payload}.${signature}`;
}

/**
 * Fetches events from PassKit.
 * NOTE: the endpoint path and response mapping below are UNVERIFIED. PassKit Event
 * Tickets manages your own events and may not offer keyword/city discovery.
 */
export async function searchPasskit(
    keyword: string,
    city?: string,
    options: PasskitSearchOptions = {}
): Promise<EventSearchResult> {
    let token: string;
    try {
        token = getPasskitToken();
    } catch (e) {
        console.error("Halting PassKit search:", e);
        return { events: [], hasMore: false };
    }

    const page = Math.max(0, Math.floor(options.page ?? 0));

    try {
        const response = await fetch(
            `${PASSKIT_BASE_URL}/eventTickets/production?${new URLSearchParams({
                query: keyword,
                city: city || "",
                page: String(page),
            }).toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            console.error("PassKit API search failed:", response.status, await response.text());
            return { events: [], hasMore: false };
        }

        const rawData = await response.json();
        const mappedEvents: EventItem[] = [];

        if (rawData?.events && Array.isArray(rawData.events)) {
            for (const event of rawData.events) {
                mappedEvents.push({
                    id: event.id || Math.random().toString(36).substring(2, 15),
                    partner: "passkit" as const,
                    name: event.title || "Unnamed Event",
                    date: event.startDate?.localDate || "",
                    venue: event.location?.name || "",
                    city: event.location?.city?.name || "",
                    image: event.primaryImage?.url || undefined,
                    url: event.url || event.ticketUrl || event.link || "",
                });
            }
        }

        const totalPages = rawData?.pagination?.totalPages ?? 0;

        return {
            events: mappedEvents,
            hasMore: page + 1 < totalPages,
        };
    } catch (error) {
        console.error("PassKit request failed:", error);
        return { events: [], hasMore: false };
    }
}
