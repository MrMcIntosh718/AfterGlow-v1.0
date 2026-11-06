# Afterglow

Afterglow helps people discover live events and plan road trips around them. The runnable app uses Vite, Express, React, and TypeScript.

## Features

- Search Ticketmaster events by keyword, city, date range, and category
- Browse event locations on an interactive map
- Build multi-city road trip itineraries and calculate driving legs
- Send ticket clicks through a partner-domain-validated redirect

## Requirements

- Node.js 20.9 or later
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
npm run lint       # Check TypeScript types
npm run build      # Create a production build
npm start          # Serve the production build
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TICKETMASTER_API_KEY` | Yes | Event search |
| `BRIGHTDATA_API_KEY` | No | Server-side search and event-page extraction |
| `BRIGHTDATA_SERP_ZONE` | No | Bright Data SERP or Unlocker zone for Google search |
| `BRIGHTDATA_UNLOCKER_ZONE` | No | Bright Data Unlocker zone for fetching result pages |
| `MAPBOX_ACCESS_TOKEN` | No | Server-side geocoding and route calculations |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Browser-visible Mapbox token fallback; restrict it by URL in Mapbox settings |
| `GOOGLE_MAPS_API_KEY` | No | Optional Places integrations |
| `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET` | No | Flight integration template; not connected to the current search flow |
| `PASSKIT_CLIENT_ID`, `PASSKIT_CLIENT_SECRET` | No | PassKit integration template; not connected to the current search flow |

Affiliate template variables are optional. Without them, approved partner links go directly to the ticket provider.

## Bright Data event discovery

The event search page includes an on-demand Bright Data search. It uses SERP results to find event pages, then reads up to five pages and keeps records with structured event dates and venue details. The interface links to each event page and the page used as its source. Results are cached for five minutes; searches are limited to five per minute. A search can make up to six Bright Data requests (one search plus five page fetches).

Set the three Bright Data variables in `.env.local` or in your deployment's server environment. The SERP and Unlocker variables must name zones available in your Bright Data account; they can be the same zone if it supports both products. Keep the API key server-side and never prefix it with `VITE_`.

## Notes

- Rate limiting currently uses process memory. For multi-instance or serverless production deployments, use a shared rate-limit store and configure trusted client IP handling at the hosting proxy.
- The app does not include a database; road trip plans are kept in the browser session.
- Do not commit `.env.local` or other files containing credentials.
