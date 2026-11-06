import type { CategoryType, ChecklistItem } from '../types';

export type TravelMode = 'local' | 'roadtrip' | 'flying';
export type PackingSuggestion = Pick<ChecklistItem, 'text' | 'category' | 'productSlug'>;

const BASE_SUGGESTIONS: PackingSuggestion[] = [
  { text: 'Check the venue entry, bag, and prohibited-item rules', category: 'essentials' },
  { text: 'Save your ticket and event details for offline access', category: 'tickets' },
  { text: 'Charge your phone and pack a portable power bank', category: 'gear', productSlug: 'portable-power-bank' },
  { text: 'Confirm your meetup point and trip home', category: 'essentials' },
];

const CATEGORY_SUGGESTIONS: Partial<Record<CategoryType, PackingSuggestion[]>> = {
  Concert: [
    { text: 'Pack ear protection for the show', category: 'gear', productSlug: 'concert-earplugs' },
    { text: 'Check venue rules before packing glow sticks or whistles', category: 'gear' },
  ],
  'EDM / Festival': [
    { text: 'Pack ear protection for long sets', category: 'gear', productSlug: 'concert-earplugs' },
    { text: 'Check venue hydration and bag rules before packing a bottle', category: 'gear', productSlug: 'refillable-bottle' },
    { text: 'Check venue rules before packing glow sticks or whistles', category: 'gear' },
  ],
  Sports: [
    { text: 'Check stadium bag and entry rules', category: 'essentials' },
    { text: 'Check the forecast and pack a weather layer if needed', category: 'gear' },
  ],
  Comedy: [
    { text: 'Check venue arrival time and entry rules', category: 'essentials' },
  ],
  Theater: [
    { text: 'Check venue arrival time and entry rules', category: 'essentials' },
  ],
  Nightlife: [
    { text: 'Check venue ID, age, and bag policies before leaving', category: 'essentials' },
    { text: 'Choose a safe, reliable ride home before the night starts', category: 'essentials' },
  ],
};

const TRAVEL_SUGGESTIONS: Record<TravelMode, PackingSuggestion[]> = {
  local: [
    { text: 'Check transit or parking options and save directions', category: 'essentials' },
  ],
  roadtrip: [
    { text: 'Save the route and plan fuel or rest stops', category: 'essentials' },
    { text: 'Pack a car charger and phone cable', category: 'gear', productSlug: 'car-phone-charger' },
  ],
  flying: [
    { text: 'Pack carry-on liquids in containers 3.4 oz / 100 mL or less in one clear quart-size bag', category: 'gear', productSlug: 'travel-bottles' },
    { text: 'Keep your liquids bag easy to reach for airport screening', category: 'essentials' },
    { text: 'Recheck current TSA and airline baggage rules before departure', category: 'essentials' },
  ],
};

export function getPackingSuggestions(category: CategoryType | undefined, travelMode: TravelMode): PackingSuggestion[] {
  return [...BASE_SUGGESTIONS, ...(category ? CATEGORY_SUGGESTIONS[category] || [] : []), ...TRAVEL_SUGGESTIONS[travelMode]];
}
