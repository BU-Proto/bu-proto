// npm test: how People folds members and contacts together and orders what happened with them.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { atKey, clip, foldContacts, inList, latestTouch, matchesQuery, newestFirst, splitSummary } from './people.ts'

test('a bare day sorts among that day’s timestamps, not before all of them', () => {
  assert.equal(atKey('2026-11-18'), '2026-11-18 12:00:00')
  assert.equal(atKey('2026-11-18 09:30:00'), '2026-11-18 09:30:00')
  assert.ok(atKey('2026-11-18') > atKey('2026-11-18 09:30:00'))
  assert.ok(atKey('2026-11-18') < atKey('2026-11-18 20:00:00'))
})

test('the latest touch wins across sources, skipping empty ones', () => {
  const touch = latestTouch([
    { label: 'Signed up', at: '2026-09-14 18:02:00' },
    null,
    { label: 'Coffee', at: '2026-11-18' },
    undefined,
    { label: 'RSVP', at: '2026-11-15 12:00:00' },
    { label: 'Nothing', at: '' },
  ])
  assert.deepEqual(touch, { label: 'Coffee', at: '2026-11-18' })
  assert.equal(latestTouch([]), null)
  assert.equal(latestTouch([null, { label: 'x', at: '' }]), null)
})

test('a timeline is newest first and keeps ties in the order they came', () => {
  const items = [
    { id: 'a', at: '2026-10-01 10:00:00' },
    { id: 'b', at: '2026-11-18' },
    { id: 'c', at: '2026-11-18 12:00:00' },
    { id: 'd', at: '2026-11-19 08:00:00' },
  ]
  assert.deepEqual(
    newestFirst(items).map((item) => item.id),
    ['d', 'b', 'c', 'a'],
  )
  // It returns a new array and leaves the input alone.
  assert.equal(items[0].id, 'a')
})

test('a contact with a member’s email folds into that member, whatever the case', () => {
  const fold = foldContacts(
    [
      { id: 1, email: 'dokafor@bu.edu' },
      { id: 2, email: 'mchen@bu.edu' },
    ],
    [
      { id: 7, email: ' DOkafor@BU.edu ' },
      { id: 8, email: 'rachel@northline.vc' },
      { id: 9, email: 'mchen@bu.edu' },
    ],
  )
  assert.deepEqual([...fold], [
    [7, 1],
    [9, 2],
  ])
})

test('search needs every word somewhere in the fields', () => {
  const fields = ['Rachel Kim', 'rachel@northline.vc', 'Northline Ventures', 'Partner', null]
  assert.ok(matchesQuery(fields, ''))
  assert.ok(matchesQuery(fields, 'northline partner'))
  assert.ok(matchesQuery(fields, '  KIM '))
  assert.ok(!matchesQuery(fields, 'rachel harbor'))
})

test('clip keeps the first line and cuts long ones', () => {
  assert.equal(clip('Coffee at the GSU\nMore notes'), 'Coffee at the GSU')
  assert.equal(clip('abcdefghij', 6), 'abcde…')
  assert.equal(clip('   '), '')
})

test('an interaction’s first sentence is its title, the rest goes underneath', () => {
  assert.deepEqual(splitSummary('Coffee at the GSU. Raising a pre-seed. Wants a partner.'), {
    title: 'Coffee at the GSU',
    rest: 'Raising a pre-seed. Wants a partner.',
  })
  assert.deepEqual(splitSummary('Quick check-in'), { title: 'Quick check-in', rest: '' })
  assert.deepEqual(splitSummary('First line\nSecond line'), { title: 'First line', rest: 'Second line' })
  assert.deepEqual(splitSummary(''), { title: '', rest: '' })
  const long = `${'word '.repeat(30)}end. More.`
  const split = splitSummary(long)
  assert.ok(split.title.endsWith('…'))
  assert.equal(split.rest, long.trim())
})

test('an empty IN list matches nothing instead of being a syntax error', () => {
  assert.equal(inList([]), '(NULL)')
  assert.equal(inList([1, 2]), '(?, ?)')
})
