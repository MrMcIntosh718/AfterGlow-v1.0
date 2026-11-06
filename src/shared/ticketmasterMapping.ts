import type { CategoryType } from '../types';

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
