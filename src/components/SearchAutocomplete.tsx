import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, Music, Building2, Ticket, Sparkles, X, ChevronRight, Hash } from 'lucide-react';
import { EventItem } from '../types';

export interface SuggestionItem {
  type: 'zip' | 'city' | 'artist' | 'venue' | 'event';
  title: string;
  subtitle: string;
  value: string;
}

interface SearchAutocompleteProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  events: EventItem[];
  onSelectSuggestion?: (value: string) => void;
  isTicketmasterConnected?: boolean;
  isSearchingTicketmaster?: boolean;
  onSubmitSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  searchQuery,
  setSearchQuery,
  events,
  onSelectSuggestion,
  isTicketmasterConnected = false,
  isSearchingTicketmaster = false,
  onSubmitSearch,
  placeholder = 'Search by artist, venue, city, state, or ZIP code (e.g. 10001, Austin TX)...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute suggestions based on events catalogue
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Default suggestions when search input is empty or focused
    if (!q) {
      return [
        { type: 'zip', title: '10001', subtitle: 'New York, NY (Midtown / MSG)', value: '10001' },
        { type: 'zip', title: '78701', subtitle: 'Austin, TX (Downtown / ACL Live)', value: '78701' },
        { type: 'zip', title: '90071', subtitle: 'Los Angeles, CA (Downtown / Rooftops)', value: '90071' },
        { type: 'zip', title: '80465', subtitle: 'Morrison / Denver, CO (Red Rocks)', value: '80465' },
        { type: 'city', title: 'New York, NY', subtitle: 'Brooklyn Mirage, MSG, Comedy Cellar', value: 'New York, NY' },
        { type: 'city', title: 'Los Angeles, CA', subtitle: 'Forum, Standard Rooftop', value: 'Los Angeles, CA' },
        { type: 'artist', title: 'Rufus Du Sol', subtitle: 'Electronic / Melodic House & Techno', value: 'Rufus Du Sol' },
        { type: 'artist', title: 'Dua Lipa', subtitle: 'Pop / Radical Optimism Tour', value: 'Dua Lipa' },
      ] as SuggestionItem[];
    }

    const items: SuggestionItem[] = [];
    const seen = new Set<string>();

    const isNumeric = /^\d+$/.test(q);

    // 1. ZIP Code / Postal Code matches
    events.forEach((e) => {
      if (e.postalCode && (e.postalCode.startsWith(q) || e.postalCode.includes(q))) {
        const key = `zip-${e.postalCode}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            type: 'zip',
            title: `ZIP ${e.postalCode}`,
            subtitle: `${e.city}, ${e.state} • ${e.venue}`,
            value: e.postalCode,
          });
        }
      }
    });

    // 2. City & State matches
    events.forEach((e) => {
      const cityState = `${e.city}, ${e.state}`;
      if (
        e.city.toLowerCase().includes(q) ||
        e.state.toLowerCase() === q ||
        cityState.toLowerCase().includes(q)
      ) {
        const key = `city-${cityState}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            type: 'city',
            title: cityState,
            subtitle: `ZIP ${e.postalCode} • Venues: ${e.venue}`,
            value: cityState,
          });
        }
      }
    });

    // 3. Artist / Performer matches
    events.forEach((e) => {
      if (e.artistOrPerformer.toLowerCase().includes(q)) {
        const key = `artist-${e.artistOrPerformer}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            type: 'artist',
            title: e.artistOrPerformer,
            subtitle: `${e.category} • Playing at ${e.venue}`,
            value: e.artistOrPerformer,
          });
        }
      }
    });

    // 4. Venue matches
    events.forEach((e) => {
      if (e.venue.toLowerCase().includes(q)) {
        const key = `venue-${e.venue}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            type: 'venue',
            title: e.venue,
            subtitle: `${e.city}, ${e.state} ${e.postalCode}`,
            value: e.venue,
          });
        }
      }
    });

    // 5. Specific Event titles
    events.forEach((e) => {
      if (e.title.toLowerCase().includes(q)) {
        const key = `event-${e.title}`;
        if (!seen.has(key)) {
          seen.add(key);
          items.push({
            type: 'event',
            title: e.title,
            subtitle: `${e.formattedDate} • From $${Math.min(...e.ticketPlatforms.flatMap(p => p.tiers.map(t => t.totalPrice)))}`,
            value: e.title,
          });
        }
      }
    });

    return items.slice(0, 8);
  }, [searchQuery, events]);

  const handleSelect = (val: string) => {
    setSearchQuery(val);
    setIsOpen(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(val);
    }
    onSubmitSearch?.(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSubmitSearch?.(searchQuery);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex].value);
      } else {
        onSubmitSearch?.(searchQuery);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getIcon = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'zip':
        return <Hash className="w-4 h-4 text-emerald-400" />;
      case 'city':
        return <MapPin className="w-4 h-4 text-cyan-400" />;
      case 'artist':
        return <Music className="w-4 h-4 text-rose-400" />;
      case 'venue':
        return <Building2 className="w-4 h-4 text-amber-400" />;
      case 'event':
      default:
        return <Ticket className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'zip': return 'ZIP Code';
      case 'city': return 'Location';
      case 'artist': return 'Artist / DJ';
      case 'venue': return 'Venue';
      case 'event': return 'Live Event';
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      
      {/* Search Input Box */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-24 py-2.5 bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/70 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/50 transition-all shadow-inner"
        />

        {/* Clear & Status badges inside input */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSearchingTicketmaster && (
            <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          )}

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            className={`w-2 h-2 rounded-full ${
              isTicketmasterConnected ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-amber-400'
            }`}
            title={
              isTicketmasterConnected
                ? 'Ticketmaster Discovery API Connected'
                : 'Ticketmaster API Ready (Aggregator Mode)'
            }
          />
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-[#0f121d] border border-slate-700/90 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-fade-in max-h-96 flex flex-col">
          
          {/* Top header bar in dropdown */}
          <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-500">
              {searchQuery ? 'Matching Suggestions' : 'Popular Hubs & ZIPs'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${isTicketmasterConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[10px]">
                {isTicketmasterConnected ? 'Ticketmaster Live API' : 'Aggregator Engine'}
              </span>
            </span>
          </div>

          {/* Items */}
          <div className="overflow-y-auto divide-y divide-slate-800/40 py-1">
            {suggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No instant match. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono">Enter</kbd> to search across all event details.
              </div>
            ) : (
              suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={`${item.type}-${item.value}-${idx}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item.value);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-500/15 border-l-2 border-rose-500 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {getIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs sm:text-sm text-white truncate">
                            {item.title}
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60">
                            {getTypeLabel(item.type)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Quick ZIP guide footer */}
          <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-4">
            <span>Tip: Enter any 5-digit ZIP code to filter venue locations directly</span>
            <span className="text-[10px] text-slate-500">↑↓ to navigate • ↵ to select</span>
          </div>

        </div>
      )}

    </div>
  );
};
