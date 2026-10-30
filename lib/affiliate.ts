import type { EventItem } from "./types";

// Partner domains we are willing to redirect to. Keeps /go from being an open redirect.
// A partner can own several domains: Ticketmaster's API also returns events hosted
// on its sister sites. Add a domain here if /go bounces a legitimate ticket link.
const PARTNER_DOMAINS: Record<EventItem["partner"], string[]> = {
  ticketmaster: [
    "ticketmaster.com",
    "ticketmaster.ca",
    "ticketmaster.ie",
    "ticketmaster.de",
    "ticketmaster.co.uk",
    "ticketmaster.com.au",
    "ticketmaster.nl",
    "ticketmaster.be",
    "ticketmaster.at",
    "ticketmaster.ch",
    "ticketmaster.se",
    "ticketmaster.no",
    "ticketmaster.dk",
    "ticketmaster.fi",
    "ticketmaster.pl",
    "ticketmaster.cz",
    "ticketmaster.es",
    "ticketmaster.it",
    "ticketmaster.fr",
    "ticketmaster.com.mx",
    "ticketmaster.com.br",
    "ticketweb.com",
    "livenation.com",
    "universe.com",
  ],
  seatgeek: ["seatgeek.com"],
  vividseats: ["vividseats.com"],
  passkit: ["passkit.com"], // VERIFY: must match the host of the ticket URLs PassKit returns
};

const TEMPLATE_ENV: Record<EventItem["partner"], string | undefined> = {
  ticketmaster: process.env.AFFILIATE_TEMPLATE_TICKETMASTER,
  seatgeek: process.env.AFFILIATE_TEMPLATE_SEATGEEK,
  vividseats: process.env.AFFILIATE_TEMPLATE_VIVIDSEATS,
  passkit: process.env.AFFILIATE_TEMPLATE_PASSKIT,
};

export function isPartner(value: string): value is EventItem["partner"] {
  return Object.prototype.hasOwnProperty.call(PARTNER_DOMAINS, value);
}

export function isAllowedUrl(partner: EventItem["partner"], raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;

    return PARTNER_DOMAINS[partner].some(
      (domain) => url.hostname === domain || url.hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

// Wraps the partner URL in your affiliate deep link once the network approves you.
// With no template set, it returns the plain partner URL.
export function buildAffiliateLink(partner: EventItem["partner"], partnerUrl: string): string {
  const template = TEMPLATE_ENV[partner];
  if (!template || !template.includes("{url}")) return partnerUrl;
  return template.replace("{url}", encodeURIComponent(partnerUrl));
}

// Link used on the site; the click goes through /go so you can add click tracking later.
export function goLink(partner: EventItem["partner"], partnerUrl: string): string {
  return `/go/${partner}?u=${encodeURIComponent(partnerUrl)}`;
}
