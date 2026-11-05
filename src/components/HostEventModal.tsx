import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Calendar, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
import { EventItem, CategoryType, TicketPlatformName } from '../types';
import confetti from 'canvas-confetti';

interface HostEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (newEvent: EventItem) => void;
}

export const HostEventModal: React.FC<HostEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState<CategoryType>('Nightlife');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('New York');
  const [state, setState] = useState('NY');
  const [date, setDate] = useState('2026-07-18');
  const [time, setTime] = useState('10:00 PM - 4:00 AM');
  const [doorsOpen, setDoorsOpen] = useState('9:30 PM');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80');
  const [gaPrice, setGaPrice] = useState('35');
  const [vipPrice, setVipPrice] = useState('80');
  const [ageRestriction, setAgeRestriction] = useState('21+');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim()) return;

    const gaNum = parseFloat(gaPrice) || 35;
    const vipNum = parseFloat(vipPrice) || 80;

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const newEvent: EventItem = {
      id: `custom-event-${Date.now()}`,
      title: title.trim(),
      category,
      artistOrPerformer: artist.trim() || 'Featured Curators & DJs',
      venue: venue.trim(),
      city: city.trim(),
      state: state.trim(),
      date,
      formattedDate,
      time,
      doorsOpen,
      bannerUrl: bannerUrl.trim() || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      description: description.trim() || 'Official AfterGlow community event with top sound system, curated drinks, and exclusive late night atmosphere.',
      lineup: [
        { time: '10:00 PM', act: 'Opening Warmup & Drinks', stage: 'Main Room' },
        { time: '11:30 PM', act: artist.trim() || 'Headliner Live', stage: 'Main Room' },
        { time: '2:00 AM', act: 'AfterGlow Dawn Extended Set', stage: 'Lounge' },
      ],
      rating: 5.0,
      reviewsCount: 1,
      ageRestriction,
      priceAlertActive: false,
      tags: ['Community Hosted', 'After-Party', 'Exclusive'],
      isCustomHostEvent: true,
      ticketPlatforms: [
        {
          platformName: 'DICE',
          logoColor: '#000000',
          reliabilityScore: 99,
          directUrl: 'https://dice.fm',
          tiers: [
            { tierName: 'General Admission', basePrice: gaNum, fee: Math.round(gaNum * 0.12), totalPrice: gaNum + Math.round(gaNum * 0.12), availableCount: 50, dealScore: 'Lowest Price', inStock: true },
            { tierName: 'VIP Pit / Lounge', basePrice: vipNum, fee: Math.round(vipNum * 0.14), totalPrice: vipNum + Math.round(vipNum * 0.14), availableCount: 15, dealScore: 'VIP Pick', inStock: true },
          ],
        },
        {
          platformName: 'Eventbrite',
          logoColor: '#f05537',
          reliabilityScore: 96,
          directUrl: 'https://eventbrite.com',
          tiers: [
            { tierName: 'General Admission', basePrice: gaNum + 2, fee: Math.round(gaNum * 0.15), totalPrice: gaNum + 2 + Math.round(gaNum * 0.15), availableCount: 40, dealScore: 'Standard', inStock: true },
          ],
        },
      ],
    };

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5 },
    });

    onEventCreated(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0f121d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                Host An Event or After-Party
              </h2>
              <p className="text-xs text-slate-400">
                Publish ticket tiers and schedule directly into AfterGlow aggregator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Brooklyn Warehouse AfterGlow"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Headline Artist / DJ</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Special Guest + Resident DJs"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Nightlife">Nightlife / Club</option>
                <option value="EDM / Festival">EDM / Festival</option>
                <option value="Concert">Concert / Live</option>
                <option value="Comedy">Comedy</option>
                <option value="Sports">Sports</option>
                <option value="Theater">Arts & Theater</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age Restriction</label>
              <select
                value={ageRestriction}
                onChange={(e) => setAgeRestriction(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              >
                <option value="21+">21+ Only</option>
                <option value="18+">18+ Only</option>
                <option value="All Ages">All Ages</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Name *</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. The Boiler Room Lounge"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. NY"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hours / Set Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 10:00 PM - 4:00 AM"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Doors Open</label>
              <input
                type="text"
                value={doorsOpen}
                onChange={(e) => setDoorsOpen(e.target.value)}
                placeholder="e.g. 9:30 PM"
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Ticket Tier Pricing (USD)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">General Admission ($)</label>
                <input
                  type="number"
                  value={gaPrice}
                  onChange={(e) => setGaPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">VIP Lounge / Table ($)</label>
                <input
                  type="number"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Event Description & Vibe</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what guests can expect, music genres, dress code, and afterglow details..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Poster / Cover Image URL</label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-rose-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all text-xs sm:text-sm"
            >
              Publish Event to Aggregator
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
