# Afterglow

Afterglow helps people discover live events and plan road trips around them. It is built with Next.js, React, and TypeScript.

## Features

- Search Ticketmaster events by keyword, city, date range, and category
- Browse event locations on an interactive map
- Build multi-city road trip itineraries and calculate driving legs
- Send ticket clicks through a partner-domain-validated redirect

## Requirements

- Node.js 20.9 or later (required by Next.js 16)
- npm
- A Ticketmaster Discovery API key

Mapbox is optional for location autocomplete, radius searches, and route calculations. See `.env.example` for all supported environment variables.

## Setup

```bash
npm install
Copy-Item .env.example .env.local
```

Add your API keys to `.env.local`. Keep this file private; it is ignored by Git. Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

```bash
npm run dev        # Start the local development server
npm run typecheck  # Check TypeScript types
npm run build      # Create a production build
npm start          # Serve the production build
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TICKETMASTER_API_KEY` | Yes | Event search |
| `MAPBOX_ACCESS_TOKEN` | No | Server-side geocoding and route calculations |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Browser-visible Mapbox token fallback; restrict it by URL in Mapbox settings |
| `GOOGLE_MAPS_API_KEY` | No | Optional Places integrations |
| `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | No | Flight integration template; not connected to the current search flow |
| `PASSKIT_CLIENT_ID`, `PASSKIT_CLIENT_SECRET` | No | PassKit integration template; not connected to the current search flow |

Affiliate template variables are optional. Without them, approved partner links go directly to the ticket provider.

## Notes

- Rate limiting currently uses process memory. For multi-instance or serverless production deployments, use a shared rate-limit store and configure trusted client IP handling at the hosting proxy.
- The app does not include a database; road trip plans are kept in the browser session.
- Do not commit `.env.local` or other files containing credentials.
