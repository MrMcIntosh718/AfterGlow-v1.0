import React from 'react';
import { Sparkles, Calendar, Ticket, Users, PlusCircle } from 'lucide-react';
import { SearchAutocomplete } from './SearchAutocomplete';
import { EventItem } from '../types';

interface NavbarProps {
  activeTab: 'aggregator' | 'itinerary' | 'expenses' | 'passes';
  setActiveTab: (tab: 'aggregator' | 'itinerary' | 'expenses' | 'passes') => void;
  onOpenHostModal: () => void;
  passesCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  events?: EventItem[];
  isTicketmasterConnected?: boolean;
  isSearchingTicketmaster?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenHostModal,
  passesCount,
  searchQuery,
  setSearchQuery,
  events = [],
  isTicketmasterConnected = false,
  isSearchingTicketmaster = false,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b0d14]/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('aggregator')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-400 p-[1.5px] shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d101b] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white group-hover:text-rose-300 transition-colors">
                  After<span className="text-gradient-rose">Glow</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Event Planner & Ticket Aggregator
              </p>
            </div>
          </div>

          {/* Quick Search bar with Autocomplete (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <SearchAutocomplete
              searchQuery={searchQuery}
              setSearchQuery={(q) => {
                setSearchQuery(q);
                if (activeTab !== 'aggregator') {
                  setActiveTab('aggregator');
                }
              }}
              events={events}
              onSelectSuggestion={(val) => {
                setSearchQuery(val);
                if (activeTab !== 'aggregator') {
                  setActiveTab('aggregator');
                }
              }}
              isTicketmasterConnected={isTicketmasterConnected}
              isSearchingTicketmaster={isSearchingTicketmaster}
              placeholder="Search by artist, venue, city, state, or ZIP..."
            />
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('aggregator')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'aggregator'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'itinerary'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planner</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'expenses'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Split & Budget</span>
              <span className="sm:hidden">Split</span>
            </button>

            <button
              onClick={() => setActiveTab('passes')}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'passes'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Passes</span>
              {passesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {passesCount}
                </span>
              )}
            </button>

            {/* Host Button */}
            <button
              onClick={onOpenHostModal}
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Host Event</span>
              <span className="lg:hidden">Host</span>
            </button>
          </nav>

        </div>
        
        {/* Mobile search bar with Autocomplete */}
        <div className="md:hidden pb-3">
          <SearchAutocomplete
            searchQuery={searchQuery}
            setSearchQuery={(q) => {
              setSearchQuery(q);
              if (activeTab !== 'aggregator') {
                setActiveTab('aggregator');
              }
            }}
            events={events}
            onSelectSuggestion={(val) => {
              setSearchQuery(val);
              if (activeTab !== 'aggregator') {
                setActiveTab('aggregator');
              }
            }}
            isTicketmasterConnected={isTicketmasterConnected}
            isSearchingTicketmaster={isSearchingTicketmaster}
            placeholder="Search artists, venues, or ZIP codes..."
          />
        </div>

      </div>
    </header>
  );
};
