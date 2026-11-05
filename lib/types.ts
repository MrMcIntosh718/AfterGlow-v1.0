export type EventItem = {
  id: string;
  partner: "ticketmaster" | "seatgeek" | "vividseats" | "passkit";
  name: string;
  date: string; // YYYY-MM-DD
  venue: string;
  city: string;
  image?: string;
  url: string; // partner URL, never shown to users directly; goes through /go
  latitude?: number;
  longitude?: number;
};
