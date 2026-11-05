# Afterglow — Milestone 1 change log

Canonical project: `ticket-site` (uploaded project copy)

## Implemented

1. **Standardized API errors**
   - Added `lib/api-response.ts`.
   - Error responses now use `{ error, code }` with stable codes such as `BAD_REQUEST`, `VALIDATION_ERROR`, `RATE_LIMITED`, `CONFIGURATION_ERROR`, and `UPSTREAM_ERROR`.
   - Applied to event search, location autocomplete, itinerary route legs, and road-trip routing. Successful response payloads remain unchanged.

2. **Centralized validation**
   - Expanded `lib/input-validation.ts` with strict calendar-date validation, safe bounded string handling, coordinate validation, and stop-ID validation.
   - Applied shared validators at the event, itinerary, road-trip, and Ticketmaster boundaries.
   - Itinerary request bodies are capped at 32 KB, including a byte-count check after reading the body.
   - Date strings are validated in full rather than accepting a valid 10-character prefix followed by extra text.

3. **Affiliate partner validation**
   - Replaced the inherited-property-sensitive `value in PARTNER_DOMAINS` check with `Object.prototype.hasOwnProperty.call`.
   - Kept the HTTPS-only partner-domain allow-list intact.
   - Added request throttling to `/go/[partner]`.

4. **Provider retry and failure handling**
   - Added bounded retry handling for network failures, HTTP 429, and HTTP 5xx responses, with exponential backoff, jitter, and numeric `Retry-After` support.
   - Does not retry ordinary 4xx responses or already-aborted/time-out requests.
   - Applied to Ticketmaster event search, Mapbox geocoding/directions, and Google Places road-trip lookups.
   - Ticketmaster/Mapbox configuration and upstream failures now propagate instead of being silently represented as a successful empty event search.
   - The homepage catches provider failures so the page remains renderable during an outage.

5. **Incoming API rate limits**
   - Events: 60 requests / minute / client key.
   - Location autocomplete: 30 / minute.
   - Itinerary route legs: 20 / minute.
   - Road-trip planner: 8 / minute.
   - Affiliate redirects: 120 / minute.
   - Client identifiers are SHA-256 hashed before use; raw IP values are not stored in the bucket map.
   - The in-memory limiter is bounded to avoid unbounded bucket growth.

## Important deployment limitation

The current rate limiter is **in-memory and per Node.js process**. It protects local development and single-process deployments, but it is not a distributed production limiter: serverless instances or multiple application replicas do not share counters. Before relying on these limits in a multi-instance production deployment, connect a shared atomic store (for example Redis/Upstash) and configure the deployment proxy to overwrite trusted client-IP headers. The current project archive did not contain a configured distributed rate-limit service, so no external service or new credential was invented.

## Files changed

- `app/api/events/route.ts`
- `app/api/locations/route.ts`
- `app/api/itinerary/route/route.ts`
- `app/api/roadtrip/route.ts`
- `app/go/[partner]/route.ts`
- `app/page.tsx`
- `lib/api-response.ts` (new)
- `lib/input-validation.ts`
- `lib/ratelimit.ts`
- `lib/affiliate.ts`
- `lib/partners/index.ts`
- `lib/partners/ticketmaster.ts`
- `.gitignore`

## Validation performed

- Standalone TypeScript check of `lib/input-validation.ts`: passed.
- Runtime assertions for valid/invalid dates, coordinate bounds, stop IDs, partner-name allow-list behavior (including `toString` and `__proto__`), and affiliate URL protocol/domain restrictions: passed.
- Full-project `tsc --noEmit` was attempted but could not complete because this extracted archive has no `node_modules`; Next.js, React, and Node type declarations were unavailable. One JSX typing diagnostic also appeared in the dependency-less run and cannot be assessed without the project's installed React types.
- No production build, browser test, live Ticketmaster/Mapbox/Google request, or end-to-end test was run. Those remain required after installing the project's locked dependencies and supplying valid local environment variables.

## Credential handling

The uploaded project copy included `.env.local`. The delivery ZIP intentionally excludes that file so credentials are not redistributed. `.env.example` is retained. Keep the original local environment file private, and rotate any credentials that were exposed outside their intended environment.
