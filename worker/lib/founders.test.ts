// npm test: the Founders Circle's contract. What the application form takes and how it comes out,
// what the portal can change on one, and the invite-only flag on events.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AUTOMATIC_EMAIL_KEYS,
  FOUNDER_STATUSES,
  RESOURCE_SPECS,
  eventInput,
  founderApplicationInput,
  founderApplicationPatch,
} from '../../shared/api.ts'

const application = {
  name: '  Ada Lovelace ',
  email: ' Ada@Example.COM ',
  company: 'Pantry Pal',
  stage: 'Launched, with users',
  commitment: 'Alongside school or work',
  building: 'A fridge camera app for students who waste food.',
  progress: 'Shipped the app and got 40 people using it weekly.',
}

/** The field each issue is about, from a failed parse. */
function issueFields(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }): string[] {
  return (result.error?.issues ?? []).map((issue) => String(issue.path[0]))
}

test('an application needs only the required answers, and the rest come back empty', () => {
  const parsed = founderApplicationInput.parse(application)
  assert.equal(parsed.name, 'Ada Lovelace')
  assert.equal(parsed.email, 'ada@example.com')
  assert.equal(parsed.school, '')
  assert.equal(parsed.link, '')
  assert.equal(parsed.team, '')
  assert.equal(parsed.help, '')
})

test('a link typed without its https:// gets one, and anything but a web link is turned away', () => {
  assert.equal(founderApplicationInput.parse({ ...application, link: 'pantrypal.app' }).link, 'https://pantrypal.app')
  assert.equal(founderApplicationInput.parse({ ...application, link: 'http://pantrypal.app/demo' }).link, 'http://pantrypal.app/demo')
  assert.deepEqual(issueFields(founderApplicationInput.safeParse({ ...application, link: 'javascript:alert(1)' })), ['link'])
  assert.deepEqual(issueFields(founderApplicationInput.safeParse({ ...application, link: 'not a link' })), ['link'])
})

test('the stage and the time on it must be ones the form offers', () => {
  const result = founderApplicationInput.safeParse({ ...application, stage: 'Unicorn', commitment: 'Weekends' })
  assert.deepEqual(issueFields(result).sort(), ['commitment', 'stage'])
})

test('the written answers are required and have a limit', () => {
  assert.deepEqual(issueFields(founderApplicationInput.safeParse({ ...application, building: '   ', progress: '' })).sort(), ['building', 'progress'])
  assert.deepEqual(issueFields(founderApplicationInput.safeParse({ ...application, building: 'x'.repeat(1001) })), ['building'])
  assert.deepEqual(issueFields(founderApplicationInput.safeParse({ ...application, company: '' })), ['company'])
})

test('a filled honeypot fails the schema (the route answers bots before it gets here)', () => {
  assert.equal(founderApplicationInput.safeParse({ ...application, website: 'spam.example' }).success, false)
  assert.equal(founderApplicationInput.safeParse({ ...application, website: '' }).success, true)
})

test('the portal sets a status, notes or the interview day, and clears the day with null or an empty string', () => {
  assert.deepEqual(founderApplicationPatch.parse({ status: 'interview', interviewOn: '2026-12-03' }), { status: 'interview', interviewOn: '2026-12-03' })
  assert.deepEqual(founderApplicationPatch.parse({ interviewOn: null }), { interviewOn: null })
  assert.deepEqual(founderApplicationPatch.parse({ interviewOn: '' }), { interviewOn: null })
  assert.deepEqual(founderApplicationPatch.parse({}), {})
  assert.equal(founderApplicationPatch.safeParse({ interviewOn: '3 December' }).success, false)
  assert.equal(founderApplicationPatch.safeParse({ status: 'reviewing' }).success, false)
  for (const status of FOUNDER_STATUSES) assert.equal(founderApplicationPatch.safeParse({ status }).success, true, status)
})

test('an event is open unless it says it is invite only, and the editor has the switch', () => {
  const event = {
    kind: 'Fireside',
    title: 'Founders dinner',
    date: '2026-12-10',
    time: '7:00 PM',
    place: 'CDS',
    text: '',
    registerUrl: '',
    photo: '',
    description: '',
    agenda: [],
    hosts: [],
    gallery: [],
    placeholder: false,
    published: true,
  }
  assert.equal(eventInput.parse(event).inviteOnly, false)
  assert.equal(eventInput.parse({ ...event, inviteOnly: true }).inviteOnly, true)
  const field = RESOURCE_SPECS.events.fields.find((spec) => spec.key === 'inviteOnly')
  assert.deepEqual(field && { column: field.column, type: field.type, label: field.label }, { column: 'invite_only', type: 'boolean', label: 'Invite only' })
})

test('the Founders Circle confirmation is one of the automatic emails', () => {
  assert.ok((AUTOMATIC_EMAIL_KEYS as readonly string[]).includes('founders'))
})
