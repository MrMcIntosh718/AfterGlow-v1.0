import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  clampPageSize,
  firstString,
  formatEventDate,
  mapTicketmasterCategory,
} from './src/shared/ticketmasterMapping.ts';

// Load the documented local secrets file first; then allow a plain .env to fill unset values.
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function encodeGeohash(latitude: number, longitude: number, precision = 7): string {
  const alphabet = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latRange: [number, number] = [-90, 90];
  let lonRange: [number, number] = [-180, 180];
  let hash = '';
  let bits = 0;
  let value = 0;
  let even = true;
  while (hash.length < precision) {
    const range = even ? lonRange : latRange;
    const coordinate = even ? longitude : latitude;
    const midpoint = (range[0] + range[1]) / 2;
    value = (value << 1) | (coordinate >= midpoint ? 1 : 0);
    if (coordinate >= midpoint) range[0] = midpoint;
    else range[1] = midpoint;
    even = !even;
    if (++bits === 5) {
      hash += alphabet[value];
      bits = 0;
      value = 0;
    }
  }
  return hash;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Ticketmaster API Key resolution: check process.env.TICKETMASTER_API_KEY, then VITE_TICKETMASTER_API_KEY
  const getTicketmasterKey = () => {
    return process.env.TICKETMASTER_API_KEY || process.env.VITE_TICKETMASTER_API_KEY || '';
  };

  // Status endpoint
  app.get('/api/ticketmaster/status', (req: Request, res: Response) => {
    const key = getTicketmasterKey();
    const hasKey = Boolean(key && key.trim().length > 0);
    res.json({
      connected: hasKey,
      hasKey,
      message: hasKey
        ? 'Ticketmaster Discovery API v2 connected with configured API key'
        : 'Ticketmaster API key not detected in environment. Operating in hybrid aggregator mode.',
    });
  });

  // Ticketmaster Events search proxy
  app.get('/api/ticketmaster/events', async (req: Request, res: Response) => {
    const key = getTicketmasterKey();
    // Query values may be arrays or objects (?keyword=a&keyword=b); normalize to single strings.
    const keyword = firstString(req.query.keyword);
    const postalCode = firstString(req.query.postalCode);
    const city = firstString(req.query.city);
    const stateCode = firstString(req.query.stateCode);
    const requestedRadius = Number.parseInt(firstString(req.query.radius), 10);
    const radius = Number.isFinite(requestedRadius) ? Math.max(1, Math.min(requestedRadius, 250)) : 25;
    const size = clampPageSize(req.query.size);
    const requestedPage = Number.parseInt(firstString(req.query.page), 10);
    const page = Number.isFinite(requestedPage) ? Math.max(0, Math.min(requestedPage, 1000)) : 0;

    if (!key) {
      return res.status(200).json({
        success: false,
        connected: false,
        message: 'No Ticketmaster API key configured. Use environment variable TICKETMASTER_API_KEY.',
        events: [],
      });
    }

    try {
      const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
      url.searchParams.set('apikey', key);
      url.searchParams.set('size', size);
      url.searchParams.set('page', String(page));
      url.searchParams.set('sort', 'date,asc');
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      url.searchParams.set('startDateTime', startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
      url.searchParams.set('endDateTime', endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));

      if (keyword) url.searchParams.set('keyword', keyword);
      if (postalCode || city) {
        const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
        if (mapboxToken) {
          const locationQuery = postalCode || `${city}${stateCode ? `, ${stateCode}` : ''}`;
          const geocodeUrl = new URL('https://api.mapbox.com/search/geocode/v6/forward');
          geocodeUrl.searchParams.set('q', locationQuery);
          geocodeUrl.searchParams.set('country', 'US');
          geocodeUrl.searchParams.set('limit', '1');
          geocodeUrl.searchParams.set('access_token', mapboxToken);
          const geocodeResponse = await fetch(geocodeUrl);
          if (!geocodeResponse.ok) throw new Error('Unable to locate that city or ZIP code for radius search.');
          const geocode = await geocodeResponse.json();
          const center = geocode.features?.[0]?.geometry?.coordinates;
          if (!Array.isArray(center) || center.length < 2) throw new Error('No matching city or ZIP code found. Try adding a state abbreviation.');
          url.searchParams.set('geoPoint', encodeGeohash(Number(center[1]), Number(center[0])));
          url.searchParams.set('radius', String(radius));
          url.searchParams.set('unit', 'miles');
        } else {
          if (postalCode) url.searchParams.set('postalCode', postalCode);
          if (city) url.searchParams.set('city', city);
        }
      }
      if (stateCode) url.searchParams.set('stateCode', stateCode);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AfterGlow-Aggregator/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Ticketmaster API Error] ${response.status}: ${errorText}`);
        return res.status(200).json({
          success: false,
          connected: true,
          status: response.status,
          message: `Ticketmaster API returned HTTP ${response.status}`,
          events: [],
        });
      }

      const data = await response.json();
      const rawEvents = data._embedded?.events || [];

      // Transform Ticketmaster events into AfterGlow EventItem structure
      const transformedEvents = rawEvents.map((ev: any) => {
        const venueObj = ev._embedded?.venues?.[0] || {};
        const venueName = venueObj.name || 'Venue TBA';
        const eventCity = venueObj.city?.name || 'City TBA';
        const eventState = venueObj.state?.stateCode || venueObj.state?.name || 'US';
        const eventZip = venueObj.postalCode || '';
        const latitude = Number.parseFloat(venueObj.location?.latitude);
        const longitude = Number.parseFloat(venueObj.location?.longitude);

        // Select highest quality 16_9 image
        const images = ev.images || [];
        const bestImage = images.find((img: any) => img.ratio === '16_9' && img.width >= 1000)?.url ||
          images[0]?.url ||
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';

        // Pricing extraction
        const priceRange = ev.priceRanges?.[0];
        const startingPrice = Number.isFinite(Number(priceRange?.min)) ? Math.round(Number(priceRange.min)) : null;

        // Formatted dates
        const rawDate = ev.dates?.start?.localDate || '2026-08-01';
        const rawTime = ev.dates?.start?.localTime ? ev.dates.start.localTime.slice(0, 5) : '19:30';
        const formattedDate = formatEventDate(rawDate);

        // Segment / Category mapping
        const genre = ev.classifications?.[0]?.genre?.name || '';
        const segment = ev.classifications?.[0]?.segment?.name || '';
        const category = mapTicketmasterCategory(segment, genre);

        const attractions = ev._embedded?.attractions?.map((a: any) => a.name).join(', ') || ev.name;

        // Only show price data returned by Ticketmaster; fees and inventory are not inferred.
        const ticketPlatforms = [{
          platformName: 'Ticketmaster',
          logoColor: '#026cdf',
          reliabilityScore: 99,
          directUrl: ev.url || 'https://ticketmaster.com',
          tiers: startingPrice === null ? [] : [{
            tierName: 'General Admission',
            basePrice: startingPrice,
            fee: 0,
            totalPrice: startingPrice,
            availableCount: 0,
            dealScore: 'Standard',
            inStock: true,
          }],
        }];

        return {
          id: `tm-${ev.id}`,
          title: ev.name,
          category,
          artistOrPerformer: attractions,
          venue: venueName,
          city: eventCity,
          state: eventState,
          postalCode: eventZip,
          latitude: Number.isFinite(latitude) ? latitude : undefined,
          longitude: Number.isFinite(longitude) ? longitude : undefined,
          date: rawDate,
          formattedDate,
          time: rawTime,
          doorsOpen: 'See Ticketmaster listing',
          bannerUrl: bestImage,
          description: ev.info || ev.pleaseNote || `Live performance by ${attractions} at ${venueName} in ${eventCity}, ${eventState}.`,
          lineup: [
            { time: rawTime, act: attractions, stage: 'Main Stage' },
          ],
          rating: 0,
          reviewsCount: 0,
          ageRestriction: ev.ageRestrictions?.legalAgeEnforced ? '21+' : 'Not listed',
          priceAlertActive: false,
          tags: [genre || 'Live Event', category, 'Ticketmaster Verified', eventCity],
          ticketPlatforms,
          isTicketmasterLive: true,
        };
      });

      res.json({
        success: true,
        connected: true,
        count: transformedEvents.length,
        page: data.page?.number ?? page,
        totalPages: data.page?.totalPages ?? 0,
        events: transformedEvents,
      });
    } catch (err: any) {
      console.error('[Ticketmaster Proxy Error]', err);
      res.status(500).json({
        success: false,
        error: err.message,
        events: [],
      });
    }
  });

  // Dev server or Production static serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AfterGlow v1.0] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AfterGlow v1.0] Fatal startup error:', err);
  process.exit(1);
});

