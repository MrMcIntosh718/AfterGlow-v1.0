export type CategoryType = 'Concert' | 'EDM / Festival' | 'Nightlife' | 'Sports' | 'Comedy' | 'Theater';

export type TicketPlatformName = 
  | 'SeatGeek' 
  | 'Ticketmaster' 
  | 'StubHub' 
  | 'VividSeats' 
  | 'DICE' 
  | 'Eventbrite' 
  | 'AXS';

export type TierName = 
  | 'General Admission' 
  | 'VIP Pit / Lounge' 
  | 'Front Row' 
  | 'Mezzanine' 
  | 'Balcony' 
  | 'Early Bird' 
  | 'After-Party Pass';

export interface TicketTierOption {
  tierName: TierName;
  basePrice: number;
  fee: number;
  totalPrice: number;
  availableCount: number;
  dealScore: 'Best Value' | 'Lowest Price' | 'VIP Pick' | 'Standard' | 'Selling Fast';
  inStock: boolean;
}

export interface PlatformListing {
  platformName: TicketPlatformName;
  logoColor: string;
  reliabilityScore: number; // 90-100%
  directUrl: string;
  tiers: TicketTierOption[];
}

export interface EventItem {
  id: string;
  title: string;
  category: CategoryType;
  artistOrPerformer: string;
  venue: string;
  city: string;
  state: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  time: string;
  doorsOpen: string;
  bannerUrl: string;
  description: string;
  lineup: { time: string; act: string; stage?: string }[];
  rating: number;
  reviewsCount: number;
  ageRestriction: string;
  priceAlertActive?: boolean;
  tags: string[];
  ticketPlatforms: PlatformListing[];
  isCustomHostEvent?: boolean;
}

export interface ItineraryScheduleItem {
  id: string;
  time: string;
  title: string;
  type: 'pre-party' | 'travel' | 'main' | 'afterglow' | 'food';
  location: string;
  notes?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  avatar: string;
  status: 'confirmed' | 'maybe' | 'host';
  phone?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  payerId: string;
  amount: number;
  category: 'Tickets' | 'Rideshare' | 'Drinks / Food' | 'Hotel' | 'Other';
  splitAmongIds: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  category: 'essentials' | 'gear' | 'tickets';
}

export interface EventItinerary {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  bannerUrl: string;
  notes: string;
  schedule: ItineraryScheduleItem[];
  crew: CrewMember[];
  expenses: ExpenseItem[];
  checklist: ChecklistItem[];
}

export interface UserPass {
  id: string;
  eventId: string;
  eventTitle: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  doorsOpen: string;
  tier: TierName;
  platform: TicketPlatformName;
  pricePaid: number;
  quantity: number;
  qrCodeData: string;
  barcodeNumber: string;
  seatInfo: string;
  gate: string;
  holderName: string;
  purchasedAt: string;
}
