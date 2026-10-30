# Code review

Reviewed the Afterglow app in October 2026. The TypeScript check passes. The project has useful API-boundary validation, a partner-host allowlist for redirects, typed provider errors, and retry/timeout handling in the main Ticketmaster and Mapbox flows.

## Recommended improvements

### 1. Use shared rate limiting in production

`lib/ratelimit.ts` stores counters in a process-local `Map`. Counters reset on restart and are not shared between serverless instances, so the configured per-route limits are best-effort outside a single long-lived process. The client address is read from proxy headers; these headers must be overwritten by a trusted hosting proxy, or clients may spoof them.

**Suggested edit:** use a shared store such as Redis or the host's rate-limit service, and document/configure the trusted proxy boundary. Keep the in-memory implementation for local development if useful.

### 2. Avoid reporting optional provider failures as empty results

The Google Places, Amadeus, and PassKit modules currently catch provider/configuration errors and return empty result arrays. If these integrations are wired into user-facing flows, users will not be able to tell “no results” from “provider unavailable.” The modules also contain placeholder or explicitly unverified API behavior.

**Suggested edit:** before enabling any integration, return a typed result or throw `ProviderError`, add bounded timeouts, validate the provider response shape, and confirm the endpoint and credential flow against the provider's current documentation.

### 3. Add automated checks for API boundary behavior

The current package scripts provide a TypeScript check and production build, but no automated tests are configured. Important cases include malformed date ranges, half-specified coordinates, oversized itinerary bodies, rate-limit responses, affiliate redirect host validation, and upstream timeouts.

**Suggested edit:** add focused unit tests for validation and affiliate URL rules, followed by route tests using mocked provider responses. Add these checks to CI once the test runner is selected.

### 4. Keep setup and feature documentation aligned with the shipped app

The Google Places, Amadeus, and PassKit modules are integration templates, not active features in the event search flow. Their status should stay clear in user-facing documentation until those flows are implemented.

**Applied:** the README now gives valid setup commands, documents the environment variables, and accurately labels optional integrations. The partner entry-point comment no longer points to a missing changelog.
