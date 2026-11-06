import type { CategoryType, PriceRange } from '../types';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/**
 * Express query values can be a string, an array (`?a=1&a=2`) or a nested object.
 * Return the first plain string, trimmed, or '' when there isn't one.
 */
export function firstString(value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === 'string' ? candidate.trim() : '';
}

/**
 * Parse a client-supplied page size and keep it within [1, MAX_PAGE_SIZE] so a
 * caller can't use the proxy to pull arbitrarily large (quota-burning) pages.
 */
export function clampPageSize(
  value: unknown,
  fallback: number = DEFAULT_PAGE_SIZE,
  max: number = MAX_PAGE_SIZE,
): string {
  const parsed = Number.parseInt(firstString(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return String(fallback);
  return String(Math.min(parsed, max));
}

/**
 * Map a Ticketmaster classification (segment + genre names) to an AfterGlow category.
 *
 * Ticketmaster's theatre segment is named "Arts & Theatre" and comedy is a genre inside it,
 * so comedy has to be checked by genre first; otherwise every "Arts & Theatre" event
 * (plays, musicals, opera) is mislabeled as Comedy.
 */
export function mapTicketmasterCategory(segment: string, genre: string): CategoryType {
  const s = segment.toLowerCase();
  const g = genre.toLowerCase();

  if (g.includes('comedy')) return 'Comedy';
  if (s.includes('sports')) return 'Sports';
  // "Dance/Electronic" is a Music genre; a bare "Dance" genre outside Music (ballet, etc.) is not EDM.
  if (g.includes('electronic') || (s === 'music' && g.includes('dance'))) return 'EDM / Festival';
  if (s.includes('theatre') || s.includes('theater') || s.includes('arts')) return 'Theater';
  return 'Concert';
}

/**
 * Format a Ticketmaster `localDate` (YYYY-MM-DD) for display. Built from the date parts so the
 * result never shifts with the viewer's timezone. Returns the raw input if it isn't a real date
 * (Date#toLocaleDateString doesn't throw on bad input, it returns "Invalid Date").
 */
export function formatEventDate(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return localDate;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) return localDate;

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Pull the first usable price range out of Ticketmaster's `priceRanges`. Returns undefined when
 * the event has no published price, so callers show "price at Ticketmaster" instead of inventing one.
 */
export function pickPriceRange(priceRanges: unknown): PriceRange | undefined {
  if (!Array.isArray(priceRanges)) return undefined;

  for (const entry of priceRanges) {
    if (!entry || typeof entry !== 'object') continue;
    const { min, max, currency } = entry as Record<string, unknown>;
    if (typeof min !== 'number' || !Number.isFinite(min) || min < 0) continue;

    const high = typeof max === 'number' && Number.isFinite(max) && max >= min ? max : min;
    return {
      min: Math.round(min),
      max: Math.round(high),
      currency: typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : 'USD',
    };
  }
  return undefined;
}

/** Return the URL only if it parses and is https; otherwise undefined (never render other schemes in an href). */
export function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
