// npm test: every board seat's role finds its pitch, however its title is typed in the portal.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BOARD_SEATS } from '../../shared/constants.ts'
import { SEATS, seatFor } from './seats.ts'

test('every board seat has a pitch', () => {
  for (const title of BOARD_SEATS.filter((seat) => seat !== 'Not sure yet')) {
    assert.ok(seatFor(title), `no pitch for ${title}`)
  }
})

test('a title matches however it is typed', () => {
  const scouting = SEATS['Head of Scouting']
  for (const typed of ['Head of Scouting', 'head of scouting', '  Head of  Scouting ', 'Head of Scouting!', 'HEAD OF SCOUTING']) {
    assert.equal(seatFor(typed), scouting, typed)
  }
})

test('a role that is not a seat has no pitch', () => {
  assert.equal(seatFor('Head of Design'), undefined)
  assert.equal(seatFor(''), undefined)
})
