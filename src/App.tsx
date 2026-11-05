import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TicketAggregator } from './components/TicketAggregator';
import { ItineraryView } from './components/ItineraryView';
import { GroupExpensesView } from './components/GroupExpensesView';
import { MyPassesView } from './components/MyPassesView';
import { TicketModal } from './components/TicketModal';
import { EventDetailModal } from './components/EventDetailModal';
import { HostEventModal } from './components/HostEventModal';
import { INITIAL_EVENTS } from './data/mockEvents';
import { EventItem, EventItinerary, UserPass } from './types';
import { Sparkles, Heart } from 'lucide-react';
import { checkTicketmasterStatus, fetchTicketmasterEvents } from './services/ticketmaster';

const INITIAL_ITINERARY: EventItinerary = {
  id: 'plan-mirage-fest',
  eventId: 'afterglow-fest-2026',
  eventTitle: 'AfterGlow Neon Horizons Festival 2026',
  eventDate: 'Saturday, June 20, 2026',
  eventVenue: 'The Brooklyn Mirage',
  eventCity: 'New York, NY',
  bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  notes: 'Bring earplugs, hydration packs, and portable chargers. Pre-drinks at House of Yes rooftop.',
  schedule: [
    { id: 's1', time: '3:30 PM', title: 'Crew Meetup & Pre-Drinks', type: 'pre-party', location: 'House of Yes Courtyard' },
    { id: 's2', time: '5:30 PM', title: 'Arrive at Mirage & Security Entry', type: 'travel', location: 'Brooklyn Mirage Gate B' },
    { id: 's3', time: '6:30 PM', title: 'Lane 8 Sunset Set', type: 'main', location: 'Main Stage' },
    { id: 's4', time: '11:00 PM', title: 'Rufus Du Sol Live Spectacle', type: 'main', location: 'Main Stage' },
    { id: 's5', time: '1:30 AM', title: 'Tale of Us AfterGlow Sunrise Gathering', type: 'afterglow', location: 'Kings Hall Lounge' },
    { id: 's6', time: '4:30 AM', title: 'Late Night Diner & Post-Mortem', type: 'food', location: 'Kellogg’s Diner Williamsburg' },
  ],
  crew: [
    { id: 'c1', name: 'Alex Hunter', avatar: '#f43f5e', status: 'host' },
    { id: 'c2', name: 'Jordan Rivera', avatar: '#3b82f6', status: 'confirmed' },
    { id: 'c3', name: 'Elena Rostova', avatar: '#10b981', status: 'confirmed' },
    { id: 'c4', name: 'Marcus Chen', avatar: '#f59e0b', status: 'maybe' },
  ],
  expenses: [
    { id: 'e1', title: '4x Early Bird VIP Passes (SeatGeek)', payerId: 'c1', amount: 388, category: 'Tickets', splitAmongIds: ['c1', 'c2', 'c3', 'c4'] },
    { id: 'e2', title: 'Uber XL from Manhattan to Brooklyn', payerId: 'c2', amount: 64, category: 'Rideshare', splitAmongIds: ['c1', 'c2', 'c3', 'c4'] },
    { id: 'e3', title: 'Pre-Festival Cocktail Pitchers', payerId: 'c3', amount: 110, category: 'Drinks / Food', splitAmongIds: ['c1', 'c2', 'c3', 'c4'] },
  ],
  checklist: [
    { id: 'k1', text: 'State ID or Passport (Strict 21+ at door)', done: true, category: 'essentials' },
    { id: 'k2', text: 'Digital wallet pass loaded with brightness up', done: true, category: 'tickets' },
    { id: 'k3', text: 'High-fidelity acoustic earplugs (19dB filter)', done: true, category: 'gear' },
    { id: 'k4', text: 'Portable power bank and USB-C cable', done: false, category: 'gear' },
    { id: 'k5', text: 'Credit card for cashless venue bars', done: false, category: 'essentials' },
  ],
};

const INITIAL_PASS: UserPass = {
  id: 'pass-sample-01',
  eventId: 'afterglow-fest-2026',
  eventTitle: 'AfterGlow Neon Horizons Festival 2026',
  venue: 'The Brooklyn Mirage / Avant Gardner',
  city: 'New York, NY',
  date: 'Saturday, June 20, 2026',
  time: '4:00 PM - 4:00 AM',
  doorsOpen: '3:30 PM',
  tier: 'VIP Pit / Lounge',
  platform: 'SeatGeek',
  pricePaid: 252,
  quantity: 1,
  qrCodeData: 'AFTERGLOW-FEST-2026-VIP-9948',
  barcodeNumber: '84920491048821',
  seatInfo: 'VIP Pit & Mezanine Lounge',
  gate: 'Gate B (VIP Fast Track)',
  holderName: 'Alex Hunter',
  purchasedAt: 'May 12, 2026',
};

export function App() {
  const [activeTab, setActiveTab] = useState<'aggregator' | 'itinerary' | 'expenses' | 'passes'>('aggregator');
  const [events, setEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('afterglow_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });
  const [itineraries, setItineraries] = useState<EventItinerary[]>(() => {
    const saved = localStorage.getItem('afterglow_itineraries');
    return saved ? JSON.parse(saved) : [INITIAL_ITINERARY];
  });
  const [passes, setPasses] = useState<UserPass[]>(() => {
    const saved = localStorage.getItem('afterglow_passes');
    return saved ? JSON.parse(saved) : [INITIAL_PASS];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [ticketModalEvent, setTicketModalEvent] = useState<EventItem | null>(null);
  const [detailModalEvent, setDetailModalEvent] = useState<EventItem | null>(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTicketmasterConnected, setIsTicketmasterConnected] = useState(false);
  const [isSearchingTicketmaster, setIsSearchingTicketmaster] = useState(false);

  // Check Ticketmaster API connectivity on startup
  useEffect(() => {
    let isMounted = true;
    checkTicketmasterStatus().then((status) => {
      if (isMounted) {
        setIsTicketmasterConnected(status.connected);
        if (status.connected) {
          showToast('Ticketmaster Discovery API v2 connected! Live inventory active.');
          setIsSearchingTicketmaster(true);
          fetchTicketmasterEvents({ size: '10' }).then((res) => {
            if (isMounted && res.success && res.events.length > 0) {
              setEvents((prev) => {
                const existingIds = new Set(prev.map((e) => e.id));
                const newOnes = res.events.filter((e) => !existingIds.has(e.id));
                return [...newOnes, ...prev];
              });
            }
            if (isMounted) setIsSearchingTicketmaster(false);
          });
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('afterglow_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('afterglow_itineraries', JSON.stringify(itineraries));
  }, [itineraries]);

  useEffect(() => {
    localStorage.setItem('afterglow_passes', JSON.stringify(passes));
  }, [passes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefreshTicketmaster = async () => {
    setIsSearchingTicketmaster(true);
    showToast('Checking Ticketmaster Discovery API for live events & ZIP matches...');
    
    const trimmed = searchQuery.trim();
    const isZip = /^\d{5}$/.test(trimmed);
    const res = await fetchTicketmasterEvents({
      postalCode: isZip ? trimmed : undefined,
      keyword: !isZip && trimmed ? trimmed : undefined,
    });

    setIsSearchingTicketmaster(false);
    if (res.success && res.events.length > 0) {
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newOnes = res.events.filter((e) => !existingIds.has(e.id));
        return [...newOnes, ...prev];
      });
      showToast(`Loaded ${res.events.length} live Ticketmaster events!`);
    } else if (!isTicketmasterConnected) {
      showToast('Ticketmaster API ready in aggregator mode. Configured via TICKETMASTER_API_KEY.');
    } else {
      showToast('Ticketmaster query finished — catalogue up to date.');
    }
  };

  const handleTicketPurchased = (newPass: UserPass) => {
    setPasses((prev) => [newPass, ...prev]);
    showToast(`Pass issued for ${newPass.eventTitle}! Saved to digital wallet.`);
  };

  const handleAddToPlanner = (event: EventItem) => {
    const alreadyExists = itineraries.some((p) => p.eventId === event.id);
    if (alreadyExists) {
      showToast(`"${event.title}" is already in your Planner!`);
      setActiveTab('itinerary');
      return;
    }

    const newPlan: EventItinerary = {
      id: `plan-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.formattedDate,
      eventVenue: event.venue,
      eventCity: `${event.city}, ${event.state}`,
      bannerUrl: event.bannerUrl,
      notes: `Custom itinerary for ${event.title}`,
      schedule: [
        { id: `s-${Date.now()}-1`, time: '6:00 PM', title: 'Meetup & Dinner / Drinks', type: 'pre-party', location: 'Nearby Lounge' },
        { id: `s-${Date.now()}-2`, time: event.doorsOpen, title: 'Doors Open & Venue Arrival', type: 'travel', location: event.venue },
        { id: `s-${Date.now()}-3`, time: event.time.split(' - ')[0] || event.time, title: `${event.artistOrPerformer} Main Show`, type: 'main', location: event.venue },
        { id: `s-${Date.now()}-4`, time: '1:00 AM', title: 'Official AfterGlow Gathering', type: 'afterglow', location: 'Rooftop / Afters' },
      ],
      crew: [
        { id: `crew-${Date.now()}`, name: 'You (Host)', avatar: '#f43f5e', status: 'host' },
      ],
      expenses: [],
      checklist: [
        { id: `k-${Date.now()}-1`, text: 'Government Photo ID', done: true, category: 'essentials' },
        { id: `k-${Date.now()}-2`, text: 'AfterGlow Mobile Pass', done: true, category: 'tickets' },
        { id: `k-${Date.now()}-3`, text: 'Fully Charged Phone', done: false, category: 'gear' },
      ],
    };

    setItineraries((prev) => [...prev, newPlan]);
    showToast(`Added "${event.title}" to your Planner!`);
    setActiveTab('itinerary');
  };

  const handleTogglePriceAlert = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const nextState = !e.priceAlertActive;
          showToast(nextState ? `Price alert activated for ${e.title}` : `Price alert turned off`);
          return { ...e, priceAlertActive: nextState };
        }
        return e;
      })
    );
  };

  const handleEventCreated = (newEvent: EventItem) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(`Published "${newEvent.title}" to the aggregator!`);
  };

  const handleDeletePass = (passId: string) => {
    setPasses((prev) => prev.filter((p) => p.id !== passId));
    showToast('Pass removed from wallet');
  };

  const itineraryEventIds = itineraries.map((p) => p.eventId);

  return (
    <div className="min-h-screen bg-[#0b0d14] text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-rose-900/90 to-slate-900/95 border border-rose-500/40 text-white text-xs sm:text-sm font-semibold shadow-2xl shadow-rose-950/80 flex items-center gap-3 backdrop-blur-xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHostModal={() => setIsHostModalOpen(true)}
        passesCount={passes.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        events={events}
        isTicketmasterConnected={isTicketmasterConnected}
        isSearchingTicketmaster={isSearchingTicketmaster}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'aggregator' && (
          <TicketAggregator
            events={events}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenTicketModal={(e) => setTicketModalEvent(e)}
            onOpenDetailModal={(e) => setDetailModalEvent(e)}
            onAddToPlanner={handleAddToPlanner}
            onTogglePriceAlert={handleTogglePriceAlert}
            itineraryEventIds={itineraryEventIds}
            isTicketmasterConnected={isTicketmasterConnected}
            isSearchingTicketmaster={isSearchingTicketmaster}
            onRefreshTicketmaster={handleRefreshTicketmaster}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryView
            itineraries={itineraries}
            setItineraries={setItineraries}
            onExploreEvents={() => setActiveTab('aggregator')}
          />
        )}

        {activeTab === 'expenses' && (
          <GroupExpensesView
            itineraries={itineraries}
            setItineraries={setItineraries}
          />
        )}

        {activeTab === 'passes' && (
          <MyPassesView
            passes={passes}
            onDeletePass={handleDeletePass}
            onExploreEvents={() => setActiveTab('aggregator')}
          />
        )}
      </main>

      {/* Modals */}
      {ticketModalEvent && (
        <TicketModal
          event={ticketModalEvent}
          isOpen={true}
          onClose={() => setTicketModalEvent(null)}
          onTicketPurchased={handleTicketPurchased}
        />
      )}

      {detailModalEvent && (
        <EventDetailModal
          event={detailModalEvent}
          isOpen={true}
          onClose={() => setDetailModalEvent(null)}
          onOpenTicketModal={(e) => {
            setDetailModalEvent(null);
            setTicketModalEvent(e);
          }}
          onAddToPlanner={handleAddToPlanner}
          isInPlanner={itineraryEventIds.includes(detailModalEvent.id)}
        />
      )}

      {isHostModalOpen && (
        <HostEventModal
          isOpen={true}
          onClose={() => setIsHostModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#07090e] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-200">AfterGlow v1.0</span>
            <span>•</span>
            <span>Multi-Exchange Ticket Aggregator & Nightlife Itinerary Planner</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Aggregating SeatGeek, Ticketmaster, DICE, StubHub, VividSeats & AXS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
export default App;
