# Merged: Milestone 1 + review fixes

Base: your `Afterglow_Milestone1_Updated.zip`. Kept all of Milestone 1 (standard `{ error, code }` API errors,
itinerary 32 KB body cap and stop-ID validation, `/go` rate limit, hashed client keys, `Object.hasOwn`-style partner check,
`.gitignore`). `MILESTONE_1_CHANGELOG.md` is unchanged.

## Changed on top of Milestone 1
| Issue in Milestone 1 | Fix |
|---|---|
| Home page still called `searchEverything` (paid Google + hardcoded JFK to LAX calls, results discarded) | Home page calls `searchEvents` only. `searchEverything` removed. |
| Provider outage showed "No events found" (error was only logged) | Home page shows a "couldn't load events" state with a retry link. |
| Unknown city threw, so a typo looked like an outage | Unknown city returns an empty result. Missing config and upstream failures throw `ProviderError` (`lib/errors.ts`). |
| Plain `Error`s could not be told apart | `ProviderError` has `code`: `not-configured` / `upstream` / `timeout`. `/api/events` maps these to 503 `CONFIGURATION_ERROR` / 502 `UPSTREAM_ERROR`. |
| Retries on 429 and 5xx, up to 2, on every provider incl. billed Google Places | `fetchWithRetry`: 1 retry, only network errors and 502/503/504, never 429 or timeouts. Road-trip Ticketmaster + Google Places calls use plain `fetch` (parallel, billed). Mapbox/Ticketmaster-search keep the retry. |
| Misleading `fetchWithRateLimit` aliases | Removed (nothing used them). |
| Unused validators (`isValidEmail`, `isValidUrl`, ...) | Removed; `isValidDate` is now a type guard. |
| `lib/itinerary.ts` strict-mode error (`next build` would fail) | Fixed. |
| Autocomplete limit 30/min | 60/min (debounced typing was close to the old limit). Road-trip 8 to 6/min (about 15 provider calls each). |
| Road-trip: in-place array sort, silently swallowed lookup failures | Copy before sort; failures logged. |
| "Load more" hid the real error | Shows the server message; friendly text on 429. |
| Housekeeping | `next.config.ts` security headers + `poweredByHeader: false`; `npm run typecheck`; `.env.example` documents server-only vs public Mapbox token; removed `itinerary.ts.tmp` and `destination-form-example.tsx`. |

## Verified vs not
Verified: server code type-checks under `strict` (stubs for `next/server`); behaviour tests pass for dates, partner
allow-list (`constructor`, `__proto__`), rate limiter, retry policy, unknown-city, missing-key, upstream-500, happy path,
itinerary ordering. NOT verified: `next build`, React components, live API calls. Run
`npm install && npm run typecheck && npm run build`.

## Still your call
- Rate limiting is in-memory per instance: use a shared store (e.g. Upstash Redis) on serverless/multi-instance hosting,
  and make sure your proxy overwrites `x-forwarded-for`.
- Unused: `lib/partners/flights.ts` (no Amadeus OAuth token), `googleplaces.ts`, `passkit.ts`, `components/FlightSearchComponent.tsx`.
- `*_AUDIT*.md` / `FEATURE_PROPOSALS.md` describe work that was not done; treat as outdated.
- Rotate the Ticketmaster key, Mapbox token and PassKit secret from the original `.env.local`.
