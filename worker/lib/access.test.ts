// npm test: who can change what. The levels and areas from shared/access.ts, and the table that
// puts every write the portal had before levels behind its gate.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canChange, parseAreas, type Access, type Gate } from '../../shared/access.ts'
import { gateFor } from './access.ts'

const owner: Access = { level: 'owner', areas: [] }
const admin: Access = { level: 'admin', areas: [] }
const community: Access = { level: 'board', areas: ['community'] }
const twoSeats: Access = { level: 'board', areas: ['fund', 'scouting'] }
const team: Access = { level: 'team', areas: [] }

test('owners and admins change everything', () => {
  for (const access of [owner, admin]) {
    for (const gate of ['shared', 'partnerships', 'fund', 'community', 'scouting', 'admin'] as Gate[]) {
      assert.equal(canChange(access, gate), true, `${access.level} / ${gate}`)
    }
  }
})

test('the board changes shared work and the areas they hold, nothing else', () => {
  assert.equal(canChange(community, 'shared'), true)
  assert.equal(canChange(community, 'community'), true)
  assert.equal(canChange(community, 'fund'), false)
  assert.equal(canChange(community, 'admin'), false)
  assert.equal(canChange(twoSeats, 'fund'), true)
  assert.equal(canChange(twoSeats, 'scouting'), true)
  assert.equal(canChange(twoSeats, 'partnerships'), false)
})

test('the team changes shared work only, even if a row still lists areas', () => {
  assert.equal(canChange(team, 'shared'), true)
  assert.equal(canChange(team, 'community'), false)
  assert.equal(canChange({ level: 'team', areas: ['fund'] }, 'fund'), false)
  assert.equal(canChange(team, 'admin'), false)
})

test('areas read from the admins table, ignoring blanks, repeats and anything unknown', () => {
  assert.deepEqual(parseAreas('partnerships,fund'), ['partnerships', 'fund'])
  assert.deepEqual(parseAreas(' fund , fund,,owner,Scouting,community '), ['fund', 'community'])
  assert.deepEqual(parseAreas(''), [])
  assert.deepEqual(parseAreas(null), [])
  assert.deepEqual(parseAreas(undefined), [])
})

test('reads are never gated', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'get']) {
    assert.equal(gateFor(method, '/api/admin/fund/3'), null)
    assert.equal(gateFor(method, '/api/admin/founders'), null)
    assert.equal(gateFor(method, '/api/admin/admins'), null)
  }
})

test('content writes sit behind the area for their kind', () => {
  const cases: [string, string, Gate][] = [
    ['POST', '/api/admin/content/events', 'community'],
    ['PUT', '/api/admin/content/events/4', 'community'],
    ['DELETE', '/api/admin/content/hackathons/9', 'community'],
    ['PUT', '/api/admin/content/wins/2', 'scouting'],
    ['POST', '/api/admin/content/board', 'admin'],
    ['DELETE', '/api/admin/content/roles/1', 'admin'],
    // A kind that doesn't exist gets the strictest gate rather than none.
    ['POST', '/api/admin/content/secrets', 'admin'],
    ['POST', '/api/admin/content/toString', 'admin'],
  ]
  for (const [method, path, gate] of cases) assert.equal(gateFor(method, path), gate, `${method} ${path}`)
})

test('every other existing write has its gate', () => {
  const cases: [string, string, Gate][] = [
    ['DELETE', '/api/admin/rsvps/12', 'community'],
    ['PATCH', '/api/admin/fund/3', 'fund'],
    ['DELETE', '/api/admin/fund/3', 'fund'],
    ['PATCH', '/api/admin/applications/5', 'admin'],
    ['DELETE', '/api/admin/applications/5', 'admin'],
    ['PATCH', '/api/admin/roles/2/filled', 'admin'],
    ['PATCH', '/api/admin/founders/6', 'admin'],
    ['DELETE', '/api/admin/founders/6', 'admin'],
    ['POST', '/api/admin/admins', 'admin'],
    ['PATCH', '/api/admin/admins/sam%40bu.edu', 'admin'],
    ['POST', '/api/admin/admins/sam%40bu.edu/invite', 'admin'],
    ['DELETE', '/api/admin/admins/sam@bu.edu', 'admin'],
    ['POST', '/api/admin/email/send', 'community'],
    ['POST', '/api/admin/email/test', 'shared'],
    ['POST', '/api/admin/email/preview', 'shared'],
    ['POST', '/api/admin/email/draft', 'shared'],
    ['POST', '/api/admin/email/automatic/welcome/test', 'shared'],
    ['POST', '/api/admin/hackathon-imports/run', 'community'],
    ['POST', '/api/admin/hackathon-imports/7/add', 'community'],
    ['POST', '/api/admin/hackathon-imports/7/dismiss', 'community'],
    ['POST', '/api/admin/hackathon-imports/7/restore', 'community'],
    ['POST', '/api/admin/event-import/import', 'community'],
    ['POST', '/api/admin/event-import/lookup', 'shared'],
    ['POST', '/api/admin/devpost/import', 'scouting'],
    ['POST', '/api/admin/devpost/lookup', 'shared'],
    ['PATCH', '/api/admin/members/8', 'shared'],
    ['DELETE', '/api/admin/members/8', 'shared'],
    ['DELETE', '/api/admin/board-interest/4', 'shared'],
    ['POST', '/api/admin/contacts', 'shared'],
    ['PATCH', '/api/admin/contacts/3', 'shared'],
    ['POST', '/api/admin/facts', 'shared'],
    ['DELETE', '/api/admin/facts/3', 'shared'],
    ['POST', '/api/admin/asks', 'shared'],
    ['POST', '/api/admin/asks/3/send', 'shared'],
    ['PATCH', '/api/admin/inbox/3', 'shared'],
    ['POST', '/api/admin/inbox/3/send', 'shared'],
    ['POST', '/api/admin/uploads', 'shared'],
  ]
  for (const [method, path, gate] of cases) assert.equal(gateFor(method, path), gate, `${method} ${path}`)
})

test('a trailing slash changes nothing', () => {
  assert.equal(gateFor('PATCH', '/api/admin/fund/3/'), 'fund')
  assert.equal(gateFor('POST', '/api/admin/email/send//'), 'community')
})

test('the CRM routes are left to gate themselves', () => {
  const paths = [
    '/api/admin/people',
    '/api/admin/people/4',
    '/api/admin/orgs/2',
    '/api/admin/deals',
    '/api/admin/deals/3',
    '/api/admin/interactions',
    '/api/admin/follow-ups/1',
    '/api/admin/intros',
    '/api/admin/events/5/guests',
    '/api/admin/events/5/guests/2',
    '/api/admin/today',
    '/api/admin/queue/9',
  ]
  for (const path of paths) assert.equal(gateFor('POST', path), null, path)
})
