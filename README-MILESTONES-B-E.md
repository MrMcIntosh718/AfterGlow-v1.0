# Afterglow Milestones B–E Source Patch

This is a **source patch**, not a full standalone Next.js repository. Apply the files to the matching paths in your project. It intentionally excludes `.env.local`, credentials, `node_modules`, `.next`, Visual Studio `.vs` data, and build caches.

## Implemented

### Milestone B — Synchronized event map and list
- Adds a Leaflet-based interactive map using OpenStreetMap tiles, loaded from the Leaflet CDN at runtime (no package dependency added).
- Uses Ticketmaster venue coordinates when supplied; events without coordinates remain available in the list.
- Synchronizes marker selection and list-card highlighting, with “Show on map” controls.
- Adds an explicit “Search this area” action after the map viewport changes.
- The area search retains the query, date range, category, and radius; pagination continues using the chosen map center.
- Corrects Ticketmaster radius requests to use its `latlong` coordinate parameter rather than passing latitude/longitude as a geohash.

### Milestone C — Session-only itinerary builder
- Add discovered events, attractions, and custom stops.
- Assign dates, optional start times, visit durations, and user-entered cost estimates.
- Reorder or remove stops.
- Clearly discloses that itinerary data is held in page state only and is not durably saved.

### Milestone D — Routing and timing checks
- Adds `POST /api/itinerary/route`, which requests actual sequential driving legs from the existing Mapbox Directions integration.
- Route legs show Mapbox distance and duration results; no fixed or fabricated route values are used.
- Reports missing coordinates, missing dates, unknown costs, visits running past midnight, out-of-order dates, and overlapping scheduled visits.
- Route durations are estimates and do not include live traffic, parking, breaks, or time spent at venues.

### Milestone E — Preliminary budget and disclosures
- Separates source-provided costs (when present), user-entered estimates, and unknown costs.
- Adds editable assumptions for fuel efficiency, fuel price, meals, lodging, nights, and other vehicle expenses.
- Does not classify unknown event/attraction prices as free.
- Shows a known/estimated subtotal while explicitly excluding unconfirmed prices and unentered costs.

### Search reliability carry-forward
- Keeps controlled location input support, removes the restrictive HTML input pattern that rejected legitimate location text, and guards against stale/aborted autocomplete responses overwriting newer suggestions.
- Keeps high-contrast dropdown styles scoped to the autocomplete component.

## Apply
1. Back up the matching files in your working project.
2. Extract this ZIP into the project root, preserving the `ticket-site-internals/` relative paths, or copy each file into its matching relative path if your project root has a different name.
3. Preserve your existing `.env.local`; this patch does not add or replace secrets.
4. Verify that `MAPBOX_ACCESS_TOKEN` (or `NEXT_PUBLIC_MAPBOX_TOKEN`) is set for route-leg calculations and that `TICKETMASTER_API_KEY` is configured for event search.
5. Run your normal install, type-check, and production-build commands in the complete project.

## Verification performed for this patch
- TypeScript/TSX syntax transpilation was run against all changed TypeScript files and completed without syntax diagnostics.
- A smoke test of the itinerary timing utility passed: overlapping visits were flagged and unknown costs produced warnings.
- CSS brace-balance checks passed for the edited stylesheets.

## Verification not completed
A full `tsc` check and Next.js production build could **not** be completed in this environment: `npm ci` timed out twice and the dependency tree remained incomplete (React and Node type definitions were unavailable). No browser end-to-end test was run. Do not treat this patch as production-build-verified until those checks run in the complete repository.

## Operational notes
- The event map needs access to the Leaflet CDN and OpenStreetMap tile service; if the map script is blocked, the component displays a fallback and the event list remains usable.
- OpenStreetMap tiles are subject to OpenStreetMap's tile usage policy.
- The “Search this area” query searches within the configured radius around the map center; it does not search the exact visible viewport polygon.
- The current event provider returns coordinates only when Ticketmaster includes venue location data.
- Durable persistence, accounts, live traffic routing, reservation checks, ticket inventory guarantees, and universal all-in ticket pricing are not included.
