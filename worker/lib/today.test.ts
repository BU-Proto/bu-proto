// npm test: the plain parts of Today and the Inbox's queue.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addDays, newestFirst, snippet, soonest, sortableMoment, totalWaiting } from './today.ts'

test('days add across months and years', () => {
  assert.equal(addDays('2026-11-20', 7), '2026-11-27')
  assert.equal(addDays('2026-11-28', 7), '2026-12-05')
  assert.equal(addDays('2026-12-30', 14), '2027-01-13')
  assert.equal(addDays('2026-03-01', -1), '2026-02-28')
})

test('a snippet keeps the sender’s own words and drops the email they quoted', () => {
  assert.equal(snippet('Thursday works.\n\nOn Tue, Nov 17, 2026 at 3:02 PM Jose <jose@proto.boston> wrote:\n> Does Thursday work?'), 'Thursday works.')
  assert.equal(snippet('Sounds good\n> earlier line\n> another'), 'Sounds good')
  assert.equal(snippet('Hi   there,\n\nsee   you soon'), 'Hi there, see you soon')
  // Collapsed already (as the inbox's list keeps it), the quote still goes.
  assert.equal(snippet('Yes please. On Mon, Nov 16, 2026, Dana Lee wrote: > would you'), 'Yes please.')
})

test('a long snippet stops at a word, with an ellipsis', () => {
  const long = 'We would love to sponsor the spring hack night and can put up prize money for the top three teams if that helps'
  const short = snippet(long, 60)
  assert.ok(short.length <= 61)
  assert.ok(short.endsWith('…'))
  assert.ok(!short.includes(' …'))
  assert.ok(long.startsWith(short.slice(0, -1)))
})

test('coming up keeps everything in the next two weeks, and at least six', () => {
  const at = (date: string, title = date) => ({ date, title })
  const today = '2026-11-20'
  // Past days never show.
  assert.deepEqual(soonest([at('2026-11-19'), at('2026-11-21')], today), [at('2026-11-21')])
  // Soonest first; same day by title.
  assert.deepEqual(soonest([at('2026-12-01', 'b'), at('2026-11-22'), at('2026-12-01', 'a')], today).map((item) => item.title), ['2026-11-22', 'a', 'b'])
  // Eight inside the fortnight all stay, so counting them is right.
  const busy = Array.from({ length: 8 }, (_, index) => at(`2026-11-2${index + 1}`))
  assert.equal(soonest(busy, today).length, 8)
  // A quiet month: the first six, however far off.
  const quiet = Array.from({ length: 9 }, (_, index) => at(`2027-0${index + 1}-01`))
  assert.equal(soonest(quiet, today).length, 6)
})

test('activity sorts days and timestamps together, newest first', () => {
  assert.equal(sortableMoment('2026-11-20'), '2026-11-20 12:00:00')
  assert.equal(sortableMoment('2026-11-20T14:03:00Z'), '2026-11-20 14:03:00')
  const items = [{ at: '2026-11-19 23:00:00' }, { at: '2026-11-20' }, { at: '2026-11-20 15:00:00' }, { at: '2026-11-18' }]
  assert.deepEqual(
    newestFirst(items, 3).map((item) => item.at),
    ['2026-11-20 15:00:00', '2026-11-20', '2026-11-19 23:00:00'],
  )
})

test('waiting adds up across the queues', () => {
  assert.equal(totalWaiting({ email: 2, signup: 3, fund: 0, application: 1, board: 0 }), 6)
  assert.equal(totalWaiting({}), 0)
})
