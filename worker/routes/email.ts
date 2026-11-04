import { Hono, type Context } from 'hono'
import {
  emailAudience,
  sendEmailInput,
  testEmailInput,
  type AudienceCount,
  type EmailAudience,
  type EmailCampaign,
} from '../../shared/api'
import { randomToken } from '../lib/crypto'
import { escapeHtml, renderEmail, type EmailReason, type Recipient } from '../lib/emailTemplate'
import { ApiError, readBody } from '../lib/http'
import { sendEmails, type SendResult } from '../lib/resend'
import type { AppEnv } from '../types'

// Email from the portal (audiences, sends, the campaign log) and the public unsubscribe page.

const app = new Hono<AppEnv>()

// ---- Audiences --------------------------------------------------------------------------------

/** Everyone an audience reaches, deduped by email, plus why they're getting it. 404 for an unknown event. */
async function resolveAudience(db: D1Database, audience: EmailAudience): Promise<{ recipients: Recipient[]; reason: EmailReason }> {
  type Row = { email: string; name: string; unsubscribe_token?: string }
  let rows: Row[]
  let reason: EmailReason
  switch (audience.type) {
    case 'members':
    case 'track': {
      const byTrack = audience.type === 'track'
      const query = db.prepare(
        `SELECT email, name, unsubscribe_token FROM members WHERE unsubscribed = 0${byTrack ? ' AND track = ?' : ''} ORDER BY id`,
      )
      rows = (await (byTrack ? query.bind(audience.track) : query).all<Row>()).results
      reason = { kind: 'member' }
      break
    }
    case 'event': {
      const event = await db.prepare('SELECT title FROM events WHERE id = ?').bind(audience.eventId).first<{ title: string }>()
      if (!event) throw new ApiError(404, 'That event no longer exists.')
      rows = (await db.prepare('SELECT email, name FROM rsvps WHERE event_id = ? ORDER BY id').bind(audience.eventId).all<Row>())
        .results
      reason = { kind: 'event', title: event.title }
      break
    }
    case 'fund': {
      const query = audience.status
        ? db.prepare('SELECT email, name FROM fund_interest WHERE status = ? ORDER BY id').bind(audience.status)
        : db.prepare('SELECT email, name FROM fund_interest ORDER BY id')
      rows = (await query.all<Row>()).results
      reason = { kind: 'fund' }
      break
    }
  }

  const byEmail = new Map<string, Recipient>()
  for (const row of rows) {
    const key = row.email.trim().toLowerCase()
    if (!byEmail.has(key)) {
      byEmail.set(key, { email: row.email.trim(), name: row.name, ...(row.unsubscribe_token && { unsubscribeToken: row.unsubscribe_token }) })
    }
  }
  return { recipients: [...byEmail.values()], reason }
}

app.get('/api/admin/email/audience', async (c) => {
  let raw: unknown
  try {
    raw = JSON.parse(c.req.query('audience') ?? '')
  } catch {
    throw new ApiError(400, 'Choose who to send to.')
  }
  const parsed = emailAudience.safeParse(raw)
  if (!parsed.success) throw new ApiError(400, 'Choose who to send to.')
  const { recipients } = await resolveAudience(c.env.DB, parsed.data)
  return c.json({ count: recipients.length } satisfies AudienceCount)
})

// ---- Sending ----------------------------------------------------------------------------------

interface CampaignRow {
  id: number
  subject: string
  body: string
  audience: string
  recipient_count: number
  sent_count: number
  failed_count: number
  status: EmailCampaign['status']
  sent_by: string
  created_at: string
}

function toCampaign(row: CampaignRow): EmailCampaign {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    audience: JSON.parse(row.audience) as EmailAudience,
    recipientCount: row.recipient_count,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    status: row.status,
    sentBy: row.sent_by,
    createdAt: row.created_at,
  }
}

function campaignStatus(result: SendResult): EmailCampaign['status'] {
  if (result.logged) return 'logged'
  if (result.failed === 0) return 'sent'
  return result.sent === 0 ? 'failed' : 'partial'
}

const originOf = (c: Context) => new URL(c.req.url).origin

app.post('/api/admin/email/send', async (c) => {
  const input = await readBody(c, sendEmailInput)
  const { recipients, reason } = await resolveAudience(c.env.DB, input.audience)
  if (recipients.length === 0) throw new ApiError(400, 'Nobody to send to.')

  // The row goes in first, as 'failed' until we know better: its id keys the idempotency of
  // every batch, and a Worker that dies mid-send still leaves a record that something went out.
  const campaign = await c.env.DB.prepare(
    `INSERT INTO email_campaigns (subject, body, audience, recipient_count, status, sent_by)
     VALUES (?, ?, ?, ?, 'failed', ?) RETURNING id`,
  )
    .bind(input.subject, input.body, JSON.stringify(input.audience), recipients.length, c.var.admin.login)
    .first<{ id: number }>()
  if (!campaign) throw new ApiError(500, 'Could not save the campaign.')

  const origin = originOf(c)
  const emails = recipients.map((recipient) => ({
    to: recipient.email,
    ...renderEmail({ subject: input.subject, body: input.body, recipient, reason, origin }),
  }))
  const result = await sendEmails(c.env, emails, `campaign-${campaign.id}`)

  const row = await c.env.DB.prepare(
    `UPDATE email_campaigns SET sent_count = ?, failed_count = ?, status = ? WHERE id = ? RETURNING *`,
  )
    .bind(result.sent, result.failed, campaignStatus(result), campaign.id)
    .first<CampaignRow>()
  if (!row) throw new ApiError(500, 'Could not save the campaign.')
  return c.json({ item: toCampaign(row) }, 201)
})

app.post('/api/admin/email/test', async (c) => {
  const input = await readBody(c, testEmailInput)
  const admin = c.var.admin
  const email = renderEmail({
    subject: `[Test] ${input.subject}`,
    body: input.body,
    recipient: { email: input.to, name: admin.name ?? admin.login },
    reason: { kind: 'test' },
    origin: originOf(c),
  })
  const result = await sendEmails(c.env, [{ to: input.to, ...email }], `test-${randomToken(12)}`)
  if (!result.logged && result.sent === 0) throw new ApiError(502, "Resend didn't accept the email. Check the server logs.")
  return c.json({ ok: true, logged: result.logged })
})

app.get('/api/admin/email/campaigns', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM email_campaigns ORDER BY created_at DESC, id DESC').all<CampaignRow>()
  return c.json({ items: results.map(toCampaign) })
})

// ---- Unsubscribe (public) -----------------------------------------------------------------------
// GET only shows a button: link scanners prefetch every URL in an email, so a GET must never
// unsubscribe. POST does it, from the button or from a mail client's one-click (RFC 8058) request,
// whose body is just `List-Unsubscribe=One-Click`. The token alone decides; sameOrigin exempts this path.
// Known and unknown tokens get the same answer, so the page can't be used to probe tokens.

function page(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} · BU Proto</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #061a2e; color: #fff;
    font: 16px/1.6 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  main { max-width: 420px; padding: 32px 24px; }
  .brand { font: 700 13px 'JetBrains Mono', ui-monospace, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase;
    color: #9df0a8; margin: 0 0 12px; }
  h1 { font-size: 28px; line-height: 1.2; margin: 0 0 12px; }
  p { margin: 0 0 20px; color: rgba(255, 255, 255, .78); }
  button { font: 600 15px Inter, sans-serif; color: #061a2e; background: #9df0a8; border: 0; border-radius: 6px;
    padding: 12px 20px; cursor: pointer; }
  button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  a { color: #9df0a8; }
</style>
</head>
<body>
<main>
<p class="brand">BU Proto</p>
${content}
</main>
</body>
</html>
`
}

function htmlPage(c: Context, title: string, content: string, status: 200 | 400 = 200): Response {
  c.header('Cache-Control', 'no-store')
  // The token is in the URL; don't hand it to any page this one links to.
  c.header('Referrer-Policy', 'no-referrer')
  c.header('X-Robots-Tag', 'noindex')
  return c.html(page(title, content), status)
}

function readToken(c: Context): string | null {
  const token = c.req.query('token')?.trim()
  return token && token.length <= 200 ? token : null
}

const badLink = (c: Context) =>
  htmlPage(
    c,
    'Link incomplete',
    `<h1>This link looks incomplete.</h1>
<p>Open the unsubscribe link from the bottom of a BU Proto email again, or just reply to the email and we'll take you off the list.</p>`,
    400,
  )

app.get('/api/unsubscribe', (c) => {
  const token = readToken(c)
  if (!token) return badLink(c)
  return htmlPage(
    c,
    'Unsubscribe',
    `<h1>Unsubscribe from BU Proto emails?</h1>
<p>You'll stop getting member emails from BU Proto. You can join again any time from the site.</p>
<form method="post" action="/api/unsubscribe?token=${escapeHtml(encodeURIComponent(token))}">
<button type="submit">Unsubscribe</button>
</form>`,
  )
})

app.post('/api/unsubscribe', async (c) => {
  const token = readToken(c)
  if (!token) return badLink(c)
  await c.env.DB.prepare(
    "UPDATE members SET unsubscribed = 1, updated_at = datetime('now') WHERE unsubscribe_token = ? AND unsubscribed = 0",
  )
    .bind(token)
    .run()
  return htmlPage(
    c,
    "You're unsubscribed",
    `<h1>You're unsubscribed.</h1>
<p>BU Proto won't send you member emails anymore. Event updates for things you RSVP to may still come through.</p>
<p>Still hearing from us? Reply to any of our emails and we'll take you off by hand.</p>`,
  )
})

export default app
