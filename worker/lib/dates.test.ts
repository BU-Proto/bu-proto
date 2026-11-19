// npm test: dates counted the way Boston counts them, not UTC.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bostonDay } from './dates.ts'

test('an evening email in Boston is that day, not the next (UTC) one', () => {
  // 01:30 UTC on Nov 20 is 8:30 PM on Nov 19 in Boston (EST).
  assert.equal(bostonDay('2026-11-20 01:30:00'), '2026-11-19')
  // 03:00 UTC on Jul 1 is 11 PM on Jun 30 (EDT).
  assert.equal(bostonDay('2026-07-01 03:00:00'), '2026-06-30')
  assert.equal(bostonDay('2026-11-20 15:00:00'), '2026-11-20')
})
