# Afterglow

Afterglow helps people discover Ticketmaster events and plan road trips around them. The canonical application on this branch uses **Next.js App Router, React, and TypeScript**.

## Features

- Search Ticketmaster events by keyword, city, date range, and category
- Browse event locations on an interactive map
- Build multi-city road-trip itineraries and calculate driving legs
- Send ticket clicks through a partner-domain-validated redirect

## Runtime

The legacy Express/Vite server and its mock event feed have been removed. Use the Next.js scripts:

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

```bash
npm run dev        # Next.js development server
npm run typecheck  # TypeScript check
npm run lint       # TypeScript check (lint script currently aliases typecheck)
npm run build      # Next.js production build
npm start          # Serve the production build
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TICKETMASTER_API_KEY` | Yes for event search | Ticketmaster Discovery API |
| `MAPBOX_ACCESS_TOKEN` | No | Server-side geocoding and route calculations |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Browser-visible Mapbox token fallback; restrict it by URL in Mapbox settings |
| `GOOGLE_MAPS_API_KEY` | No | Integration template; not currently connected to event search |
| `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | No | Flight integration template; not currently connected to search |
| `PASSKIT_CLIENT_ID`, `PASSKIT_CLIENT_SECRET` | No | PassKit integration template; not currently connected to search |

Only Ticketmaster is used by the event search entry point. Google Places, Amadeus, and PassKit code should be treated as unenabled templates until implemented and verified. The app must not show fabricated prices, fees, availability, ratings, or competitor comparisons.

## Validation status

The GitHub cleanup updated the package manifest and TypeScript configuration but did not run npm locally. Regenerate/check `package-lock.json` before using `npm ci`, then run:

```bash
npm install
npm run typecheck
npm run build
```

See [AUDIT_REPORT.md](./AUDIT_REPORT.md) for cleanup details and remaining validation.

## Security notes

- Never commit `.env.local`, API keys, or credentials.
- Restrict browser-visible Mapbox tokens by origin in the provider dashboard.
- Rate limiting currently uses process memory; multi-instance/serverless deployment should use a shared store and a trusted proxy boundary.
- Road-trip plans are client-side/session-oriented; there is no database-backed persistence.
