import React from 'react';
import { X, Calendar, MapPin, Clock, Tag, Star, Music, Users, Ticket, PlusCircle, Check, ExternalLink } from 'lucide-react';
import { EventItem } from '../types';
import { getEventMinPrice, formatPrice } from '../shared/pricing.ts';

interface EventDetailModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onOpenTicketModal: (event: EventItem) => void;
  onAddToPlanner: (event: EventItem) => void;
  isInPlanner: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onOpenTicketModal,
  onAddToPlanner,
  isInPlanner,
}) => {
  if (!isOpen) return null;

  // Lowest known price (null when the source doesn't publish one)
  const minPrice = getEventMinPrice(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0f121d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Banner with controls */}
        <div className="relative h-56 sm:h-72 shrink-0 overflow-hidden">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f121d] via-[#0f121d]/40 to-black/60" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-500/90 text-white backdrop-blur shadow-md">
              {event.category}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-slate-300 backdrop-blur border border-slate-700">
              {event.ageRestriction}
            </span>
          </div>

          {/* Title & Venue on banner */}
          <div className="absolute bottom-4 left-4 right-4">
            {event.rating !== undefined && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{event.rating}</span>
                {event.reviewsCount !== undefined && (
                  <span className="text-slate-400 font-normal">({event.reviewsCount} reviews)</span>
                )}
              </div>
            )}
            <h2 className="text-xl sm:text-3xl font-extrabold text-white font-display tracking-tight leading-tight">
              {event.title}
            </h2>
            <p className="text-sm sm:text-base text-rose-300 font-medium mt-0.5">
              {event.artistOrPerformer}
            </p>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Key Facts bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Date</p>
                <p className="text-xs sm:text-sm font-medium text-slate-200">{event.formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Doors & Showtime</p>
                <p className="text-xs sm:text-sm font-medium text-slate-200">{event.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Venue & Location</p>
                <p className="text-xs sm:text-sm font-medium text-slate-200">
                  {event.venue}, {event.city}, {event.state} {event.postalCode ? `(${event.postalCode})` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About The Experience</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Lineup / Schedule */}
          {event.lineup && event.lineup.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-rose-400" />
                Lineup & Stage Schedule
              </h4>
              <div className="space-y-2">
                {event.lineup.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-rose-400 font-semibold w-16">
                        {act.time}
                      </span>
                      <span className="font-semibold text-white">
                        {act.act}
                      </span>
                    </div>
                    {act.stage && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-medium">
                        {act.stage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Atmosphere & Vibe</h4>
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 text-slate-400 border border-slate-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {event.isTicketmasterLive ? (
              <>
                <p className="text-xs text-slate-400">Ticketmaster price:</p>
                <p className="text-xs font-semibold text-white">
                  {minPrice !== null ? (
                    <>
                      <span className="text-rose-400 font-display text-xl font-bold">
                        From {formatPrice(minPrice, event.priceRange?.currency)}
                      </span>
                      <span className="text-slate-400 ml-1">as listed; fees may be added at checkout</span>
                    </>
                  ) : (
                    <span className="text-slate-300">Not published. See the Ticketmaster page.</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">Aggregated prices from:</p>
                <p className="text-xs font-semibold text-white">
                  <span className="text-rose-400 font-display text-xl font-bold">
                    {minPrice !== null ? formatPrice(minPrice) : 'N/A'}
                  </span>
                  <span className="text-slate-400 ml-1">all fees included</span>
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onAddToPlanner(event)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                isInPlanner
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
            >
              {isInPlanner ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>In Your Planner</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-rose-400" />
                  <span>Add to Planner</span>
                </>
              )}
            </button>

            {event.isTicketmasterLive ? (
              event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white shadow-lg shadow-rose-500/25 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Tickets on Ticketmaster</span>
                </a>
              ) : (
                <span className="flex-1 sm:flex-initial text-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-500">
                  No ticket link available
                </span>
              )
            ) : (
              <button
                onClick={() => onOpenTicketModal(event)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white shadow-lg shadow-rose-500/25 transition-all"
              >
                <Ticket className="w-4 h-4" />
                <span>Compare Tickets</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
