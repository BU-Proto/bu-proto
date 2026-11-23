// npm test: the Pipeline and Activity routes' row helpers: who a row points at, what a PATCH
// really sent, how deals and follow-ups are ordered, and a deal's history.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEAL_STAGES, dealPatch } from '../../shared/crm.ts'
import { compareDeals, compareFollowUps, dealTimeline, personIds, personLink, sentFields, stageAfter } from './crmRows.ts'

const nobody = { member_id: null, member_name: null, contact_id: null, contact_name: null, contact_org_name: null }

test('a row links to its member or its contact, with the contact’s org', () => {
  assert.deepEqual(personLink({ ...nobody, member_id: 12, member_name: 'Maya Chen' }), { key: 'm12', name: 'Maya Chen', orgName: null })
  assert.deepEqual(personLink({ ...nobody, contact_id: 4, contact_name: 'Rachel Kim', contact_org_name: 'Northline Ventures' }), {
    key: 'c4',
    name: 'Rachel Kim',
    orgName: 'Northline Ventures',
  })
  assert.equal(personLink(nobody), null)
  // A deleted person leaves an id with no name behind a LEFT JOIN: no link rather than a blank one.
  assert.equal(personLink({ ...nobody, contact_id: 9 }), null)
})

test('a person key fills one side only', () => {
  assert.deepEqual(personIds({ type: 'member', id: 3 }), { memberId: 3, contactId: null })
  assert.deepEqual(personIds({ type: 'contact', id: 8 }), { memberId: null, contactId: 8 })
  assert.deepEqual(personIds(null), { memberId: null, contactId: null })
})

test('a PATCH keeps only what was sent, not the create schema’s defaults', () => {
  const raw = { stage: 'talking' }
  const parsed = dealPatch.parse(raw)
  // zod fills these in for a partial; the route must not write them.
  assert.equal(parsed.ask, '')
  assert.deepEqual(sentFields(parsed, raw), { stage: 'talking' })
  const cleared = { ownerEmail: '', ask: '$500' }
  assert.deepEqual(sentFields(dealPatch.parse(cleared), cleared), { ownerEmail: null, ask: '$500' })
})

test('stages move forward one at a time and stop at delivered', () => {
  assert.equal(stageAfter('identified', DEAL_STAGES), 'reached_out')
  assert.equal(stageAfter('committed', DEAL_STAGES), 'delivered')
  assert.equal(stageAfter('delivered', DEAL_STAGES), null)
})

test('deals with the soonest follow-up lead; the rest by last change', () => {
  const deals = [
    { id: 1, nextFollowUp: null, updatedAt: '2026-11-10 10:00:00' },
    { id: 2, nextFollowUp: { dueOn: '2026-11-25' }, updatedAt: '2026-11-01 10:00:00' },
    { id: 3, nextFollowUp: { dueOn: '2026-11-18' }, updatedAt: '2026-11-01 10:00:00' },
    { id: 4, nextFollowUp: null, updatedAt: '2026-11-19 10:00:00' },
  ]
  assert.deepEqual(
    deals.sort(compareDeals).map((deal) => deal.id),
    [3, 2, 4, 1],
  )
})

test('open follow-ups by due day come before done ones, newest done first', () => {
  const list = [
    { id: 1, dueOn: '2026-11-22', doneAt: null },
    { id: 2, dueOn: '2026-11-10', doneAt: '2026-11-12 09:00:00' },
    { id: 3, dueOn: '2026-11-18', doneAt: null },
    { id: 4, dueOn: '2026-11-01', doneAt: '2026-11-15 09:00:00' },
  ]
  assert.deepEqual(
    list.sort(compareFollowUps).map((item) => item.id),
    [3, 1, 4, 2],
  )
})

test('a deal’s history: what was logged, what was done, the change and the start, newest first', () => {
  const items = dealTimeline({
    deal: {
      stageLabel: 'Talking',
      ask: '$3,000',
      createdAt: '2026-10-02 14:00:00',
      updatedAt: '2026-11-19 16:00:00',
      createdBy: 'andres@bu.edu',
      passedAt: null,
    },
    interactions: [
      {
        label: 'Call',
        person: { key: 'c4', name: 'Rachel Kim', orgName: 'Northline Ventures' },
        summary: 'Yes to Dec 3.',
        happenedOn: '2026-11-16',
        createdBy: 'andres@bu.edu',
        createdAt: '2026-11-16 20:00:00',
      },
      // Backdated: logged on the 14th about the 12th.
      {
        label: 'Note',
        person: null,
        summary: 'They bring food.\nWe handle A/V.',
        happenedOn: '2026-11-12',
        createdBy: 'jose@bu.edu',
        createdAt: '2026-11-14 15:00:00',
      },
    ],
    followUps: [
      { title: 'Send the one-pager', doneAt: '2026-11-17 12:00:00', ownerEmail: 'andres@bu.edu' },
      { title: 'Still open', doneAt: null, ownerEmail: 'andres@bu.edu' },
    ],
  })
  assert.deepEqual(
    items.map((item) => [item.label, item.title]),
    [
      ['Stage', 'At Talking'],
      ['Done', 'Send the one-pager'],
      ['Call', 'Rachel Kim'],
      ['Note', 'They bring food.'],
      ['Created', 'Deal created'],
    ],
  )
  assert.equal(items[2].href, '/admin/people/c4')
  assert.equal(items[4].detail, 'Ask: $3,000')
})

test('something logged today sorts by when it was logged, among the deal’s own changes', () => {
  const items = dealTimeline({
    deal: { stageLabel: 'Committed', ask: '', createdAt: '2026-11-20 22:30:00', updatedAt: '2026-11-20 22:31:00', createdBy: 'a@bu.edu', passedAt: null },
    interactions: [{ label: 'Meeting', person: null, summary: 'Tiers', happenedOn: '2026-11-20', createdBy: 'a@bu.edu', createdAt: '2026-11-20 22:32:00' }],
    followUps: [],
  })
  assert.deepEqual(
    items.map((item) => item.label),
    ['Meeting', 'Stage', 'Created'],
  )
  assert.equal(items[0].at, '2026-11-20')
})

test('a passed deal says so instead of its last change', () => {
  const items = dealTimeline({
    deal: { stageLabel: 'Reached out', ask: '', createdAt: '2026-10-02 14:00:00', updatedAt: '2026-11-19 16:00:00', createdBy: 'a@bu.edu', passedAt: '2026-11-19 16:00:00' },
    interactions: [],
    followUps: [],
  })
  assert.deepEqual(
    items.map((item) => item.label),
    ['Passed', 'Created'],
  )
  assert.equal(items[1].detail, '')
})
