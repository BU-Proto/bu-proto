// npm test: the check on Resend's webhooks. The example was signed by the official svix library
// (the scheme Resend uses) with a made-up secret, so this proves the check matches theirs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyWebhook } from './webhookSignature.ts'

const SIGNED_BY_SVIX = {
  secret: 'whsec_cHJvdG8gdGVzdCB3ZWJob29rIHNlY3JldCwgbm90IGEgcmVhbCBvbmUh',
  id: 'msg_2pYV0tB8X2jdQ4mZ',
  timestamp: '1795000000',
  body: '{"type":"email.received","created_at":"2026-11-19T06:00:00.000Z","data":{"email_id":"56761188-7520-42d8-8898-ff6fc54ce618","subject":"Re: Room for hack night"}}',
  signature: 'v1,rau3GiFbs6BuenWPspFKX4jQyjbOKTVwxwuY3/Icp00=',
}
const AT = 1795000000 * 1000
const headers = { id: SIGNED_BY_SVIX.id, timestamp: SIGNED_BY_SVIX.timestamp, signature: SIGNED_BY_SVIX.signature }

test('a request svix signed is accepted', async () => {
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, headers, AT), true)
})

test('one of several signatures is enough (a rotated secret sends both)', async () => {
  const both = { ...headers, signature: `v1,aGVsbG8= ${SIGNED_BY_SVIX.signature}` }
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, both, AT), true)
})

test('a changed body, id or secret is refused', async () => {
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body.replace('hack night', 'hack day'), headers, AT), false)
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, { ...headers, id: 'msg_other' }, AT), false)
  assert.equal(await verifyWebhook('whsec_b3RoZXIgc2VjcmV0', SIGNED_BY_SVIX.body, headers, AT), false)
})

test('a request more than five minutes off is refused, even when signed', async () => {
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, headers, AT + 6 * 60 * 1000), false)
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, headers, AT - 6 * 60 * 1000), false)
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, headers, AT + 4 * 60 * 1000), true)
})

test('missing headers or no secret are refused', async () => {
  assert.equal(await verifyWebhook('', SIGNED_BY_SVIX.body, headers, AT), false)
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, { ...headers, signature: undefined }, AT), false)
  assert.equal(await verifyWebhook(SIGNED_BY_SVIX.secret, SIGNED_BY_SVIX.body, { ...headers, timestamp: 'soon' }, AT), false)
})
