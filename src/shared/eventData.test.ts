import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeLiveEvents, migrateStoredEvent } from './eventData.ts';
import type { EventItem } from '../types';

const makeEvent = (overrides: Partial<EventItem> = {}): EventItem => ({
  id: 'e1',
  title: 'Show',
  category: 'Concert',
  artistOrPerformer: 'Band',
  venue: 'Hall',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
  date: '2026-12-01',
  formattedDate: 'Tuesday, December 1, 2026',
  time: '19:30',
  doorsOpen: '18:30',
  bannerUrl: 'https://example.com/b.jpg',
  description: 'd',
  lineup: [],
  ageRestriction: 'See event page',
  tags: [],
  ticketPlatforms: [],
  ...overrides,
});

// The shape older versions of the proxy produced for live events (invented data included).
const oldLiveEvent = (): EventItem =>
  makeEvent({
    id: 'tm-old',
    isTicketmasterLive: true,
    rating: 4.85,
    reviewsCount: 512,
    lineup: [{ time: '19:30', act: 'Band', stage: 'Main Stage' }],
    tags: ['Rock', 'Concert', 'Ticketmaster Verified', 'Austin'],
    ticketPlatforms: [
      {
        platformName: 'Ticketmaster',
        logoColor: '#026cdf',
        reliabilityScore: 99,
        directUrl: 'https://www.ticketmaster.com/event/abc',
        tiers: [{ tierName: 'General Admission', basePrice: 49, fee: 11, totalPrice: 60, availableCount: 50, dealScore: 'Standard', inStock: true }],
      },
      {
        platformName: 'SeatGeek',
        logoColor: '#f05323',
        reliabilityScore: 98,
        directUrl: 'https://seatgeek.com',
        tiers: [{ tierName: 'General Admission', basePrice: 45, fee: 8, totalPrice: 53, availableCount: 28, dealScore: 'Best Value', inStock: true }],
      },
    ],
  });

test('migrateStoredEvent strips invented data from old live events but keeps the real link', () => {
  const migrated = migrateStoredEvent(oldLiveEvent());
  assert.deepEqual(migrated.ticketPlatforms, []);
  assert.deepEqual(migrated.lineup, []);
  assert.equal(migrated.rating, undefined);
  assert.equal(migrated.reviewsCount, undefined);
  assert.equal(migrated.ticketUrl, 'https://www.ticketmaster.com/event/abc');
  assert.ok(migrated.tags.includes('Ticketmaster'));
  assert.ok(!migrated.tags.includes('Ticketmaster Verified'));
});

test('migrateStoredEvent drops the old bare-homepage fallback instead of treating it as an event link', () => {
  const old = oldLiveEvent();
  old.ticketPlatforms[0].directUrl = 'https://ticketmaster.com';
  assert.equal(migrateStoredEvent(old).ticketUrl, undefined);
});

test('migrateStoredEvent leaves demo events and already-current live events alone', () => {
  const demo = makeEvent({ id: 'demo', rating: 4.9, reviewsCount: 12 });
  assert.equal(migrateStoredEvent(demo), demo);

  const current = makeEvent({ id: 'tm-new', isTicketmasterLive: true, ticketUrl: 'https://www.ticketmaster.com/e/1' });
  assert.equal(migrateStoredEvent(current), current);
});

test('mergeLiveEvents adds new events first and refreshes existing ones, keeping price alerts', () => {
  const existing = [makeEvent({ id: 'a', title: 'Old title', priceAlertActive: true }), makeEvent({ id: 'b' })];
  const incoming = [makeEvent({ id: 'a', title: 'New title', priceAlertActive: false }), makeEvent({ id: 'c' })];

  const merged = mergeLiveEvents(existing, incoming);
  assert.deepEqual(merged.map((e) => e.id), ['c', 'a', 'b']);
  assert.equal(merged.find((e) => e.id === 'a')?.title, 'New title');
  assert.equal(merged.find((e) => e.id === 'a')?.priceAlertActive, true);
});
