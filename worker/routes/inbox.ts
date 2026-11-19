import { Hono } from 'hono'
import { devReceiveInput, MAIL_STATUSES, replyDraftInput, replySendInput, threadPatch, type MailStatus } from '../../shared/api'
import { ApiError, idParam, readBody } from '../lib/http'
import { afterReceive, draftReply, listThreads, loadThread, parseAddress, receive, sendInThread, sentMail, messageIds, type IncomingMail } from '../lib/inbox'
import { getReceivedAttachment, getReceivedEmail, type ReceivedEmail } from '../lib/resend'
import { verifyWebhook } from '../lib/webhookSignature'
import type { AppEnv } from '../types'
import { setup } from './asks'

// The inbox: Resend's webhook for mail arriving at proto.boston (public, signed), and the
// portal's email client (conversations, Claude's replies, sending in the same thread).

const app = new Hono<AppEnv>()

// ---- Resend's webhook ---------------------------------------------------------------------------

/** A header from a received email, whatever case Resend gives its name in. */
function header(email: ReceivedEmail, name: string): string {
  const value = Object.entries(email.headers ?? {}).find(([key]) => key.toLowerCase() === name)?.[1]
  return Array.isArray(value) ? value.join(' ') : (value ?? '')
}

function toIncoming(email: ReceivedEmail, receivedFor: string[]): IncomingMail {
  // headers.from keeps the display name; the top-level from may be the bare address.
  const from = parseAddress(header(email, 'from') || email.from)
  return {
    resendId: email.id,
    fromName: from.name,
    fromEmail: from.email || parseAddress(email.from).email,
    to: email.to ?? [],
    cc: email.cc ?? [],
    recipients: [...(email.to ?? []), ...(email.cc ?? []), ...receivedFor],
    subject: email.subject ?? '',
    text: email.text ?? '',
    html: email.html ?? '',
    messageId: email.message_id,
    inReplyTo: header(email, 'in-reply-to') || null,
    references: messageIds(header(email, 'references')),
    attachments: (email.attachments ?? [])
      // Inline images (logos, signatures) aren't files anyone needs.
      .filter((file) => file.content_disposition !== 'inline')
      .map((file) => ({ id: file.id, filename: file.filename, contentType: file.content_type })),
    authentication: email.authentication,
  }
}

// POST /api/inbound/resend: Resend says an email arrived. Signed with RESEND_WEBHOOK_SECRET; the
// email itself is fetched from Resend's API, stored, and read by Claude after we've answered.
app.post('/api/inbound/resend', async (c) => {
  const secret = c.env.RESEND_WEBHOOK_SECRET
  if (!secret) throw new ApiError(404, 'Not found.')
  const body = await c.req.text()
  const valid = await verifyWebhook(secret, body, {
    id: c.req.header('svix-id'),
    timestamp: c.req.header('svix-timestamp'),
    signature: c.req.header('svix-signature'),
  })
  if (!valid) throw new ApiError(401, 'Bad signature.')

  const event = JSON.parse(body) as { type?: string; data?: { email_id?: string; received_for?: string[] } }
  if (event.type !== 'email.received' || !event.data?.email_id) return c.json({ ok: true, ignored: true })

  // A failure here answers 500, so Resend sends the webhook again later.
  const email = await getReceivedEmail(c.env, event.data.email_id)
  const stored = await receive(c.env, toIncoming(email, event.data.received_for ?? []))
  if (stored) c.executionCtx.waitUntil(afterReceive(c.env, new URL(c.req.url).origin, stored))
  return c.json({ ok: true })
})

// ---- The portal's email client ------------------------------------------------------------------

const isStatus = (value: string | undefined): value is MailStatus => (MAIL_STATUSES as readonly string[]).includes(value ?? '')

app.get('/api/admin/inbox', async (c) => {
  const status = c.req.query('status')
  const items = await listThreads(c.env.DB, isStatus(status) ? status : 'all')
  return c.json({ items, setup: setup(c.env) })
})

// Every one-to-one email sent (asks, follow-ups, replies). Before /:id, which would read "sent" as an id.
app.get('/api/admin/inbox/sent', async (c) => c.json({ items: await sentMail(c.env.DB) }))

// Local dev only: an email as if it had arrived, so the inbox can be tried without Resend.
app.post('/api/admin/inbox/dev-receive', async (c) => {
  if (!import.meta.env.DEV) throw new ApiError(404, 'Not found.')
  const input = await readBody(c, devReceiveInput)
  const to = input.to ?? 'hello@proto.boston'
  const stored = await receive(c.env, {
    resendId: null,
    fromName: input.fromName,
    fromEmail: input.fromEmail.toLowerCase(),
    to: [to],
    cc: [],
    recipients: [to],
    subject: input.subject,
    text: input.text,
    html: '',
    messageId: `<dev.${Date.now()}@example.com>`,
    inReplyTo: null,
    references: [],
    attachments: [],
    authentication: null,
  })
  if (!stored) throw new ApiError(409, 'Already stored.')
  await afterReceive(c.env, new URL(c.req.url).origin, stored)
  return c.json({ item: await loadThread(c.env, stored.threadId) }, 201)
})

app.get('/api/admin/inbox/:id', async (c) => c.json({ item: await loadThread(c.env, idParam(c)), setup: setup(c.env) }))

// Done / open / waiting, marking it read, or saving the reply as edited.
app.patch('/api/admin/inbox/:id', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, threadPatch)
  await loadThread(c.env, id)
  const sets: string[] = []
  const values: unknown[] = []
  if (input.status) {
    sets.push('status = ?')
    values.push(input.status)
    if (input.status === 'done') sets.push('unread = 0')
  }
  if (input.read) sets.push('unread = 0')
  if (input.draftBody !== undefined) {
    sets.push('draft_body = ?')
    values.push(input.draftBody)
  }
  if (sets.length) {
    await c.env.DB.prepare(`UPDATE mail_threads SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
      .bind(...values, id)
      .run()
  }
  return c.json({ item: await loadThread(c.env, id) })
})

// Claude writes the reply to the latest email, with the teammate's notes and answers.
app.post('/api/admin/inbox/:id/draft', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, replyDraftInput)
  const admin = c.var.admin
  const { notice } = await draftReply(c.env, id, input, { email: admin.email, name: admin.name ?? '' })
  return c.json({ item: await loadThread(c.env, id), ...(notice && { notice }) })
})

// Sends the reply in the same conversation, from whoever pressed Send.
app.post('/api/admin/inbox/:id/send', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, replySendInput)
  const thread = await loadThread(c.env, id)
  const admin = c.var.admin
  const lower = (list: string[]) => [...new Set(list.map((email) => email.trim().toLowerCase()))]
  const to = lower(input.to)
  const cc = lower(input.cc).filter((email) => !to.includes(email))
  const status = await sendInThread(c.env, {
    threadId: thread.id,
    kind: 'reply',
    from: { email: admin.email, name: admin.name ?? '' },
    to,
    cc,
    subject: input.subject,
    body: input.body,
    replyToFallback: admin.email,
    origin: new URL(c.req.url).origin,
  })
  if (status === 'failed') {
    await c.env.DB.prepare(`UPDATE mail_threads SET draft_body = ? WHERE id = ?`).bind(input.body, id).run()
    throw new ApiError(502, "Resend didn't accept the email. Nothing was sent. Check the server logs, then try again.")
  }
  return c.json({ item: await loadThread(c.env, id), logged: status === 'logged' })
})

// A received email's file: fetched from Resend (its link lasts an hour) and handed over as a
// download, never shown inline, so a file can't run as a page on the portal's address.
app.get('/api/admin/inbox/messages/:messageId/attachments/:attachmentId', async (c) => {
  const messageId = idParam(c, 'messageId')
  const attachmentId = c.req.param('attachmentId')
  const row = await c.env.DB.prepare(`SELECT resend_id, attachments FROM mail_messages WHERE id = ? AND direction = 'in'`)
    .bind(messageId)
    .first<{ resend_id: string | null; attachments: string }>()
  const listed = row ? (JSON.parse(row.attachments) as { id: string; filename: string }[]).find((file) => file.id === attachmentId) : undefined
  if (!row?.resend_id || !listed) throw new ApiError(404, 'That file isn’t on this email.')
  const file = await getReceivedAttachment(c.env, row.resend_id, attachmentId)
  const response = await fetch(file.download_url)
  if (!response.ok || !response.body) throw new ApiError(502, 'Couldn’t fetch the file from Resend. Try again.')
  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${listed.filename.replace(/["\\\r\n]/g, '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  })
})

export default app
