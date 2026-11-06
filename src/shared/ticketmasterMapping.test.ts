import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampPageSize,
  firstString,
  formatEventDate,
  mapTicketmasterCategory,
} from './ticketmasterMapping.ts';

test('firstString handles strings, arrays and junk', () => {
  assert.equal(firstString('  austin '), 'austin');
  assert.equal(firstString(['a', 'b']), 'a');
  assert.equal(firstString([{ nested: 1 }]), '');
  assert.equal(firstString({ a: 1 }), '');
  assert.equal(firstString(undefined), '');
});

test('clampPageSize keeps values in range and falls back on bad input', () => {
  assert.equal(clampPageSize(undefined), '20');
  assert.equal(clampPageSize('10'), '10');
  assert.equal(clampPageSize('9999'), '50');
  assert.equal(clampPageSize('0'), '20');
  assert.equal(clampPageSize('-5'), '20');
  assert.equal(clampPageSize('abc'), '20');
  assert.equal(clampPageSize(['7', '999']), '7');
  assert.equal(clampPageSize('12.9'), '12');
});

test('Arts & Theatre events are Theater, not Comedy', () => {
  assert.equal(mapTicketmasterCategory('Arts & Theatre', 'Musical'), 'Theater');
  assert.equal(mapTicketmasterCategory('Arts & Theatre', 'Theatre'), 'Theater');
  assert.equal(mapTicketmasterCategory('Arts & Theatre', 'Opera'), 'Theater');
});

test('comedy is detected by genre, whatever the segment', () => {
  assert.equal(mapTicketmasterCategory('Arts & Theatre', 'Comedy'), 'Comedy');
  assert.equal(mapTicketmasterCategory('Miscellaneous', 'Stand-Up Comedy'), 'Comedy');
});

test('music, sports and EDM mapping', () => {
  assert.equal(mapTicketmasterCategory('Music', 'Rock'), 'Concert');
  assert.equal(mapTicketmasterCategory('Music', 'Dance/Electronic'), 'EDM / Festival');
  assert.equal(mapTicketmasterCategory('Music', 'Electronic'), 'EDM / Festival');
  assert.equal(mapTicketmasterCategory('Sports', 'Basketball'), 'Sports');
  assert.equal(mapTicketmasterCategory('', ''), 'Concert');
});

test('ballet (Dance outside Music) is not EDM', () => {
  assert.equal(mapTicketmasterCategory('Arts & Theatre', 'Dance'), 'Theater');
});

test('formatEventDate formats real dates without timezone drift', () => {
  assert.equal(formatEventDate('2026-08-01'), 'Saturday, August 1, 2026');
  assert.equal(formatEventDate('2026-12-31'), 'Thursday, December 31, 2026');
});

test('formatEventDate returns the raw value for anything that is not a real date', () => {
  assert.equal(formatEventDate('not-a-date'), 'not-a-date');
  assert.equal(formatEventDate('2026-02-30'), '2026-02-30');
  assert.equal(formatEventDate(''), '');
});
