import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, CheckSquare, Square, Users, Download, Share2, Sparkles, AlertCircle } from 'lucide-react';
import { EventItinerary, ItineraryScheduleItem, CrewMember, ChecklistItem } from '../types';

interface ItineraryViewProps {
  itineraries: EventItinerary[];
  setItineraries: React.Dispatch<React.SetStateAction<EventItinerary[]>>;
  onExploreEvents: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itineraries,
  setItineraries,
  onExploreEvents,
}) => {
  const [activePlanIndex, setActivePlanIndex] = useState<number>(0);
  const [newScheduleItem, setNewScheduleItem] = useState({
    time: '8:00 PM',
    title: '',
    location: '',
    type: 'pre-party' as ItineraryScheduleItem['type'],
  });
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  const activePlan = itineraries[activePlanIndex] || itineraries[0];

  if (!activePlan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-display text-white mb-2">No Event Itineraries Yet</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Start planning your night out! Discover events in the aggregator and click <b>Add to Planner</b> to construct your schedule, invite crew, and organize the afterglow.
        </p>
        <button
          onClick={onExploreEvents}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 hover:brightness-110 transition-all"
        >
          Explore Events & Tickets
        </button>
      </div>
    );
  }

  // Update helper
  const updateCurrentPlan = (updater: (prev: EventItinerary) => EventItinerary) => {
    setItineraries((prev) =>
      prev.map((plan, idx) => (idx === activePlanIndex ? updater(plan) : plan))
    );
  };

  // Add schedule block
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleItem.title.trim()) return;

    const newItem: ItineraryScheduleItem = {
      id: `sched-${Date.now()}`,
      time: newScheduleItem.time,
      title: newScheduleItem.title,
      type: newScheduleItem.type,
      location: newScheduleItem.location || activePlan.eventVenue,
    };

    updateCurrentPlan((p) => ({
      ...p,
      schedule: [...p.schedule, newItem].sort((a, b) => a.time.localeCompare(b.time)),
    }));

    setNewScheduleItem({
      time: '11:00 PM',
      title: '',
      location: '',
      type: 'afterglow',
    });
    setShowAddSchedule(false);
  };

  const handleDeleteSchedule = (id: string) => {
    updateCurrentPlan((p) => ({
      ...p,
      schedule: p.schedule.filter((s) => s.id !== id),
    }));
  };

  // Toggle checklist
  const handleToggleChecklist = (id: string) => {
    updateCurrentPlan((p) => ({
      ...p,
      checklist: p.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: `check-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
      category: 'essentials',
    };

    updateCurrentPlan((p) => ({
      ...p,
      checklist: [...p.checklist, newItem],
    }));
    setNewChecklistText('');
  };

  // Crew operations
  const handleAddCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim()) return;

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: CrewMember = {
      id: `crew-${Date.now()}`,
      name: newCrewName.trim(),
      avatar: randomColor,
      status: 'maybe',
    };

    updateCurrentPlan((p) => ({
      ...p,
      crew: [...p.crew, newMember],
    }));
    setNewCrewName('');
  };

  const handleRemoveCrew = (id: string) => {
    updateCurrentPlan((p) => ({
      ...p,
      crew: p.crew.filter((m) => m.id !== id),
    }));
  };

  // Export to .ics calendar file
  const handleExportCalendar = () => {
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AfterGlow v1.0//Event Itinerary//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${activePlan.eventTitle}`,
      `DESCRIPTION:AfterGlow Itinerary Plan for ${activePlan.eventTitle}. Location: ${activePlan.eventVenue}`,
      `LOCATION:${activePlan.eventVenue}, ${activePlan.eventCity}`,
      `DTSTART:${activePlan.eventDate.replace(/-/g, '')}T200000Z`,
      `DTEND:${activePlan.eventDate.replace(/-/g, '')}T235900Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activePlan.eventTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-afterglow.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getDirectionsUrl = (location: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${location}, ${activePlan.eventCity}`)}`;

  // Share event details and schedule, leaving personal crew and expense data out.
  const handleShareSummary = async () => {
    const scheduleSummary = activePlan.schedule
      .map((item) => `• ${item.time} — ${item.title} (${item.location || activePlan.eventVenue})\n  Directions: ${getDirectionsUrl(item.location || activePlan.eventVenue)}`)
      .join('\n');

    const text = `AFTERGLOW PLAN — ${activePlan.eventTitle}\n${activePlan.eventDate}\n${activePlan.eventVenue}, ${activePlan.eventCity}\nDirections: ${getDirectionsUrl(activePlan.eventVenue)}\n\nSCHEDULE\n${scheduleSummary}\n\nTicket purchase and final prices are handled by the provider.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `AfterGlow: ${activePlan.eventTitle}`, text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setCopiedToast(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Plan selector header if multiple plans */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Planner & Timeline
            </span>
            <span className="text-xs text-slate-400">
              {itineraries.length} Active {itineraries.length === 1 ? 'Plan' : 'Plans'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
            Night Out Master Itinerary
          </h1>
        </div>

        {/* Plan Switcher tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {itineraries.map((plan, idx) => (
            <button
              key={plan.id}
              onClick={() => setActivePlanIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border truncate max-w-[200px] ${
                activePlanIndex === idx
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.eventTitle}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Schedule Timeline & Sidebar (Crew, Checklist, Export) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Timeline Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
            
            {/* Header info card */}
            <div className="relative rounded-xl overflow-hidden p-5 bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 border border-rose-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                  Active Event Plan
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  {activePlan.eventTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    {activePlan.eventDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {activePlan.eventVenue}, {activePlan.eventCity}
                  </span>
                  <a href={getDirectionsUrl(activePlan.eventVenue)} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-white underline underline-offset-2">Directions</a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareSummary}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-all text-xs flex items-center gap-1.5"
                  title="Copy shareable summary"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={handleExportCalendar}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-all text-xs flex items-center gap-1.5"
                  title="Export to Calendar (.ics)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add to Cal</span>
                </button>
              </div>
            </div>

            {copiedToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                <span>Share the plan and venue directions. Crew and expense details stay private.</span>
              </div>
            )}

            {/* Timeline sequence */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  Timeline & Run of Show
                </h4>
                <button
                  onClick={() => setShowAddSchedule(!showAddSchedule)}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddSchedule ? 'Cancel' : 'Add Time Block'}</span>
                </button>
              </div>

              {/* Add form */}
              {showAddSchedule && (
                <form onSubmit={handleAddSchedule} className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3 mb-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Time</label>
                      <input
                        type="text"
                        value={newScheduleItem.time}
                        onChange={(e) => setNewScheduleItem({ ...newScheduleItem, time: e.target.value })}
                        placeholder="e.g. 7:30 PM"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Activity Type</label>
                      <select
                        value={newScheduleItem.type}
                        onChange={(e) => setNewScheduleItem({ ...newScheduleItem, type: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="pre-party">Pre-Party / Drinks</option>
                        <option value="travel">Travel / Rideshare</option>
                        <option value="main">Main Event / Set</option>
                        <option value="afterglow">AfterGlow / After-Party</option>
                        <option value="food">Late Night Food</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Title / Plan</label>
                      <input
                        type="text"
                        value={newScheduleItem.title}
                        onChange={(e) => setNewScheduleItem({ ...newScheduleItem, title: e.target.value })}
                        placeholder="e.g. Meet at Rooftop Bar"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Location / Venue</label>
                    <input
                      type="text"
                      value={newScheduleItem.location}
                      onChange={(e) => setNewScheduleItem({ ...newScheduleItem, location: e.target.value })}
                      placeholder="e.g. Hotel Indigo Lounge"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Save Block
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline Items */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800 space-y-6">
                {activePlan.schedule.map((item) => {
                  const typeStyles = {
                    'pre-party': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    'travel': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                    'main': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    'afterglow': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    'food': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  }[item.type] || 'bg-slate-800 text-slate-300 border-slate-700';

                  const typeDot = {
                    'pre-party': 'bg-amber-400 ring-amber-400/30',
                    'travel': 'bg-cyan-400 ring-cyan-400/30',
                    'main': 'bg-rose-500 ring-rose-500/30',
                    'afterglow': 'bg-purple-400 ring-purple-400/30',
                    'food': 'bg-emerald-400 ring-emerald-400/30',
                  }[item.type] || 'bg-slate-400 ring-slate-400/30';

                  return (
                    <div key={item.id} className="relative group">
                      {/* Node circle on border */}
                      <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ${typeDot}`} />

                      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 group-hover:border-slate-700 transition-all flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {item.time}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider border ${typeStyles}`}>
                              {item.type}
                            </span>
                          </div>
                          <h5 className="font-semibold text-white text-sm">
                            {item.title}
                          </h5>
                          {item.location && (
                            <a href={getDirectionsUrl(item.location)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 underline underline-offset-2">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {item.location} · Directions
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-all"
                          title="Remove block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right 1 Col: Crew & Checklist */}
        <div className="space-y-6">
          
          {/* Crew RSVP Box */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Crew & Friends ({activePlan.crew.length})
              </h4>
              <span className="text-xs text-slate-400">{activePlan.crew.filter((member) => member.status === 'confirmed' || member.status === 'host').length} going · {activePlan.crew.filter((member) => member.status === 'maybe').length} maybe</span>
            </div>

            <div className="space-y-2">
              {activePlan.crew.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-white"
                      style={{ backgroundColor: member.avatar }}
                    >
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      {member.status === 'host' ? <p className="text-[10px] text-slate-400">Host</p> : (
                        <select
                          aria-label={`${member.name} RSVP`}
                          value={member.status}
                          onChange={(e) => updateCurrentPlan((plan) => ({ ...plan, crew: plan.crew.map((person) => person.id === member.id ? { ...person, status: e.target.value as CrewMember['status'] } : person) }))}
                          className="mt-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] capitalize text-slate-300 border border-slate-700"
                        >
                          <option value="confirmed">Going</option>
                          <option value="maybe">Maybe</option>
                          <option value="declined">Can't make it</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {member.status !== 'host' && (
                    <button
                      onClick={() => handleRemoveCrew(member.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add crew member */}
            <form onSubmit={handleAddCrew} className="flex gap-2">
              <input
                type="text"
                placeholder="Add friend name..."
                value={newCrewName}
                onChange={(e) => setNewCrewName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                Add
              </button>
            </form>
          </div>

          {/* Essentials & Packing Checklist */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Event Day Prep Checklist
              </h4>
              <span className="text-xs text-slate-400 font-medium">
                {activePlan.checklist.filter((c) => c.done).length}/{activePlan.checklist.length} Done
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {activePlan.checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all text-xs ${
                    item.done
                      ? 'bg-emerald-950/20 text-slate-500 line-through'
                      : 'bg-slate-900/60 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Add checklist item */}
            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <input
                type="text"
                placeholder="New item (e.g. earplugs, ID)..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                Add
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
