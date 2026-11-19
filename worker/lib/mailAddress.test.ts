// npm test: how the inbox matches an email that arrives to the conversation it belongs to.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { messageIds, normalizeSubject, parseAddress, parseReplyAddress } from './mailAddress.ts'

test('a reply address gives back its thread and token', () => {
  assert.deepEqual(parseReplyAddress('reply-12-k3f9a2b7c1@proto.boston'), { id: 12, token: 'k3f9a2b7c1' })
  assert.deepEqual(parseReplyAddress(' Reply-7-ABC@proto.boston'), { id: 7, token: 'abc' })
  assert.equal(parseReplyAddress('hello@proto.boston'), null)
  assert.equal(parseReplyAddress('reply-x-abc@proto.boston'), null)
  assert.equal(parseReplyAddress('notreply-12-abc@proto.boston'), null)
})

test('subjects match across Re:, Fwd: and their other spellings', () => {
  assert.equal(normalizeSubject('Room for hack night, Dec 4'), 'room for hack night, dec 4')
  assert.equal(normalizeSubject('Re: RE: Fwd: Room for hack night, Dec 4'), 'room for hack night, dec 4')
  assert.equal(normalizeSubject('AW: Re[2]: Room   for hack night, Dec 4 '), 'room for hack night, dec 4')
  // "Re" inside a word or later in the subject stays.
  assert.equal(normalizeSubject('Request: a room'), 'request: a room')
})

test('addresses come apart into a name and a lowercased email', () => {
  assert.deepEqual(parseAddress('Dana Lee <Dana@BU.edu>'), { name: 'Dana Lee', email: 'dana@bu.edu' })
  assert.deepEqual(parseAddress('"Lee, Dana" <dana@bu.edu>'), { name: 'Lee, Dana', email: 'dana@bu.edu' })
  assert.deepEqual(parseAddress('dana@bu.edu'), { name: '', email: 'dana@bu.edu' })
})

test('Message-IDs are read out of References and In-Reply-To', () => {
  assert.deepEqual(messageIds('<a.1@proto.boston> <b-2@mail.gmail.com>\r\n <c@x>'), ['<a.1@proto.boston>', '<b-2@mail.gmail.com>', '<c@x>'])
  assert.deepEqual(messageIds(''), [])
})
