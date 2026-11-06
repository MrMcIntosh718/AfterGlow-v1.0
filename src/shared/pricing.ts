import type { EventItem } from '../types';

/**
 * Lowest price to show for an event, or null when the price is unknown.
 * Aggregated (demo) events use their platform tiers; live events use the source's published range.
 */
export function getEventMinPrice(event: Pick<EventItem, 'ticketPlatforms' | 'priceRange'>): number | null {
  const totals = event.ticketPlatforms
    .flatMap((platform) => platform.tiers.map((tier) => tier.totalPrice))
    .filter((price) => Number.isFinite(price));
  if (totals.length > 0) return Math.min(...totals);

  const min = event.priceRange?.min;
  return typeof min === 'number' && Number.isFinite(min) ? min : null;
}

/** Whole-unit price with the right currency symbol; falls back to "$N" for unknown currency codes. */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}
