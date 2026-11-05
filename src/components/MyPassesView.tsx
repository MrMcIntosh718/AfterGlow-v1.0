import React, { useState, useEffect } from 'react';
import { Sparkles, QrCode, Download, Share2, Calendar, MapPin, Clock, ShieldCheck, Ticket, Trash2 } from 'lucide-react';
import { UserPass } from '../types';

interface MyPassesViewProps {
  passes: UserPass[];
  onDeletePass: (id: string) => void;
  onExploreEvents: () => void;
}

export const MyPassesView: React.FC<MyPassesViewProps> = ({
  passes,
  onDeletePass,
  onExploreEvents,
}) => {
  const [selectedPass, setSelectedPass] = useState<UserPass | null>(passes[0] || null);
  const [timeRemaining, setTimeRemaining] = useState<string>('3h 42m');

  useEffect(() => {
    if (passes.length > 0 && !selectedPass) {
      setSelectedPass(passes[0]);
    }
  }, [passes, selectedPass]);

  if (passes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-white">Your Wallet is Empty</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          No active passes booked yet. Explore upcoming concerts, festivals, and after-parties to compare aggregated ticket deals and lock in your pass!
        </p>
        <button
          onClick={onExploreEvents}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25 hover:brightness-110 transition-all"
        >
          Discover Events
        </button>
      </div>
    );
  }

  const active = selectedPass || passes[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Digital Mobile Wallet
            </span>
            <span className="text-xs text-slate-400">
              {passes.length} Verified {passes.length === 1 ? 'Pass' : 'Passes'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
            My Passes & Event Access
          </h1>
        </div>

        {/* Pass Selector tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {passes.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPass(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border max-w-[200px] truncate ${
                active.id === p.id
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {p.eventTitle}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container: Mobile Pass Stub on Left, Pass Details & Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Pass Graphic (Glowing Nightlife Ticket Stub) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm rounded-3xl overflow-hidden bg-gradient-to-b from-[#181a27] via-[#10131e] to-[#0c0e18] border border-rose-500/30 shadow-2xl shadow-rose-950/40 relative">
            
            {/* Top Glowing Header */}
            <div className="p-6 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-widest uppercase bg-black/25 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  AfterGlow Pass
                </span>
                <span className="text-xs font-bold bg-white text-rose-600 px-2.5 py-0.5 rounded-full shadow-sm">
                  {active.tier}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold font-display leading-tight line-clamp-2">
                  {active.eventTitle}
                </h3>
                <p className="text-xs text-rose-100 font-medium mt-1">
                  Issued via {active.platform} Aggregator
                </p>
              </div>
            </div>

            {/* Middle Punch Hole Notches */}
            <div className="relative h-6 bg-[#0c0e18] flex items-center justify-between px-[-12px]">
              <div className="w-6 h-6 rounded-full bg-[#0b0d14] -ml-3 border-r border-rose-500/30" />
              <div className="flex-1 border-t-2 border-dashed border-slate-700/60 mx-2" />
              <div className="w-6 h-6 rounded-full bg-[#0b0d14] -mr-3 border-l border-rose-500/30" />
            </div>

            {/* Pass Body Content */}
            <div className="p-6 space-y-5 text-xs text-slate-300">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Date</span>
                  <span className="font-semibold text-white text-sm">{active.date}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Doors</span>
                  <span className="font-semibold text-rose-400 text-sm">{active.doorsOpen}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Venue</span>
                  <span className="font-semibold text-white text-xs">{active.venue}</span>
                  <p className="text-[11px] text-slate-400">{active.city}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Seat / Area</span>
                  <span className="font-semibold text-amber-400 text-xs">{active.seatInfo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Pass Holder</span>
                  <span className="font-semibold text-white">{active.holderName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Quantity</span>
                  <span className="font-semibold text-white">{active.quantity} {active.quantity > 1 ? 'Passes' : 'Pass'}</span>
                </div>
              </div>

              {/* Dynamic QR Entry Code */}
              <div className="p-4 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center space-y-2 shadow-inner">
                {/* Simulated high-contrast QR matrix */}
                <div className="w-36 h-36 border-4 border-slate-900 p-2 flex flex-col justify-between rounded-lg relative overflow-hidden bg-slate-950">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-white border-2 border-slate-950 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-950" />
                    </div>
                    <div className="w-8 h-8 bg-white border-2 border-slate-950 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-950" />
                    </div>
                  </div>
                  <div className="flex justify-center items-center">
                    <span className="text-[8px] font-mono tracking-tighter text-white/80">AFTERGLOW</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-white border-2 border-slate-950 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-950" />
                    </div>
                    <div className="w-8 h-8 bg-white flex flex-col justify-center items-center">
                      <div className="w-4 h-1 bg-slate-950 mb-0.5" />
                      <div className="w-4 h-1 bg-slate-950" />
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] tracking-widest text-slate-700 font-bold">
                  {active.barcodeNumber}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Valid Entry • Scan at Door</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Pass Controls & Door countdown */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Status Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Digital Pass Active
              </span>
              <button
                onClick={() => onDeletePass(active.id)}
                className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Wallet</span>
              </button>
            </div>

            <h3 className="text-2xl font-bold text-white font-display">
              {active.eventTitle}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Purchased On</span>
                <span className="font-semibold text-white">{active.purchasedAt}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Total Paid</span>
                <span className="font-semibold text-amber-400 font-display text-sm">${active.pricePaid}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Gate Entry</span>
                <span className="font-semibold text-white">{active.gate}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() => alert('Pass saved to Apple Wallet / Google Wallet simulator!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span>Add to Apple / Google Wallet</span>
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Door Entry Guide */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#121624] border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              Venue Entry Tips
            </h4>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li>Have your photo ID ready matching the name: <b className="text-slate-200">{active.holderName}</b>.</li>
              <li>Turn screen brightness to maximum when presenting the QR code at {active.gate}.</li>
              <li>Re-entry policy varies by venue: check with security before exiting the main floor.</li>
              <li>For multi-ticket orders, all {active.quantity} guests must enter together or forward individual barcode stubs.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
