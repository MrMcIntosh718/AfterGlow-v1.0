import React, { useState } from 'react';

type DiscoveredEvent = {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  postalCode: string;
  address: string;
  eventUrl: string;
  sourceUrl: string;
  sourceDomain: string;
  venueDetailsFound: boolean;
};

type SearchState = 'idle' | 'loading' | 'ready' | 'error';

export function BrightDataDiscoveries({ keyword }: { keyword: string }) {
  const [state, setState] = useState<SearchState>('idle');
  const [events, setEvents] = useState<DiscoveredEvent[]>([]);
  const [message, setMessage] = useState('');

  async function searchWeb() {
    if (!keyword.trim() || state === 'loading') return;
    setState('loading');
    setMessage('');
    try {
      const params = new URLSearchParams({ keyword: keyword.trim() });
      const response = await fetch(`/api/brightdata/events?${params.toString()}`);
      const result = await response.json() as { events?: DiscoveredEvent[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Web event search is unavailable.');
      setEvents(Array.isArray(result.events) ? result.events : []);
      setState('ready');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Web event search is unavailable.');
      setState('error');
    }
  }

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 p-4 sm:p-5 space-y-4" aria-label="Bright Data web event search">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Find more events on the web</h3>
          <p className="mt-1 text-xs text-slate-400">Bright Data checks event pages for dates and venue details. Search runs only when you press the button.</p>
        </div>
        <button
          type="button"
          onClick={searchWeb}
          disabled={!keyword.trim() || state === 'loading'}
          className="shrink-0 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === 'loading' ? 'Searching and checking pages…' : state === 'ready' ? 'Search again' : 'Search with Bright Data'}
        </button>
      </div>

      {state === 'error' && <p className="text-xs text-rose-300" role="alert">{message}</p>}
      {state === 'ready' && events.length === 0 && (
        <p className="text-xs text-slate-400" role="status">No event pages with readable date and venue details were found. Try an artist, venue, or city name.</p>
      )}
      {state === 'ready' && events.length > 0 && (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h4 className="font-semibold text-white text-sm">{event.title}</h4>
              <p className="mt-1 text-xs text-slate-300">
                {new Date(`${event.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                {' · '}{[event.venue, event.city, event.state].filter(Boolean).join(', ')}
              </p>
              {event.address && <p className="mt-1 text-xs text-slate-400">{event.address}</p>}
              <p className="mt-2 text-[11px] text-emerald-300">
                {event.venueDetailsFound ? 'Venue name and location found on the event page' : 'Venue name found on the event page'}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <a href={event.eventUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-100 underline underline-offset-2">Event page</a>
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white underline underline-offset-2">Source: {event.sourceDomain}</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
