# Afterglow

Afterglow is intended to help people discover live events and plan road trips around them. The repository currently contains both a Next.js App Router implementation and a legacy Express/Vite runtime. **The runtime has not yet been consolidated.** See [`AUDIT_REPORT.md`](./AUDIT_REPORT.md) for verified findings and the migration sequence.

## Current framework status

- Next.js App Router source exists under `app/` with API routes.
- The current `package.json` scripts still run the legacy Express/Vite app (`tsx server.ts`, `vite build`).
- `package.json` does not currently declare Next.js. Therefore, the README must not be interpreted as evidence that Next.js is presently the production runtime.
- Recommended canonical framework: **Next.js**, after dependencies, routes, environment variables, and production build are migrated and validated.

## Features represented in the repository

- Ticketmaster event search
- Event location/map and road-trip code paths
- Partner-domain-validated ticket redirect

Availability, prices, fees, ratings, inventory, and marketplace comparisons must come from verified providers. Legacy/demo values are not live provider data and should not be presented as real listings.

## Requirements and setup

The active runtime is still the legacy Express/Vite setup until the framework migration is completed. Use the package scripts as they exist in the checked-out branch and do not assume Next.js commands are available. The Next.js source is not yet validated as a standalone production deployment.

```bash
npm install
Copy-Item .env.example .env.local
```

Keep `.env.local` private and out of Git. Configure only credentials for integrations that are implemented and enabled. The current event search is Ticketmaster-backed; Google Places, flight, and PassKit code/configuration should be considered templates unless their active path is verified.

## Validation

No local install, typecheck, lint, production build, or API smoke test has been run as part of the GitHub-only audit. Do not treat this branch's audit as a successful runtime validation. See `AUDIT_REPORT.md` for evidence paths and required follow-up.

## Security

- Never commit `.env.local`, API keys, or other secrets.
- Restrict browser-visible Mapbox tokens by origin in the provider dashboard.
- For multi-instance/serverless deployment, replace process-local rate limiting with a shared store and configure trusted client IP handling at the hosting proxy.
- The repository has no database-backed persistence; road-trip state is client-side/session-oriented.
