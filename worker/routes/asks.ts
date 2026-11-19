import { Hono, type Context } from 'hono'
import {
  askPatch,
  contactInput,
  draftAskInput,
  factInput,
  FORM_MAX_BYTES,
  formPatch,
  newAskInput,
  sendAskInput,
  webFormInput,
  type AskMessageEntry,
  type AskSetup,
  type Contact,
  type Fact,
} from '../../shared/api'
import { draftAsk, fillForm, loadAsk, loadAskRow, readPdf, savePdf, toAsk, type AskRow, type Author } from '../lib/asks'
import { bostonToday } from '../lib/dates'
import { escapeHtml } from '../lib/emailTemplate'
import { isGoogleFormUrl, readGoogleForm } from '../lib/googleForm'
import { ApiError, bodyFields, idParam, readBody } from '../lib/http'
import { readPdfFields } from '../lib/pdfForm'
import { sendPersonalEmail } from '../lib/resend'
import type { AppEnv } from '../types'

// Asks (emails to people we need something from), the contacts they go to, and Proto's facts.
// Claude drafts; a teammate presses Send. See lib/asks.ts and lib/claude.ts.

const app = new Hono<AppEnv>()

const author = (c: Context<AppEnv>): Author => ({ email: c.var.admin.email, name: c.var.admin.name ?? '' })

const setup = (env: Env): AskSetup => ({ claude: Boolean(env.ANTHROPIC_API_KEY), resend: Boolean(env.RESEND_API_KEY) })

// ---- Contacts ---------------------------------------------------------------------------------

interface ContactRow {
  id: number
  name: string
  email: string
  organization: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
  ask_count: number
}

const toContact = (row: ContactRow): Contact => ({
  id: row.id,
  name: row.name,
  email: row.email,
  organization: row.organization,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  askCount: row.ask_count ?? 0,
})

const CONTACT_SELECT = `SELECT c.*, (SELECT COUNT(*) FROM asks a WHERE a.contact_id = c.id) AS ask_count FROM contacts c`

async function loadContact(db: D1Database, id: number): Promise<Contact> {
  const row = await db.prepare(`${CONTACT_SELECT} WHERE c.id = ?`).bind(id).first<ContactRow>()
  if (!row) throw new ApiError(404, 'That contact no longer exists.')
  return toContact(row)
}

app.get('/api/admin/contacts', async (c) => {
  const { results } = await c.env.DB.prepare(`${CONTACT_SELECT} ORDER BY c.name COLLATE NOCASE, c.id`).all<ContactRow>()
  return c.json({ items: results.map(toContact) })
})

app.post('/api/admin/contacts', async (c) => {
  const input = await readBody(c, contactInput)
  const existing = await c.env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(input.email).first<{ id: number }>()
  if (existing) throw new ApiError(409, 'There’s already a contact with that email.', { email: 'Already a contact' })
  const row = await c.env.DB.prepare(
    'INSERT INTO contacts (name, email, organization, notes, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id',
  )
    .bind(input.name, input.email.trim(), input.organization, input.notes, c.var.admin.email)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the contact.')
  return c.json({ item: await loadContact(c.env.DB, row.id) }, 201)
})

app.patch('/api/admin/contacts/:id', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, contactInput)
  const clash = await c.env.DB.prepare('SELECT id FROM contacts WHERE email = ? AND id != ?').bind(input.email, id).first()
  if (clash) throw new ApiError(409, 'There’s already a contact with that email.', { email: 'Already a contact' })
  const result = await c.env.DB.prepare(
    `UPDATE contacts SET name = ?, email = ?, organization = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(input.name, input.email.trim(), input.organization, input.notes, id)
    .run()
  if (!result.meta.changes) throw new ApiError(404, 'That contact no longer exists.')
  return c.json({ item: await loadContact(c.env.DB, id) })
})

// Their asks stay (each keeps the name and email it was sent to).
app.delete('/api/admin/contacts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM contacts WHERE id = ?').bind(idParam(c)).run()
  return c.body(null, 204)
})

// ---- Facts --------------------------------------------------------------------------------------

interface FactRow {
  id: number
  label: string
  value: string
  source: string
  updated_by: string
  updated_at: string
}

const toFact = (row: FactRow): Fact => ({
  id: row.id,
  label: row.label,
  value: row.value,
  source: row.source,
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
})

app.get('/api/admin/facts', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM facts ORDER BY label COLLATE NOCASE').all<FactRow>()
  return c.json({ items: results.map(toFact) })
})

app.post('/api/admin/facts', async (c) => {
  const input = await readBody(c, factInput)
  const clash = await c.env.DB.prepare('SELECT 1 FROM facts WHERE label = ?').bind(input.label).first()
  if (clash) throw new ApiError(409, 'There’s already a fact with that name.', { label: 'Already a fact' })
  const row = await c.env.DB.prepare('INSERT INTO facts (label, value, source, updated_by) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(input.label, input.value, input.source || `${c.var.admin.name ?? c.var.admin.email}, ${bostonToday()}`, c.var.admin.email)
    .first<FactRow>()
  if (!row) throw new ApiError(500, 'Could not save the fact.')
  return c.json({ item: toFact(row) }, 201)
})

app.patch('/api/admin/facts/:id', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, factInput)
  const clash = await c.env.DB.prepare('SELECT 1 FROM facts WHERE label = ? AND id != ?').bind(input.label, id).first()
  if (clash) throw new ApiError(409, 'There’s already a fact with that name.', { label: 'Already a fact' })
  const row = await c.env.DB.prepare(
    `UPDATE facts SET label = ?, value = ?, source = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`,
  )
    .bind(input.label, input.value, input.source || `${c.var.admin.name ?? c.var.admin.email}, ${bostonToday()}`, c.var.admin.email, id)
    .first<FactRow>()
  if (!row) throw new ApiError(404, 'That fact no longer exists.')
  return c.json({ item: toFact(row) })
})

app.delete('/api/admin/facts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM facts WHERE id = ?').bind(idParam(c)).run()
  return c.body(null, 204)
})

// ---- Asks ---------------------------------------------------------------------------------------

// Every email an ask sent, for the Email page's history beside the list sends.
app.get('/api/admin/ask-messages', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT m.*, a.to_name, a.to_email FROM ask_messages m JOIN asks a ON a.id = m.ask_id ORDER BY m.created_at DESC, m.id DESC LIMIT 200`,
  ).all<{
    id: number
    ask_id: number
    kind: AskMessageEntry['kind']
    subject: string
    body: string
    attachments: string
    status: AskMessageEntry['status']
    sent_by: string
    created_at: string
    to_name: string
    to_email: string
  }>()
  const items: AskMessageEntry[] = results.map((row) => ({
    id: row.id,
    askId: row.ask_id,
    toName: row.to_name,
    toEmail: row.to_email,
    kind: row.kind,
    subject: row.subject,
    body: row.body,
    attachments: (() => {
      try {
        return JSON.parse(row.attachments) as string[]
      } catch {
        return []
      }
    })(),
    status: row.status,
    sentBy: row.sent_by,
    createdAt: row.created_at,
  }))
  return c.json({ items })
})

app.get('/api/admin/asks', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM asks ORDER BY updated_at DESC, id DESC').all<AskRow>()
  return c.json({ items: results.map(toAsk), setup: setup(c.env) })
})

app.post('/api/admin/asks', async (c) => {
  const input = await readBody(c, newAskInput)
  const db = c.env.DB
  let contact: { id: number; name: string; email: string; organization: string }
  if ('contactId' in input.to) {
    const row = await db.prepare('SELECT id, name, email, organization FROM contacts WHERE id = ?').bind(input.to.contactId).first<typeof contact>()
    if (!row) throw new ApiError(404, 'That contact no longer exists.', { to: 'Pick someone else' })
    contact = row
  } else {
    // Someone new becomes a contact, unless their email already is one.
    const to = input.to
    const known = await db.prepare('SELECT id, name, email, organization FROM contacts WHERE email = ?').bind(to.email).first<typeof contact>()
    contact =
      known ??
      (await db
        .prepare('INSERT INTO contacts (name, email, organization, notes, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id, name, email, organization')
        .bind(to.name, to.email.trim(), to.organization, to.notes, c.var.admin.email)
        .first<typeof contact>())!
  }
  const row = await db
    .prepare(
      `INSERT INTO asks (contact_id, to_name, to_email, to_organization, request, follow_up_days, owner_email, owner_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(contact.id, contact.name, contact.email, contact.organization, input.request, input.followUpDays, c.var.admin.email, c.var.admin.name ?? '')
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the ask.')
  return c.json({ item: await loadAsk(db, row.id) }, 201)
})

app.get('/api/admin/asks/:id', async (c) => c.json({ item: await loadAsk(c.env.DB, idParam(c)), setup: setup(c.env) }))

app.patch('/api/admin/asks/:id', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, askPatch)
  const ask = toAsk(await loadAskRow(c.env.DB, id))
  const sets: string[] = []
  const values: unknown[] = []
  const set = (column: string, value: unknown) => {
    sets.push(`${column} = ?`)
    values.push(value)
  }
  if (input.subject !== undefined) set('subject', input.subject)
  if (input.body !== undefined) set('body', input.body)
  if (input.followUpDays !== undefined) {
    set('follow_up_days', input.followUpDays)
    // A waiting ask's next follow-up moves with it, counted from the last email.
    if (ask.status === 'waiting') {
      const last = ask.sentAt ? (await c.env.DB.prepare('SELECT MAX(created_at) AS at FROM ask_messages WHERE ask_id = ?').bind(id).first<{ at: string }>())?.at : null
      set('follow_up_due', input.followUpDays > 0 && last ? addDays(last.slice(0, 10), input.followUpDays) : null)
    }
  }
  if (input.status !== undefined && input.status !== ask.status) {
    if (input.status === 'draft' && ask.sentAt) throw new ApiError(409, 'This one has been sent. Mark it waiting instead.')
    if (input.status === 'waiting' && !ask.sentAt) throw new ApiError(409, 'Send it first.')
    set('status', input.status)
    set('closed_at', input.status === 'answered' || input.status === 'closed' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null)
    // Done means no follow-up; waiting again starts the count from today.
    if (input.status === 'waiting') set('follow_up_due', ask.followUpDays > 0 ? addDays(bostonToday(), ask.followUpDays) : null)
    else set('follow_up_due', null)
  }
  if (sets.length) {
    await c.env.DB.prepare(`UPDATE asks SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`)
      .bind(...values, id)
      .run()
  }
  return c.json({ item: await loadAsk(c.env.DB, id) })
})

app.delete('/api/admin/asks/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM asks WHERE id = ?').bind(idParam(c)).run()
  return c.body(null, 204)
})

// Claude writes (or rewrites) the waiting email and fills the forms.
app.post('/api/admin/asks/:id/draft', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, draftAskInput)
  const { notice } = await draftAsk(c.env, id, input, author(c))
  return c.json({ item: await loadAsk(c.env.DB, id), ...(notice && { notice }) })
})

/** yyyy-mm-dd plus some days. */
function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** The email as plain text and as simple HTML: no banner, no template. It's one person writing to another. */
function personalEmail(body: string, signature: string[]) {
  const text = `${body.trimEnd()}\n\n${signature.join('\n')}`
  const paragraphs = body
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 14px">${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('')
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">${paragraphs}<p style="margin:18px 0 0;color:#555">${signature.map(escapeHtml).join('<br>')}</p></body></html>`
  return { text, html }
}

// Sends exactly what the teammate is looking at. From "<owner> from Proto", Reply-To and Cc the
// owner (and whoever pressed Send), so the reply lands in a person's inbox.
app.post('/api/admin/asks/:id/send', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, sendAskInput)
  const db = c.env.DB
  const ask = await loadAsk(db, id)
  if (ask.status === 'answered' || ask.status === 'closed') throw new ApiError(409, 'This ask is done. Open it again to write to them.')

  const attachments: { filename: string; content: Uint8Array }[] = []
  for (const form of ask.forms) {
    if (form.kind !== 'pdf' || !form.attach) continue
    const filled = form.filledSize > 0 ? await readPdf(db, form.id, 'filled') : null
    if (!filled) throw new ApiError(409, `${form.name} hasn’t been filled yet. Redraft, or untick “Attach” on it.`)
    attachments.push({ filename: `${form.name.replace(/[\\/:*?"<>|]/g, '').slice(0, 100)} - Proto.pdf`, content: filled })
  }

  const sender = c.var.admin
  const ownerName = ask.ownerName || ask.ownerEmail
  const cc = [...new Set([ask.ownerEmail, sender.email].map((email) => email.toLowerCase()))].filter((email) => email !== ask.toEmail.toLowerCase())
  const { text, html } = personalEmail(input.body, [ownerName, 'Proto · Boston University', new URL(c.req.url).origin.replace(/^https?:\/\//, '')])
  const kind = ask.status === 'draft' ? 'ask' : 'follow-up'

  // The row goes in first, as 'failed' until we know better: its id keys the send's idempotency.
  const message = await db
    .prepare(`INSERT INTO ask_messages (ask_id, kind, subject, body, attachments, status, sent_by) VALUES (?, ?, ?, ?, ?, 'failed', ?) RETURNING id`)
    .bind(id, kind, input.subject, input.body, JSON.stringify(attachments.map((file) => file.filename)), sender.email)
    .first<{ id: number }>()
  if (!message) throw new ApiError(500, 'Could not save the email.')

  const status = await sendPersonalEmail(
    c.env,
    {
      fromName: `${ownerName.split('@')[0]} from Proto`,
      to: ask.toEmail,
      cc,
      replyTo: ask.ownerEmail,
      subject: input.subject,
      text,
      html,
      attachments,
    },
    `ask-message-${message.id}`,
  )
  if (status === 'failed') {
    // The draft stays as it was, so it can go again.
    await db.prepare(`UPDATE asks SET subject = ?, body = ?, updated_at = datetime('now') WHERE id = ?`).bind(input.subject, input.body, id).run()
    throw new ApiError(502, "Resend didn't accept the email. Nothing was sent. Check the server logs, then try again.")
  }
  const today = bostonToday()
  await db.batch([
    db.prepare('UPDATE ask_messages SET status = ? WHERE id = ?').bind(status, message.id),
    db
      .prepare(
        `UPDATE asks SET status = 'waiting', subject = '', body = '', questions = '[]', notes = '',
           sent_at = COALESCE(sent_at, datetime('now')), follow_up_due = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(ask.followUpDays > 0 ? addDays(today, ask.followUpDays) : null, id),
  ])
  return c.json({ item: await loadAsk(db, id), logged: status === 'logged' })
})

// ---- An ask's forms -----------------------------------------------------------------------------

const TOO_BIG = `That PDF is over ${FORM_MAX_BYTES / 1024 / 1024} MB.`

// POST /api/admin/asks/:id/forms, a multipart form with the PDF as `file`.
app.post('/api/admin/asks/:id/forms', async (c) => {
  const id = idParam(c)
  await loadAskRow(c.env.DB, id)
  if (Number(c.req.header('Content-Length') ?? 0) > FORM_MAX_BYTES + 64 * 1024) {
    await c.req.raw.body?.cancel().catch(() => {})
    throw new ApiError(413, TOO_BIG, { file: TOO_BIG })
  }
  const fields = await bodyFields(c)
  const file = fields?.file
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, 'Choose a PDF.', { file: 'Choose a PDF' })
  if (file.size > FORM_MAX_BYTES) throw new ApiError(413, TOO_BIG, { file: TOO_BIG })
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new ApiError(415, 'That isn’t a PDF.', { file: 'Not a PDF' })

  const boxes = await readPdfFields(bytes)
  const name = (file.name.replace(/\.pdf$/i, '').trim() || 'Form').slice(0, 120)
  // A PDF with no boxes to fill gets an answer sheet instead, so there's no filled copy to attach.
  const row = await c.env.DB.prepare(`INSERT INTO ask_forms (ask_id, kind, name, fields, attach) VALUES (?, 'pdf', ?, ?, ?) RETURNING id`)
    .bind(id, name, JSON.stringify(boxes), boxes.length > 0 ? 1 : 0)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not save the form.')
  await savePdf(c.env.DB, row.id, 'blank', bytes)
  return c.json({ item: await loadAsk(c.env.DB, id) }, 201)
})

app.post('/api/admin/asks/:id/web-forms', async (c) => {
  const id = idParam(c)
  await loadAskRow(c.env.DB, id)
  const input = await readBody(c, webFormInput)
  let name = input.name
  let url = input.url
  let fields: unknown[] = []
  if (url && isGoogleFormUrl(url) && !input.questions) {
    const form = await readGoogleForm(url)
    if (!form) {
      const message = 'That Google Form needs a sign-in to open, so its questions can’t be read. Paste them below.'
      throw new ApiError(422, message, { questions: message })
    }
    if (form.fields.length === 0) throw new ApiError(422, 'That Google Form has no questions to answer.', { url: 'No questions found' })
    fields = form.fields
    url = form.url
    name ||= form.title
  }
  name ||= url ? new URL(url).hostname.replace(/^www\./, '') : 'Web form'
  await c.env.DB.prepare(`INSERT INTO ask_forms (ask_id, kind, name, url, questions, fields, attach) VALUES (?, 'web', ?, ?, ?, ?, 0)`)
    .bind(id, name.slice(0, 120), url, input.questions, JSON.stringify(fields))
    .run()
  return c.json({ item: await loadAsk(c.env.DB, id) }, 201)
})

async function loadForm(c: Context<AppEnv>) {
  const id = idParam(c)
  const formId = idParam(c, 'formId')
  const ask = await loadAsk(c.env.DB, id)
  const form = ask.forms.find((candidate) => candidate.id === formId)
  if (!form) throw new ApiError(404, 'That form no longer exists.')
  return { id, form }
}

// A teammate's own answers (re-fills a PDF), or whether the filled PDF goes with the email.
app.patch('/api/admin/asks/:id/forms/:formId', async (c) => {
  const { id, form } = await loadForm(c)
  const input = await readBody(c, formPatch)
  if (input.attach !== undefined) {
    await c.env.DB.prepare(`UPDATE ask_forms SET attach = ?, updated_at = datetime('now') WHERE id = ?`).bind(input.attach ? 1 : 0, form.id).run()
  }
  if (input.answers !== undefined) {
    // A note about a box that now has an answer goes; the rest stay.
    const answered = form.fields
      .filter((field) => input.answers?.some((answer) => answer.field === field.name && answer.value.trim()))
      .flatMap((field) => [field.name, field.label].filter(Boolean).map((word) => word.toLowerCase()))
    const missing = form.missing.filter((line) => !answered.some((word) => line.toLowerCase().includes(word)))
    await fillForm(c.env.DB, form, input.answers, missing)
  }
  return c.json({ item: await loadAsk(c.env.DB, id) })
})

app.delete('/api/admin/asks/:id/forms/:formId', async (c) => {
  const { id, form } = await loadForm(c)
  await c.env.DB.prepare('DELETE FROM ask_forms WHERE id = ?').bind(form.id).run()
  return c.json({ item: await loadAsk(c.env.DB, id) })
})

// The blank or filled PDF, for a teammate to open and check.
app.get('/api/admin/asks/:id/forms/:formId/:copy{blank|filled}', async (c) => {
  const { form } = await loadForm(c)
  const copy = c.req.param('copy') as 'blank' | 'filled'
  const bytes = await readPdf(c.env.DB, form.id, copy)
  if (!bytes) throw new ApiError(404, copy === 'filled' ? 'It hasn’t been filled yet.' : 'Not found.')
  const filename = `${form.name}${copy === 'filled' ? ' - Proto' : ''}.pdf`.replace(/["\\\r\n]/g, '')
  return c.body(bytes, 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
})

export default app
