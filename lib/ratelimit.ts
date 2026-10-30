import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
type RateLimitOptions = { limit?: number; windowMs?: number; keyPrefix?: string };
type RetryFetchOptions = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

const buckets = new Map<string, Bucket>();
const DEFAULT_WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

function clientKey(request: NextRequest): string {
  // On platforms with a trusted proxy, configure it to overwrite this header.
  // Never store or log the raw address.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(address).digest("hex").slice(0, 24);
}

export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  const limit = options.limit ?? 60;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const key = `${options.keyPrefix ?? "api"}:${clientKey(request)}`;
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  // Bound memory growth on long-lived processes.
  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
      if (buckets.size <= MAX_BUCKETS) break;
    }
    if (buckets.size > MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey) buckets.delete(oldestKey);
    }
  }

  if (bucket.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly.", code: "RATE_LIMITED" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * Retry for idempotent GETs to providers whose outages are usually brief
 * (Mapbox, Ticketmaster search). Deliberately conservative:
 *  - one retry by default, with jittered backoff;
 *  - retries network errors and 502/503/504 only;
 *  - never retries 429 (retrying a rate-limited quota makes it worse) or
 *    timeouts (the caller's time budget is already spent);
 *  - do NOT use it for billed calls fanned out in parallel (Google Places).
 */
export async function fetchWithRetry(
  url: string,
  options?: RetryFetchOptions,
  config: { retries?: number; baseDelayMs?: number } = {}
): Promise<Response> {
  const retries = config.retries ?? 1;
  const baseDelayMs = config.baseDelayMs ?? 300;

  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "";
      if (attempt >= retries || errorName === "AbortError" || errorName === "TimeoutError") throw error;
      await delay(baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 150));
      continue;
    }

    const transient = response.status === 502 || response.status === 503 || response.status === 504;
    if (!transient || attempt >= retries) return response;
    await delay(baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 150));
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
