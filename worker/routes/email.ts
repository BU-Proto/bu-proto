import { Hono, type Context } from 'hono'
import {
  AUTOMATIC_EMAIL_KEYS,
  EMAIL_VARIABLES,
  emailAudience,
  previewEmailInput,
  sendEmailInput,
  testEmailInput,
  type AudienceCount,
  type AutomaticEmail,
  type AutomaticEmailKey,
  type EmailAudience,
  type EmailCampaign,
  type EmailPreview,
} from '../../shared/api'
import { boardDraft, fundDraft, nextEvent, renderDraft, rsvpDraft, sendDraft, welcomeDraft } from '../lib/confirmations'
import { randomToken } from '../lib/crypto'
import {
  escapeHtml,
  renderEmail,
  usedVariables,
  type EmailReason,
  type EventDetails,
  type Recipient,
  type VariableValues,
} from '../lib/emailTemplate'
import { ApiError, readBody } from '../lib/http'
import { sendEmails, type SendResult } from '../lib/resend'
import type { AppEnv } from '../types'

// Email from the portal (audiences, sends, the campaign log) and the public unsubscribe page.

const app = new Hono<AppEnv>()

// ---- Audiences --------------------------------------------------------------------------------

/** Everyone an audience reaches, deduped by email, plus why they're getting it. 404 for an unknown event. */
async function resolveAudience(db: D1Database, audience: EmailAudience): Promise<{ recipients: Recipient[]; reason: EmailReason }> {
  type Row = { email: string; name: string; unsubscribe_token?: string; track?: string }
  let rows: Row[]
  let reason: EmailReason
  switch (audience.type) {
    case 'members':
    case 'track': {
      const byTrack = audience.type === 'track'
      const query = db.prepare(
        `SELECT email, name, unsubscribe_token, track FROM members WHERE unsubscribed = 0${byTrack ? ' AND track = ?' : ''} ORDER BY id`,
      )
      rows = (await (byTrack ? query.bind(audience.track) : query).all<Row>()).results
      reason = { kind: 'member' }
      break
    }
    case 'event': {
      const event = await db
        .prepare('SELECT title, date, time, place FROM events WHERE id = ?')
        .bind(audience.eventId)
        .first<EventDetails>()
      if (!event) throw new ApiError(404, 'That event no longer exists.')
      rows = (await db.prepare('SELECT email, name FROM rsvps WHERE event_id = ? ORDER BY id').bind(audience.eventId).all<Row>())
        .results
      reason = { kind: 'event', event }
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
      byEmail.set(key, {
        email: row.email.trim(),
        name: row.name,
        ...(row.unsubscribe_token && { unsubscribeToken: row.unsubscribe_token }),
        ...(row.track && { track: row.track }),
      })
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
    .bind(input.subject, input.body, JSON.stringify(input.audience), recipients.length, c.var.admin.email)
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

const example = (token: string) => EMAIL_VARIABLES.find((variable) => variable.token === token)?.example ?? ''

/** Example values for every variable a person doesn't supply (track and the event ones). */
function exampleValues(): VariableValues {
  const values: VariableValues = {}
  for (const { token, example } of EMAIL_VARIABLES) {
    if (!['{{name}}', '{{fullName}}', '{{email}}'].includes(token)) values[token] = example
  }
  return values
}

app.post('/api/admin/email/test', async (c) => {
  const input = await readBody(c, testEmailInput)
  const admin = c.var.admin
  // The admin stands in for the person; there's no audience, so the rest are examples.
  const email = renderEmail({
    subject: `[Test] ${input.subject}`,
    body: input.body,
    recipient: { email: input.to, name: admin.name ?? admin.email },
    reason: { kind: 'test' },
    origin: originOf(c),
    values: exampleValues(),
  })
  const result = await sendEmails(c.env, [{ to: input.to, ...email }], `test-${randomToken(12)}`)
  if (!result.logged && result.sent === 0) throw new ApiError(502, "Resend didn't accept the email. Check the server logs.")
  return c.json({ ok: true, logged: result.logged })
})

// ---- Preview ------------------------------------------------------------------------------------

/** Unsubscribe links in previews use this instead of the member's real token, which must not leave the Worker. */
const PREVIEW_TOKEN = 'preview'

/** Stands in when the audience is empty. It gets an unsubscribe link only where a real send would. */
function sampleRecipient(audience: EmailAudience): Recipient {
  const member = audience.type === 'members' || audience.type === 'track'
  return {
    name: example('{{fullName}}'),
    email: example('{{email}}'),
    ...(member && { unsubscribeToken: PREVIEW_TOKEN, track: audience.type === 'track' ? audience.track : example('{{track}}') }),
  }
}

// Renders exactly what the send would for one recipient, and neither sends nor writes anything.
app.post('/api/admin/email/preview', async (c) => {
  const input = await readBody(c, previewEmailInput)
  const { recipients, reason } = await resolveAudience(c.env.DB, input.audience)
  const index = recipients.length ? input.index % recipients.length : 0
  const real = recipients.at(index)
  const recipient: Recipient = real
    ? { ...real, ...(real.unsubscribeToken && { unsubscribeToken: PREVIEW_TOKEN }) }
    : sampleRecipient(input.audience)
  const email = renderEmail({ subject: input.subject, body: input.body, recipient, reason, origin: originOf(c) })
  const used = new Set(usedVariables(input.subject, input.body))
  const unfilled = EMAIL_VARIABLES.filter(
    ({ token, audiences }) => used.has(token) && audiences && !audiences.includes(input.audience.type),
  ).map(({ token }) => token)
  return c.json({
    subject: email.subject,
    html: email.html,
    text: email.text,
    recipient: { name: recipient.name, email: recipient.email, sample: !real },
    index,
    recipientCount: recipients.length,
    unfilled,
  } satisfies EmailPreview)
})

// ---- Automatic emails ---------------------------------------------------------------------------

/** Stands in for the event when nothing is on the calendar, so the RSVP preview has something to show. */
const EXAMPLE_EVENT = { title: 'Hack night', date: '2026-11-12', time: '6:00–9:00 PM', place: 'CDS 1750' }

const AUTOMATIC_INFO: Record<AutomaticEmailKey, { title: string; when: string }> = {
  welcome: { title: 'Welcome', when: 'Sent when someone joins the list for the first time. Re-joining to update details doesn’t send it again.' },
  rsvp: { title: 'RSVP confirmation', when: 'Sent when someone RSVPs to an event. A repeat RSVP doesn’t send a second one.' },
  fund: { title: 'Grants list confirmation', when: 'Sent when someone joins the grants interest list.' },
  board: { title: 'Board seat confirmation', when: 'Sent when someone puts themselves forward for a board seat. The owners also get a note with what they wrote.' },
}

/** Each automatic email as the signed-in admin would get it. Unsubscribe links use the preview token. */
async function automaticDrafts(c: Context<AppEnv>) {
  const admin = c.var.admin
  const person = { name: admin.name ?? admin.email.split('@')[0], email: admin.email }
  const upcoming = await nextEvent(c.env)
  const event = upcoming ?? EXAMPLE_EVENT
  const origin = originOf(c)
  return {
    origin,
    sampleEvent: !upcoming,
    drafts: {
      welcome: welcomeDraft(origin, { ...person, track: 'Build', unsubscribeToken: PREVIEW_TOKEN }, upcoming),
      rsvp: rsvpDraft(person, event),
      fund: fundDraft(person),
      board: boardDraft({ ...person, year: 'Third year', role: 'External outreach', note: '' }),
    } satisfies Record<AutomaticEmailKey, unknown>,
  }
}

app.get('/api/admin/email/automatic', async (c) => {
  const { origin, sampleEvent, drafts } = await automaticDrafts(c)
  const items = AUTOMATIC_EMAIL_KEYS.map((key): AutomaticEmail => {
    const email = renderDraft(drafts[key], origin)
    return { key, ...AUTOMATIC_INFO[key], subject: email.subject, html: email.html, text: email.text, sampleEvent: key === 'rsvp' && sampleEvent }
  })
  return c.json({ items })
})

app.post('/api/admin/email/automatic/:key/test', async (c) => {
  const key = c.req.param('key') as AutomaticEmailKey
  if (!AUTOMATIC_EMAIL_KEYS.includes(key)) throw new ApiError(404, 'No such email.')
  const { origin, drafts } = await automaticDrafts(c)
  const draft = drafts[key]
  const result = await sendDraft(c.env, { ...draft, subject: `[Test] ${draft.subject}` }, origin, 'test')
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

// The sign-in screen's look: the field's colours behind a glass card, the wordmark top left.
// The field is a few radial gradients rather than the canvas, so the page needs no script.
function page(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(title)} · BU Proto</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html { background: #061a2e; }
  body { margin: 0; min-height: 100vh; min-height: 100dvh; display: grid; grid-template-rows: auto 1fr auto; color: #f6fbff;
    padding: max(18px, env(safe-area-inset-top, 0px)) 16px max(20px, env(safe-area-inset-bottom, 0px));
    font: 15px/1.55 Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;
    background:
      radial-gradient(38% 46% at 42% 30%, rgba(233, 161, 157, .95), rgba(214, 161, 171, .55) 45%, rgba(214, 161, 171, 0) 100%),
      radial-gradient(45% 55% at 82% 92%, rgba(193, 186, 206, .9), rgba(193, 186, 206, 0) 100%),
      radial-gradient(60% 80% at 0% 0%, #0576ad, rgba(5, 118, 173, 0) 100%),
      linear-gradient(115deg, #0477ac 0%, #0391c2 38%, #3aa7c8 62%, #1ea4cc 100%) #061a2e; }
  .brand { color: inherit; text-decoration: none; font-size: 18px; font-weight: 400;
    letter-spacing: -.01em; text-shadow: 0 1px 2px rgba(0, 25, 55, .55), 0 0 18px rgba(0, 25, 55, .45); justify-self: start; }
  main { align-self: center; justify-self: center; width: min(440px, 100%); display: grid; gap: 14px; padding: 26px 28px 28px;
    border: 1px solid rgba(255, 255, 255, .36); border-radius: 28px;
    background: linear-gradient(rgba(255, 255, 255, .15), rgba(255, 255, 255, .15)), rgba(6, 30, 56, .34);
    -webkit-backdrop-filter: blur(22px) saturate(140%); backdrop-filter: blur(22px) saturate(140%);
    box-shadow: 0 40px 90px -40px rgba(0, 15, 35, .85), inset 0 1px 0 rgba(255, 255, 255, .35);
    text-shadow: 0 1px 2px rgba(0, 25, 55, .3); }
  .path { margin: 0; color: rgba(246, 251, 255, .76); font: 12px 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; }
  .caret { margin-left: 2px; color: #9df0a8; }
  h1 { margin: 0; font-size: clamp(28px, 6vw, 34px); font-weight: 300; letter-spacing: -.03em; line-height: 1.1; text-wrap: balance; }
  p { margin: 0; color: rgba(246, 251, 255, .82); }
  form { margin: 6px 0 0; }
  button { width: 100%; min-height: 48px; padding: 12px 20px; border: 1px solid #fff; border-radius: 999px; background: #fff;
    color: #0b2a46; font: 500 14px Inter, system-ui, sans-serif; cursor: pointer; box-shadow: 0 14px 34px -16px rgba(0, 25, 55, .7); }
  button:hover { background: #eefbf0; }
  button:focus-visible, a:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  .fine { color: rgba(246, 251, 255, .7); font: 11px/1.6 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace; }
  .fine::before { content: '> '; color: #9df0a8; }
  .home { justify-self: center; color: rgba(246, 251, 255, .85); font-size: 13px; text-decoration: none;
    text-shadow: 0 1px 2px rgba(0, 25, 55, .55), 0 0 18px rgba(0, 25, 55, .45); }
  .home:hover { color: #fff; }
  @media (prefers-reduced-motion: no-preference) {
    main { animation: rise 500ms cubic-bezier(.2, .8, .2, 1); }
    .caret { animation: blink 1.1s steps(1) infinite; }
    button { transition: background 150ms, transform 150ms; }
    button:hover { transform: translateY(-1px); }
  }
  @keyframes rise { from { opacity: 0; transform: translateY(12px); } }
  @keyframes blink { 50% { opacity: 0; } }
</style>
</head>
<body>
<a class="brand" href="/">Proto<span class="caret">_</span></a>
<main>
<p class="path">~/unsubscribe<span class="caret">_</span></p>
${content}
</main>
<a class="home" href="/">Back to BU Proto</a>
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
</form>
<p class="fine">Changed your mind? Just close this page.</p>`,
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
<p class="fine">Still hearing from us? Reply to any of our emails and we'll take you off by hand.</p>`,
  )
})

export default app
