# Afterglow Milestone 2 — Road Trip Accuracy & Itinerary Synchronization

## Source baseline

This milestone was applied to the uploaded `afterglow-merged.zip` project (`ticket-site/`). The separate `files for project.zip` archive contains divergent versions of some files; the merged archive was used as the primary baseline because it includes the Milestone 1 change log, provider error handling, and the `typecheck` package script. The road-trip provider retry behavior from the alternate archive was retained for Ticketmaster requests. No local Windows project was modified.

## Changes

### `lib/roadtrip-geo.ts` — new
- Adds distance-based route sampling using cumulative polyline distance rather than coordinate-array indexes.
- Adds shortest point-to-route distance calculation for venue/attraction coordinates.
- Keeps the calculations dependency-free.

### `app/api/roadtrip/route.ts`
- Searches Ticketmaster at distance-spaced points along the full Mapbox driving geometry (up to 18 event sample points).
- Uses bounded concurrency for provider requests.
- Filters returned events against the actual Mapbox route corridor (20 miles).
- Requires usable venue coordinates for corridor verification; events without coordinates are excluded rather than treated as confirmed route stops.
- Applies a final venue-local calendar-date filter after Ticketmaster returns results.
- Deduplicates events by ID and retains the closest-to-route record.
- Filters Google Places attractions against a 16-mile route corridor, with a smaller, separately sampled set of points to limit billed Places calls.
- Uses the existing retry helper for idempotent Ticketmaster requests; Google Places requests are not retried because those calls are billed.

### `components/roadtrip-planner.tsx`
- Shows each event/attraction's straight-line distance from the route.
- Clears selected itinerary stops and calculated route legs after a successful search when the route or travel-date window changes.
- Preserves itinerary selections when rerunning the same route/date search.
- Updates the disclaimer to describe the route corridor and non-exhaustive provider coverage.

## Validation performed

- `lib/roadtrip-geo.ts`: strict standalone TypeScript check passed.
- `app/api/roadtrip/route.ts`: strict TypeScript check passed using temporary ambient declarations for the absent Next.js/Node type packages; temporary declarations were removed afterward.
- `components/roadtrip-planner.tsx`: TypeScript/JSX check passed using temporary framework/component declarations; temporary declarations were removed afterward.
- Node runtime checks on a synthetic polyline passed:
  - Point on the route: 0.0 miles from route.
  - Nearby point: approximately 6.9 miles from route.
  - Off-corridor point: approximately 27.7 miles from route.
  - Sampling produced distance-spaced points along the line.
- Source syntax transpilation passed for the API route, planner component, and new geo helper.

## Not verified

- A full `next build` or real-browser test was not run because the uploaded archive does not include `node_modules`.
- No live Mapbox, Ticketmaster, or Google Places requests were made. Real New York City → Cincinnati results still need to be checked with the user's local `.env.local` credentials.
- The route-corridor check is a straight-line distance to the Mapbox route polyline, not a calculation of additional driving detour distance.
- Event discovery is bounded by Ticketmaster's per-sample result size and the maximum of 18 route samples; it is more route-accurate but not exhaustive.
