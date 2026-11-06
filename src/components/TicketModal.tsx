import React, { useState } from 'react';
import { X, Check, ShieldCheck, ExternalLink, Zap, Info, ChevronRight, Sparkles } from 'lucide-react';
import { EventItem, PlatformListing, TicketTierOption, UserPass } from '../types';
import confetti from 'canvas-confetti';

interface TicketModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onTicketPurchased: (pass: UserPass) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  event,
  isOpen,
  onClose,
  onTicketPurchased,
}) => {
  const [selectedTierName, setSelectedTierName] = useState<string>('General Admission');
  const [quantity, setQuantity] = useState<number>(1);
  const [activePlatformIndex, setActivePlatformIndex] = useState<number>(0);
  const [purchaseStep, setPurchaseStep] = useState<'compare' | 'confirm' | 'success'>('compare');
  const [buyerName, setBuyerName] = useState<string>('Alex Hunter');

  // The simulated checkout only makes sense for events with platform listings; live events link out instead.
  if (!isOpen || event.ticketPlatforms.length === 0) return null;

  // Extract all distinct tiers available across platforms
  const allTiers = Array.from(
    new Set(
      event.ticketPlatforms.flatMap((p) => p.tiers.map((t) => t.tierName))
    )
  );

  // If currently selected tier not in list, fallback to first
  const currentTier = allTiers.includes(selectedTierName as any) ? selectedTierName : (allTiers[0] || 'General Admission');

  // Find best price for this tier
  const platformComparisons = event.ticketPlatforms.map((p) => {
    const tier = p.tiers.find((t) => t.tierName === currentTier);
    return {
      platform: p,
      tier,
    };
  }).filter((item) => item.tier !== undefined);

  // Sort by lowest total price
  platformComparisons.sort((a, b) => (a.tier!.totalPrice) - (b.tier!.totalPrice));

  const lowestPriceItem = platformComparisons[0];
  const selectedPlatformItem = platformComparisons[activePlatformIndex] || lowestPriceItem;

  const handleSimulatePurchase = () => {
    if (!selectedPlatformItem || !selectedPlatformItem.tier) return;

    // Launch confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#fb7185', '#f59e0b', '#38bdf8', '#ffffff'],
    });

    const newPass: UserPass = {
      id: `pass-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      venue: event.venue,
      city: event.city,
      date: event.formattedDate,
      time: event.time,
      doorsOpen: event.doorsOpen,
      tier: selectedPlatformItem.tier.tierName,
      platform: selectedPlatformItem.platform.platformName,
      pricePaid: selectedPlatformItem.tier.totalPrice * quantity,
      quantity: quantity,
      qrCodeData: `AFTERGLOW-${event.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      barcodeNumber: `8492049104${Math.floor(1000 + Math.random() * 9000)}`,
      seatInfo: selectedPlatformItem.tier.tierName.includes('VIP') ? 'Section VIP • Row 1 • Lounge Pass' : 'General Admission • Floor Area',
      gate: 'Gate B (North Entry)',
      holderName: buyerName || 'Alex Hunter',
      purchasedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    onTicketPurchased(newPass);
    setPurchaseStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#0f121d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="relative h-28 sm:h-36 shrink-0 overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950">
          <img 
            src={event.bannerUrl} 
            alt={event.title} 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f121d] via-[#0f121d]/60 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-16">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Ticket Aggregator Engine
              </span>
              <span className="text-xs text-slate-400">
                Live Multi-Platform Fee Transparency
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate font-display">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {purchaseStep === 'compare' && (
            <>
              {/* Event Quick Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300">
                <div>
                  <span className="text-slate-500">Venue: </span>
                  <span className="font-medium text-white">{event.venue}, {event.city}</span>
                </div>
                <div>
                  <span className="text-slate-500">Date: </span>
                  <span className="font-medium text-white">{event.formattedDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Time: </span>
                  <span className="font-medium text-white">{event.time}</span>
                </div>
              </div>

              {/* Tier Selector Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  1. Select Seating / Admission Tier
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTiers.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        setSelectedTierName(tier);
                        setActivePlatformIndex(0);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                        currentTier === tier
                          ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Platform Comparison Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Aggregated Prices across Platforms</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </label>
                  <span className="text-xs text-emerald-400 font-medium">
                    Verified real-time fees included
                  </span>
                </div>

                <div className="space-y-2.5">
                  {platformComparisons.map((item, idx) => {
                    const isLowest = idx === 0;
                    const isSelected = activePlatformIndex === idx;
                    const priceDiff = idx > 0 ? (item.tier!.totalPrice - lowestPriceItem.tier!.totalPrice) : 0;

                    return (
                      <div
                        key={item.platform.platformName}
                        onClick={() => setActivePlatformIndex(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/60 ring-1 ring-rose-500/40 shadow-lg shadow-rose-950/50'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Platform brand & badges */}
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-inner"
                            style={{ backgroundColor: item.platform.logoColor || '#334155' }}
                          >
                            {item.platform.platformName.slice(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm sm:text-base">
                                {item.platform.platformName}
                              </span>
                              {isLowest && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> Cheapest Total
                                </span>
                              )}
                              {item.tier?.dealScore === 'VIP Pick' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  VIP Pick
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                              <span>Reliability: <b className="text-slate-200">{item.platform.reliabilityScore}%</b></span>
                              <span>•</span>
                              <span>Available: <b className="text-slate-200">{item.tier?.availableCount} passes</b></span>
                            </div>
                          </div>
                        </div>

                        {/* Price breakdown and select action */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-baseline gap-1.5 sm:justify-end">
                              <span className="text-xs text-slate-400">Total:</span>
                              <span className="text-lg sm:text-xl font-bold font-display text-white">
                                ${item.tier?.totalPrice}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Base ${item.tier?.basePrice} + ${item.tier?.fee} fees
                            </p>
                            {priceDiff > 0 && (
                              <p className="text-[11px] text-rose-400/90 font-medium">
                                +${priceDiff} vs lowest
                              </p>
                            )}
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected 
                              ? 'bg-rose-500 border-rose-400 text-white' 
                              : 'border-slate-700 bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity selector & Quick summary */}
              {selectedPlatformItem && selectedPlatformItem.tier && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-xs font-semibold text-slate-300">Quantity:</span>
                    <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-sm font-semibold text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(8, quantity + 1))}
                        className="px-3 py-1 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-slate-500">Max 8 per order</span>
                  </div>

                  <div className="text-right w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs text-slate-400">Grand Total ({quantity}x):</span>
                    <span className="text-2xl font-bold font-display text-gradient-amber">
                      ${selectedPlatformItem.tier.totalPrice * quantity}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Confirm details view */}
          {purchaseStep === 'confirm' && selectedPlatformItem && selectedPlatformItem.tier && (
            <div className="space-y-4 max-w-lg mx-auto py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white font-display">Confirm Pass Reservation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Issuing verified passes via {selectedPlatformItem.platform.platformName} aggregator bridge
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span className="text-slate-400">Event:</span>
                  <span className="font-semibold text-white text-right">{event.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span className="text-slate-400">Tier:</span>
                  <span className="font-medium text-rose-300">{selectedPlatformItem.tier.tierName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span className="text-slate-400">Platform:</span>
                  <span className="font-medium text-white">{selectedPlatformItem.platform.platformName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span className="text-slate-400">Price per ticket:</span>
                  <span className="text-slate-200">${selectedPlatformItem.tier.totalPrice} (all fees incl.)</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300 text-base font-bold">
                  <span>Grand Total ({quantity} pass):</span>
                  <span className="text-amber-400 font-display">${selectedPlatformItem.tier.totalPrice * quantity}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ticket Holder Name:
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* Success state */}
          {purchaseStep === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Pass Confirmed & Added!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Your ticket pass for <span className="text-rose-400 font-semibold">{event.title}</span> has been saved to your AfterGlow digital wallet.
              </p>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 inline-block text-xs text-slate-400">
                You can view the interactive QR entry code, barcode, and door countdown in the <b className="text-white">Passes</b> tab anytime!
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          {purchaseStep === 'compare' && (
            <>
              <a
                href={selectedPlatformItem?.platform.directUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span>Visit {selectedPlatformItem?.platform.platformName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setPurchaseStep('confirm')}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-95 text-white rounded-xl shadow-lg shadow-rose-500/25 transition-all"
                >
                  <span>Lock In Deal • ${selectedPlatformItem ? selectedPlatformItem.tier!.totalPrice * quantity : 0}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {purchaseStep === 'confirm' && (
            <>
              <button
                onClick={() => setPurchaseStep('compare')}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Back to Comparison
              </button>
              <button
                onClick={handleSimulatePurchase}
                className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirm & Issue Pass</span>
              </button>
            </>
          )}

          {purchaseStep === 'success' && (
            <div className="w-full flex justify-center">
              <button
                onClick={onClose}
                className="px-8 py-2.5 text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/25 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
