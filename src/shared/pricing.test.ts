import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPrice, getEventMinPrice } from './pricing.ts';
import type { PlatformListing } from '../types';

const platform = (...totals: number[]): PlatformListing => ({
  platformName: 'SeatGeek',
  logoColor: '#000',
  reliabilityScore: 98,
  directUrl: 'https://example.com',
  tiers: totals.map((totalPrice) => ({
    tierName: 'General Admission',
    basePrice: totalPrice,
    fee: 0,
    totalPrice,
    availableCount: 1,
    dealScore: 'Standard',
    inStock: true,
  })),
});

test('getEventMinPrice uses platform tiers when present', () => {
  assert.equal(getEventMinPrice({ ticketPlatforms: [platform(80, 60), platform(70)] }), 60);
});

test('getEventMinPrice falls back to the published price range', () => {
  assert.equal(
    getEventMinPrice({ ticketPlatforms: [], priceRange: { min: 35, max: 90, currency: 'USD' } }),
    35,
  );
});

test('getEventMinPrice returns null (not Infinity) when the price is unknown', () => {
  assert.equal(getEventMinPrice({ ticketPlatforms: [] }), null);
  assert.equal(getEventMinPrice({ ticketPlatforms: [platform()] }), null);
});

test('formatPrice formats currency and survives bad currency codes', () => {
  assert.equal(formatPrice(50), '$50');
  assert.equal(formatPrice(1234, 'USD'), '$1,234');
  assert.equal(formatPrice(50, 'bogus-code'), '$50');
});
