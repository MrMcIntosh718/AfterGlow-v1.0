import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export type BrightDataEvent = {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  postalCode: string;
  address: string;
  eventUrl: string;
  sourceUrl: string;
  sourceDomain: string;
  venueDetailsFound: boolean;
};

type BrightDataConfig = {
  apiKey: string;
  serpZone: string;
  unlockerZone: string;
};

type SearchResult = { title?: string; url?: string; description?: string };

const UNLOCKER_URL = 'https://api.brightdata.com/request';
const MAX_RESULT_PAGES = 5;
const SEARCH_TIMEOUT_MS = 20_000;
const PAGE_TIMEOUT_MS = 15_000;

export function brightDataConfigured(): boolean {
  return Boolean(
    process.env.BRIGHTDATA_API_KEY?.trim() &&
    process.env.BRIGHTDATA_SERP_ZONE?.trim() &&
    process.env.BRIGHTDATA_UNLOCKER_ZONE?.trim()
  );
}

function config(): BrightDataConfig {
  const value = {
    apiKey: process.env.BRIGHTDATA_API_KEY?.trim() ?? '',
    serpZone: process.env.BRIGHTDATA_SERP_ZONE?.trim() ?? '',
    unlockerZone: process.env.BRIGHTDATA_UNLOCKER_ZONE?.trim() ?? '',
  };
  if (!value.apiKey || !value.serpZone || !value.unlockerZone) {
    throw new Error('Bright Data search is not configured. Set the API key and both zone names in the server environment.');
  }
  return value;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('Bright Data returned a response that was not valid JSON.');
  }
}

async function searchWeb(query: string, settings: BrightDataConfig): Promise<unknown> {
  const searchUrl = new URL('https://www.google.com/search');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('gl', 'us');
  searchUrl.searchParams.set('hl', 'en');
  searchUrl.searchParams.set('brd_json', '1');

  const response = await fetch(UNLOCKER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ zone: settings.serpZone, url: searchUrl.toString(), format: 'raw' }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    console.warn('[Bright Data SERP] Request failed:', response.status);
    throw new Error('Bright Data search is temporarily unavailable. Check the SERP zone and account settings.');
  }

  return readJson(response);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getSearchResults(payload: unknown): SearchResult[] {
  const results: SearchResult[] = [];
  const visited = new Set<object>();
  const walk = (value: unknown, depth: number) => {
    if (depth > 5 || !value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1);
      return;
    }
    const item = value as Record<string, unknown>;
    const url = typeof item.url === 'string' ? item.url : typeof item.link === 'string' ? item.link : '';
    const title = typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : '';
    const description = typeof item.description === 'string'
      ? item.description
      : typeof item.snippet === 'string' ? item.snippet : '';
    if (url && title) results.push({ url, title, description });
    for (const [key, child] of Object.entries(item)) {
      if (/organic|result|search|body|data/i.test(key)) walk(child, depth + 1);
    }
  };
  walk(payload, 0);
  const seen = new Set<string>();
  return results.filter((result) => {
    if (!result.url || seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}

function isPublicWebUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host.startsWith('[') || isIP(host) || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
    if (/^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

async function unlockPage(url: string, settings: BrightDataConfig): Promise<string> {
  const response = await fetch(UNLOCKER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ zone: settings.unlockerZone, url, format: 'raw', country: 'us' }),
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
  });
  if (!response.ok) {
    console.info('[Bright Data Unlocker] Page fetch skipped:', response.status);
    return '';
  }
  return response.text();
}

function cleanText(value: unknown, maxLength = 180): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function schemaNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!isRecord(value)) return [];
  const nodes = [value];
  if (value['@graph']) nodes.push(...schemaNodes(value['@graph']));
  if (value.itemListElement) nodes.push(...schemaNodes(value.itemListElement));
  if (isRecord(value.item)) nodes.push(...schemaNodes(value.item));
  return nodes;
}

function findEventNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const scriptPattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      nodes.push(...schemaNodes(JSON.parse(match[1])));
    } catch {
      // A malformed JSON-LD block does not prevent reading other blocks on the page.
    }
  }
  return nodes.filter((node) => {
    const rawType = node['@type'];
    const types = Array.isArray(rawType) ? rawType : [rawType];
    return types.some((type) => typeof type === 'string' && /event$/i.test(type));
  });
}

function parseAddress(value: unknown): { city: string; state: string; postalCode: string; address: string } {
  if (typeof value === 'string') return { city: '', state: '', postalCode: '', address: cleanText(value) };
  if (!isRecord(value)) return { city: '', state: '', postalCode: '', address: '' };
  const street = cleanText(value.streetAddress, 120);
  const city = cleanText(value.addressLocality, 80);
  const state = cleanText(value.addressRegion, 40);
  const postalCode = cleanText(value.postalCode, 20);
  const address = [street, city, state, postalCode].filter(Boolean).join(', ');
  return { city, state, postalCode, address };
}

function toEvent(node: Record<string, unknown>, sourceUrl: URL): BrightDataEvent | null {
  const location = Array.isArray(node.location) ? node.location[0] : node.location;
  const venue = isRecord(location) ? cleanText(location.name, 120) : '';
  const placeAddress = isRecord(location) ? location.address : undefined;
  const address = parseAddress(placeAddress);
  const eventUrl = typeof node.url === 'string' ? isPublicWebUrl(node.url)?.toString() ?? sourceUrl.toString() : sourceUrl.toString();
  const title = cleanText(node.name, 180);
  const dateTime = cleanText(node.startDate, 40);
  const date = dateTime.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
  const parsedDate = new Date(`${date}T00:00:00Z`);
  const today = new Date().toISOString().slice(0, 10);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date &&
    date >= today;
  if (!title || !venue || !validDate || !eventUrl) return null;
  const key = `${title}|${venue}|${date}`.toLowerCase();
  return {
    id: createHash('sha256').update(key).digest('hex').slice(0, 16),
    title,
    date,
    venue,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    address: address.address,
    eventUrl,
    sourceUrl: sourceUrl.toString(),
    sourceDomain: sourceUrl.hostname.replace(/^www\./, ''),
    venueDetailsFound: Boolean(venue && (address.city || address.address)),
  };
}

export async function searchBrightDataEvents(keyword: string, city: string): Promise<BrightDataEvent[]> {
  const settings = config();
  const query = [keyword, city, 'upcoming live events'].filter(Boolean).join(' ').slice(0, 220);
  const payload = await searchWeb(query, settings);
  const pages = getSearchResults(payload)
    .map((result) => ({ result, url: result.url ? isPublicWebUrl(result.url) : null }))
    .filter((item): item is { result: SearchResult; url: URL } => Boolean(item.url))
    .slice(0, MAX_RESULT_PAGES);

  const pageEvents = await Promise.all(pages.map(async (page) => {
    try {
      const html = await unlockPage(page.url.toString(), settings);
      if (!html) return [];
      return findEventNodes(html)
        .map((node) => toEvent(node, page.url))
        .filter((event): event is BrightDataEvent => Boolean(event));
    } catch (error) {
      console.info('[Bright Data Unlocker] Could not read result page:', error instanceof Error ? error.name : 'unknown');
      return [];
    }
  }));
  const events = pageEvents.flat();

  const unique = new Map<string, BrightDataEvent>();
  for (const event of events) unique.set(`${event.title.toLowerCase()}|${event.venue.toLowerCase()}|${event.date}`, event);
  return [...unique.values()].slice(0, 10);
}
