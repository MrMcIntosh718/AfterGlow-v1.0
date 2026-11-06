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

const US_STATE_CODES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
  connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
};
const VALID_STATE_CODES = new Set(Object.values(US_STATE_CODES));

/** Interpret common location searches so Ticketmaster gets a location filter instead of a keyword. */
export function parseTicketmasterSearch(query: string): { keyword?: string; postalCode?: string; city?: string; stateCode?: string } {
  const trimmed = query.trim();
  if (/^\d{5}$/.test(trimmed)) return { postalCode: trimmed };
  if (trimmed.length === 2 && VALID_STATE_CODES.has(trimmed.toUpperCase())) return { stateCode: trimmed.toUpperCase() };
  const stateOnly = US_STATE_CODES[trimmed.toLowerCase()];
  if (stateOnly) return { stateCode: stateOnly };

  const commaParts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length === 2) {
    const city = commaParts[0];
    const stateInput = commaParts[1].toLowerCase();
    const stateCode = stateInput.length === 2 && VALID_STATE_CODES.has(stateInput.toUpperCase())
      ? stateInput.toUpperCase()
      : US_STATE_CODES[stateInput];
    if (stateCode && city) return { city, stateCode };
  }

  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1]?.toUpperCase();
  if (parts.length > 1 && last && VALID_STATE_CODES.has(last)) {
    return { city: parts.slice(0, -1).join(' '), stateCode: last };
  }

  const normalized = trimmed.toLowerCase();
  for (const [stateName, stateCode] of Object.entries(US_STATE_CODES).sort((a, b) => b[0].length - a[0].length)) {
    const suffix = ` ${stateName}`;
    if (normalized.endsWith(suffix)) {
      const city = trimmed.slice(0, -suffix.length).trim();
      if (city) return { city, stateCode };
    }
  }

  return trimmed ? { keyword: trimmed } : {};
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
