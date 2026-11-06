import type { EventItem } from '../types';
import { safeHttpsUrl } from './ticketmasterMapping.ts';

/**
 * Earlier versions saved live Ticketmaster events with invented competitor prices, fees, stock
 * counts, ratings and a fake "Main Stage" lineup. Strip those from events already in
 * localStorage so existing users don't keep seeing them. Non-live events are left untouched.
 */
export function migrateStoredEvent(event: EventItem): EventItem {
  if (!event.isTicketmasterLive) return event;
  if (event.ticketPlatforms.length === 0) return event; // already in the current shape

  const tm = event.ticketPlatforms.find((p) => p.platformName === 'Ticketmaster');
  // The old code fell back to the bare homepage when an event had no URL; that isn't an event link.
  const oldUrl = tm?.directUrl && !/^https:\/\/(www\.)?ticketmaster\.com\/?$/.test(tm.directUrl) ? tm.directUrl : undefined;

  const { rating: _rating, reviewsCount: _reviews, ...rest } = event;
  return {
    ...rest,
    ticketPlatforms: [],
    lineup: [],
    ticketUrl: event.ticketUrl ?? safeHttpsUrl(oldUrl),
    tags: event.tags.map((tag) => (tag === 'Ticketmaster Verified' ? 'Ticketmaster' : tag)),
  };
}

/**
 * Merge freshly fetched live events into the current list: new ones go first, and events we
 * already have are refreshed with the new data (keeping the user's price-alert choice) instead of
 * staying frozen at whatever was stored the first time.
 */
export function mergeLiveEvents(existing: EventItem[], incoming: EventItem[]): EventItem[] {
  const incomingById = new Map(incoming.map((event) => [event.id, event]));
  const refreshed = existing.map((event) => {
    const fresh = incomingById.get(event.id);
    return fresh ? { ...fresh, priceAlertActive: event.priceAlertActive } : event;
  });

  const existingIds = new Set(existing.map((event) => event.id));
  const added = incoming.filter((event) => !existingIds.has(event.id));
  return [...added, ...refreshed];
}
