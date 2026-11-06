import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, MapPin, Calendar, Clock, Star, Bell, BellOff, 
  ArrowUpDown, ShieldCheck, Ticket, PlusCircle, Check, Sparkles, ChevronRight, Zap, RefreshCw, Heart
} from 'lucide-react';
import { EventItem, CategoryType } from '../types';
import { SearchAutocomplete } from './SearchAutocomplete';
import { EventMap } from './EventMap';

interface TicketAggregatorProps {
  events: EventItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenTicketModal: (event: EventItem) => void;
  onOpenDetailModal: (event: EventItem) => void;
  onAddToPlanner: (event: EventItem) => void;
  onTogglePriceAlert: (eventId: string) => void;
  savedEventIds: string[];
  onToggleSaved: (eventId: string) => void;
  itineraryEventIds: string[];
  isTicketmasterConnected?: boolean;
  isSearchingTicketmaster?: boolean;
  onRefreshTicketmaster?: (query?: string) => void;
  onSubmitSearch?: (query: string, radius: number) => void;
  onLoadMore?: (radius: number) => void;
  hasMoreTicketmasterEvents?: boolean;
}

export const TicketAggregator: React.FC<TicketAggregatorProps> = ({
  events,
  searchQuery,
  setSearchQuery,
  onOpenTicketModal,
  onOpenDetailModal,
  onAddToPlanner,
  onTogglePriceAlert,
  savedEventIds,
  onToggleSaved,
  itineraryEventIds,
  isTicketmasterConnected = false,
  isSearchingTicketmaster = false,
  onRefreshTicketmaster,
  onSubmitSearch,
  onLoadMore,
  hasMoreTicketmasterEvents = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [searchRadius, setSearchRadius] = useState(25);
  const [sortBy, setSortBy] = useState<'deal' | 'price-asc' | 'date' | 'rating'>('deal');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const savedSet = useMemo(() => new Set(savedEventIds), [savedEventIds]);
  // Count only saved events that still exist in the catalogue.
  const savedCount = useMemo(() => events.filter((e) => savedSet.has(e.id)).length, [events, savedSet]);

  const categories = ['All', 'EDM / Festival', 'Concert', 'Nightlife', 'Sports', 'Comedy', 'Theater'];

  // State abbreviation to full name dictionary
  const STATE_NAMES: Record<string, string> = {
    ny: 'new york',
    ca: 'california',
    il: 'illinois',
    tx: 'texas',
    co: 'colorado',
    fl: 'florida',
    wa: 'washington',
    nv: 'nevada',
    ga: 'georgia',
    tn: 'tennessee',
    ma: 'massachusetts',
    pa: 'pennsylvania',
    az: 'arizona',
  };

  // Common city & metro aliases for seamless searching
  const METRO_ALIASES: Record<string, string[]> = {
    'new york': ['nyc', 'new york city', 'brooklyn', 'manhattan', 'queens', 'ny'],
    'los angeles': ['la', 'hollywood', 'socal', 'inglewood', 'california', 'ca'],
    'chicago': ['chi', 'chitown', 'windy city', 'illinois', 'il'],
    'austin': ['atx', 'texas', 'tx'],
    'morrison': ['denver', 'colorado', 'red rocks', 'co'],
  };

  const cities = useMemo(() => {
    // Unique list of { city, state }
    const map = new Map<string, string>();
    events.forEach((e) => {
      if (!map.has(e.city)) {
        map.set(e.city, e.state);
      }
    });
    return [
      { city: 'All', state: '', label: 'All Locations' },
      ...Array.from(map.entries()).map(([city, state]) => ({
        city,
        state,
        label: `${city}, ${state}`,
      })),
    ];
  }, [events]);

  // Compute lowest price helper
  const getMinPrice = (event: EventItem) => {
    const allTiers = event.ticketPlatforms.flatMap((p) => p.tiers);
    return Math.min(...allTiers.map((t) => t.totalPrice));
  };

  // Filter & sort
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Category filter
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;

      // Saved-only filter
      if (showSavedOnly && !savedSet.has(e.id)) return false;

      // Max price filter
      const minPrice = getMinPrice(e);
      if (minPrice > maxPrice) return false;

      // Cleaned search query
      const trimmedQuery = searchQuery.trim().toLowerCase();

      // City filter dropdown:
      // If user typed a search query that matches this event's city/state/ZIP, don't let a stale dropdown filter block it
      if (selectedCity !== 'All') {
        const queryMatchesEventLocation = trimmedQuery && (
          e.city.toLowerCase().includes(trimmedQuery) ||
          e.state.toLowerCase() === trimmedQuery ||
          (e.postalCode && e.postalCode.includes(trimmedQuery)) ||
          (STATE_NAMES[e.state.toLowerCase()] && STATE_NAMES[e.state.toLowerCase()].includes(trimmedQuery))
        );
        if (e.city !== selectedCity && !queryMatchesEventLocation) {
          return false;
        }
      }

      // Search query filter (matches artist, title, venue, city, state abbreviation, full state name, ZIP code, combined "city, state", tags, description)
      if (trimmedQuery) {
        const fullStateName = STATE_NAMES[e.state.toLowerCase()] || '';
        const aliases = (METRO_ALIASES[e.city.toLowerCase()] || []).join(' ');

        // Comprehensive searchable document including ZIP code
        const searchableHaystack = [
          e.title,
          e.artistOrPerformer,
          e.venue,
          e.city,
          e.state,
          e.postalCode,
          `zip ${e.postalCode}`,
          `${e.city} ${e.postalCode}`,
          `${e.city}, ${e.state} ${e.postalCode}`,
          fullStateName,
          `${e.city}, ${e.state}`,
          `${e.city} ${e.state}`,
          `${e.city}, ${fullStateName}`,
          `${e.city} ${fullStateName}`,
          aliases,
          e.category,
          e.description,
          ...e.tags,
          ...e.lineup.map((l) => `${l.act} ${l.stage || ''}`),
        ].join(' ').toLowerCase();

        // 1. Direct match check (e.g. "10001", "78701", "new york, ny", "austin, tx", "red rocks", "ca", "ny")
        if (searchableHaystack.includes(trimmedQuery)) {
          return true;
        }

        // 2. Tokenized multi-word search (e.g. "Austin TX 78701", "techno Chicago 60616", "New York concert 10001")
        const tokens = trimmedQuery.split(/[\s,.-]+/).filter(Boolean);
        const allTokensMatch = tokens.length > 0 && tokens.every((token) => {
          if (searchableHaystack.includes(token)) return true;

          // Check if token matches ZIP code prefix or full ZIP
          if (e.postalCode && (e.postalCode.startsWith(token) || e.postalCode.includes(token))) {
            return true;
          }

          // If token corresponds to a state name or state abbreviation
          const stateEntry = Object.entries(STATE_NAMES).find(
            ([abbr, full]) => abbr === token || full === token || full.startsWith(token)
          );
          if (stateEntry) {
            const [abbr, full] = stateEntry;
            if (e.state.toLowerCase() === abbr || fullStateName.includes(token)) {
              return true;
            }
          }

          return false;
        });

        if (!allTokensMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'date') {
        return a.date.localeCompare(b.date);
      }
      // 'deal' default: combination of rating and price
      return (b.rating * 100 - getMinPrice(b)) - (a.rating * 100 - getMinPrice(a));
    });
  }, [events, selectedCategory, selectedCity, maxPrice, searchQuery, sortBy, showSavedOnly, savedSet]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Atmosphere Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170e24] via-[#0d101d] to-[#120f26] border border-rose-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Never Overpay for Live Experiences</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight leading-[1.15]">
            Discover Premier Events.<br />
            <span className="text-gradient-rose">Aggregate Tickets.</span> Plan the <span className="text-gradient-amber">AfterGlow.</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Direct real-time comparison across SeatGeek, Ticketmaster, DICE, StubHub & VividSeats with 100% fee transparency, integrated group timeline planning, and digital wallet passes.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> Zero Hidden Checkout Fees
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Ticket className="w-4 h-4 text-rose-400" /> 7 Major Ticket Exchanges
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" /> Pre-Party to After-Party Timeline
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <div className="space-y-4">
        {/* Category horizontal scrolling bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/25'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Saved events filter (combines with the category filter) */}
          <button
            onClick={() => setShowSavedOnly((prev) => !prev)}
            aria-pressed={showSavedOnly}
            className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
              showSavedOnly
                ? 'bg-rose-500/20 text-rose-200 border-rose-400/60'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current text-rose-400' : ''}`} />
            Saved ({savedCount})
          </button>
        </div>

        {/* Secondary Filters: City, Max Price, Sort */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-4">
            {/* City dropdown */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-rose-500"
              >
                {cities.map((item) => (
                  <option key={item.city} value={item.city}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Max Budget:</span>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-24 sm:w-32 accent-rose-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                ${maxPrice}
              </span>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 justify-end">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-rose-500"
            >
              <option value="deal">Best Value & Deals</option>
              <option value="price-asc">Lowest Price First</option>
              <option value="date">Soonest Date</option>
              <option value="rating">Top Fan Rated</option>
            </select>
          </div>

        </div>
      </div>

      {/* Search Bar with Autocomplete & Ticketmaster Live Bridge */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-2xl">
            <SearchAutocomplete
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              events={events}
              onSelectSuggestion={(val) => setSearchQuery(val)}
              isTicketmasterConnected={isTicketmasterConnected}
              isSearchingTicketmaster={isSearchingTicketmaster}
              onSubmitSearch={(query) => { if (onSubmitSearch) onSubmitSearch(query, searchRadius); else onRefreshTicketmaster?.(query); }}
              placeholder="Search artist, venue, city, state, or ZIP code..."
            />
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 shrink-0">
              <MapPin className="h-4 w-4 text-rose-400" />
              <span>Within</span>
              <select aria-label="Search radius" value={searchRadius} onChange={(e) => setSearchRadius(Number(e.target.value))} className="bg-transparent text-white focus:outline-none">
                {[10, 25, 50, 100, 250].map((miles) => <option key={miles} value={miles} className="bg-slate-900">{miles} mi</option>)}
              </select>
            </label>
            <span className="pl-1 text-[10px] text-slate-500">Applies to city and ZIP searches</span>
          </div>

          {/* Ticketmaster Live API Connection Status Badge */}
          <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shrink-0">
            <div className={`w-2 h-2 rounded-full ${isTicketmasterConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-200">
              {isTicketmasterConnected ? 'Ticketmaster API Connected' : 'Ticketmaster Discovery API Ready'}
            </span>
            {onRefreshTicketmaster && (
              <button
                onClick={onRefreshTicketmaster}
                disabled={isSearchingTicketmaster}
                className="ml-1 p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-all"
                title="Sync Ticketmaster Live Events"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearchingTicketmaster ? 'animate-spin text-rose-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2 shrink-0">
            <span>Showing <b className="text-white">{filteredEvents.length}</b> events</span>
            {searchQuery && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                <span>"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white font-bold ml-0.5"
                  title="Clear search"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EventMap events={filteredEvents} onSelectEvent={onOpenDetailModal} />

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {showSavedOnly && savedCount === 0 ? 'No saved events yet' : 'No matching events found'}
          </h3>
          <p className="text-xs text-slate-400">
            {showSavedOnly && savedCount === 0
              ? 'Tap the heart on any event to save it here.'
              : 'Try adjusting your budget slider, city filter, or search keywords.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setShowSavedOnly(false);
              setSelectedCity('All');
              setMaxPrice(500);
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const minPrice = getMinPrice(event);
            const isInPlanner = itineraryEventIds.includes(event.id);

            // Platform price summary tags
            const platformPrices = event.ticketPlatforms.map((p) => {
              const lowestTier = Math.min(...p.tiers.map((t) => t.totalPrice));
              return { name: p.platformName, price: lowestTier };
            }).sort((a, b) => a.price - b.price);

            return (
              <div
                key={event.id}
                className="group relative rounded-2xl bg-[#0f121d] border border-slate-800/80 hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-950/30 transition-all flex flex-col overflow-hidden"
              >
                {/* Banner Image */}
                <div 
                  onClick={() => onOpenDetailModal(event)}
                  className="relative h-48 overflow-hidden cursor-pointer"
                >
                  <img
                    src={event.bannerUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f121d] via-[#0f121d]/30 to-black/40" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/90 text-white backdrop-blur">
                      {event.category}
                    </span>
                    {event.isTicketmasterLive && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-600/95 text-white backdrop-blur flex items-center gap-1 shadow-md">
                        <Ticket className="w-3 h-3" /> Ticketmaster Live
                      </span>
                    )}
                    {event.isCustomHostEvent && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-slate-950 backdrop-blur">
                        Host Listed
                      </span>
                    )}
                  </div>

                  {/* Save (heart) button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSaved(event.id);
                    }}
                    aria-pressed={savedSet.has(event.id)}
                    className={`absolute top-3 right-14 p-2 rounded-full backdrop-blur-md transition-all ${
                      savedSet.has(event.id)
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80'
                    }`}
                    title={savedSet.has(event.id) ? 'Remove from saved' : 'Save event'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${savedSet.has(event.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Price alert button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePriceAlert(event.id);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                      event.priceAlertActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-black/60 text-slate-300 hover:text-white hover:bg-black/80'
                    }`}
                    title={event.priceAlertActive ? 'Price alert active' : 'Notify when price drops'}
                  >
                    {event.priceAlertActive ? (
                      <Bell className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Rating on image */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-amber-400 font-semibold bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{event.rating}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    
                    <div 
                      onClick={() => onOpenDetailModal(event)}
                      className="cursor-pointer"
                    >
                      <h3 className="font-display font-bold text-base sm:text-lg text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-rose-400 font-medium line-clamp-1 mt-0.5">
                        {event.artistOrPerformer}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{event.formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{event.venue}, {event.city}, {event.state}</span>
                        {event.postalCode && (
                          <span className="ml-auto font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            ZIP {event.postalCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Platform comparison price chips */}
                    <div className="pt-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1 flex items-center justify-between">
                        <span>Aggregated Best Prices</span>
                        <span className="text-emerald-400 font-normal">Fees incl.</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {platformPrices.map((item, idx) => (
                          <span
                            key={item.name}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              idx === 0
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {item.name}: <b className="text-white">${item.price}</b>
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">From</span>
                      <span className="text-lg font-bold font-display text-white">
                        ${minPrice}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddToPlanner(event)}
                        className={`p-2 rounded-xl transition-all border ${
                          isInPlanner
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                        }`}
                        title={isInPlanner ? 'Added to itinerary' : 'Add to itinerary'}
                      >
                        {isInPlanner ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <PlusCircle className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => onOpenTicketModal(event)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Compare & Buy</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMoreTicketmasterEvents && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => onLoadMore(searchRadius)}
            disabled={isSearchingTicketmaster}
            className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200 hover:border-rose-500/50 hover:text-white disabled:opacity-50 transition-colors"
          >
            {isSearchingTicketmaster ? 'Loading events…' : 'Load more upcoming events'}
          </button>
        </div>
      )}

    </div>
  );
};

