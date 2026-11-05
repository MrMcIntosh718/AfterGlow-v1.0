import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, MapPin, Calendar, Clock, Star, Bell, BellOff, 
  ArrowUpDown, ShieldCheck, Ticket, PlusCircle, Check, Sparkles, ChevronRight, Zap
} from 'lucide-react';
import { EventItem, CategoryType } from '../types';

interface TicketAggregatorProps {
  events: EventItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenTicketModal: (event: EventItem) => void;
  onOpenDetailModal: (event: EventItem) => void;
  onAddToPlanner: (event: EventItem) => void;
  onTogglePriceAlert: (eventId: string) => void;
  itineraryEventIds: string[];
}

export const TicketAggregator: React.FC<TicketAggregatorProps> = ({
  events,
  searchQuery,
  setSearchQuery,
  onOpenTicketModal,
  onOpenDetailModal,
  onAddToPlanner,
  onTogglePriceAlert,
  itineraryEventIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [sortBy, setSortBy] = useState<'deal' | 'price-asc' | 'date' | 'rating'>('deal');

  const categories = ['All', 'EDM / Festival', 'Concert', 'Nightlife', 'Sports', 'Comedy', 'Theater'];

  const cities = useMemo(() => {
    const list = Array.from(new Set(events.map((e) => e.city)));
    return ['All', ...list];
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
      // City filter
      if (selectedCity !== 'All' && e.city !== selectedCity) return false;
      // Max price filter
      const minPrice = getMinPrice(e);
      if (minPrice > maxPrice) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(q);
        const matchesArtist = e.artistOrPerformer.toLowerCase().includes(q);
        const matchesVenue = e.venue.toLowerCase().includes(q);
        const matchesCity = e.city.toLowerCase().includes(q);
        const matchesTags = e.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesArtist && !matchesVenue && !matchesCity && !matchesTags) return false;
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
  }, [events, selectedCategory, selectedCity, maxPrice, searchQuery, sortBy]);

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
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city === 'All' ? 'All Locations' : city}
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

      {/* Events Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Showing <b className="text-white">{filteredEvents.length}</b> live aggregated events</span>
        {searchQuery && (
          <span>Filtering for "{searchQuery}"</span>
        )}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Ticket className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No matching events found</h3>
          <p className="text-xs text-slate-400">Try adjusting your budget slider, city filter, or search keywords.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
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
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/90 text-white backdrop-blur">
                      {event.category}
                    </span>
                    {event.isCustomHostEvent && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-slate-950 backdrop-blur">
                        Host Listed
                      </span>
                    )}
                  </div>

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
                        <span className="truncate">{event.venue}, {event.city}</span>
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

    </div>
  );
};
