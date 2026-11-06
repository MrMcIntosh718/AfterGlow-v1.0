import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  clampPageSize,
  firstString,
  formatEventDate,
  mapTicketmasterCategory,
  pickPriceRange,
  safeHttpsUrl,
} from './src/shared/ticketmasterMapping.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const size = clampPageSize(req.query.size);

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
      url.searchParams.set('sort', 'date,asc');

      if (keyword) url.searchParams.set('keyword', keyword);
      if (postalCode) url.searchParams.set('postalCode', postalCode);
      if (city) url.searchParams.set('city', city);
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

        // Select highest quality 16_9 image
        const images = ev.images || [];
        const bestImage = images.find((img: any) => img.ratio === '16_9' && img.width >= 1000)?.url ||
          images[0]?.url ||
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';

        // Price range exactly as Ticketmaster publishes it (undefined when it doesn't).
        const priceRange = pickPriceRange(ev.priceRanges);

        // Formatted dates
        const rawDate = ev.dates?.start?.localDate || '2026-08-01';
        const rawTime = ev.dates?.start?.localTime ? ev.dates.start.localTime.slice(0, 5) : '19:30';
        const formattedDate = formatEventDate(rawDate);

        // Segment / Category mapping
        const genre = ev.classifications?.[0]?.genre?.name || '';
        const segment = ev.classifications?.[0]?.segment?.name || '';
        const category = mapTicketmasterCategory(segment, genre);

        const attractions = ev._embedded?.attractions?.map((a: any) => a.name).join(', ') || ev.name;

        return {
          id: `tm-${ev.id}`,
          title: ev.name,
          category,
          artistOrPerformer: attractions,
          venue: venueName,
          city: eventCity,
          state: eventState,
          postalCode: eventZip,
          date: rawDate,
          formattedDate,
          time: rawTime,
          doorsOpen: '1 hour before show',
          bannerUrl: bestImage,
          description: ev.info || ev.pleaseNote || `Live performance by ${attractions} at ${venueName} in ${eventCity}, ${eventState}.`,
          // Ticketmaster's Discovery API gives no stage schedule, ratings, stock, or competitor
          // prices, so none are invented here: the UI shows only what the source returned.
          lineup: [],
          // legalAgeEnforced only says an age limit applies, not which one; absence isn't "All Ages".
          ageRestriction: ev.ageRestrictions?.legalAgeEnforced ? 'Age-restricted' : 'See event page',
          priceAlertActive: false,
          tags: [genre || 'Live Event', category, 'Ticketmaster', eventCity],
          ticketPlatforms: [],
          priceRange,
          ticketUrl: safeHttpsUrl(ev.url),
          isTicketmasterLive: true,
        };
      });

      res.json({
        success: true,
        connected: true,
        count: transformedEvents.length,
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
