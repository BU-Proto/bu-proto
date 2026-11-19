import { Hono, type Context } from 'hono'
import {
  askPatch,
  contactInput,
  draftAskInput,
  factInput,
  formPatch,
  newAskInput,
  sendAskInput,
  webFormInput,
  type AskSetup,
  type Contact,
  type Fact,
} from '../../shared/api'
import { ASK_SELECT, draftAsk, fillForm, loadAsk, loadAskRow, toAsk, type AskRow, type Author } from '../lib/asks'
import { bostonDay, bostonToday } from '../lib/dates'
import { ApiError, idParam, readBody } from '../lib/http'
import { createThread, inboxOn, sendInThread } from '../lib/inbox'
import type { AppEnv } from '../types'

// Asks (emails to people we need something from), the contacts they go to, and Proto's facts.
// Claude drafts; a teammate presses Send. See lib/asks.ts and lib/claude.ts.

const app = new Hono<AppEnv>()

const author = (c: Context<AppEnv>): Author => ({ email: c.var.admin.email, name: c.var.admin.name ?? '' })

export const setup = (env: Env): AskSetup => ({ claude: Boolean(env.ANTHROPIC_API_KEY), resend: Boolean(env.RESEND_API_KEY), inbox: inboxOn(env) })

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

app.get('/api/admin/asks', async (c) => {
  const { results } = await c.env.DB.prepare(`${ASK_SELECT} ORDER BY a.updated_at DESC, a.id DESC`).all<AskRow>()
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
      const row = await loadAskRow(c.env.DB, id)
      const last = row.thread_id
        ? (await c.env.DB.prepare(`SELECT MAX(created_at) AS at FROM mail_messages WHERE thread_id = ? AND direction = 'out'`).bind(row.thread_id).first<{ at: string | null }>())?.at
        : null
      set('follow_up_due', input.followUpDays > 0 && last ? addDays(bostonDay(last), input.followUpDays) : null)
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

// Sends exactly what the teammate is looking at, in the ask's conversation: from "<owner> from
// Proto", the owner (and whoever pressed Send) on Cc. Replies come back to the inbox once it's set
// up, and to the owner until then.
app.post('/api/admin/asks/:id/send', async (c) => {
  const id = idParam(c)
  const input = await readBody(c, sendAskInput)
  const db = c.env.DB
  const ask = await loadAsk(db, id)
  if (ask.status === 'answered' || ask.status === 'closed') throw new ApiError(409, 'This ask is done. Open it again to write to them.')

  // Held while it sends: a second press, or a second teammate, gets a 409 instead of a second email.
  const held = await db
    .prepare(`UPDATE asks SET sending_at = datetime('now') WHERE id = ? AND status = ? AND (sending_at IS NULL OR sending_at < datetime('now', '-2 minutes'))`)
    .bind(id, ask.status)
    .run()
  if (!held.meta.changes) throw new ApiError(409, 'This ask is being sent right now. Give it a moment, then look again.')

  try {
    const sender = c.var.admin
    const cc = [...new Set([ask.ownerEmail, sender.email].map((email) => email.toLowerCase()))].filter((email) => email !== ask.toEmail.toLowerCase())
    const kind = ask.status === 'draft' ? 'ask' : 'follow-up'
    let threadId = ask.threadId
    if (!threadId) {
      threadId = await createThread(db, { subject: input.subject, contactId: ask.contactId, askId: ask.id })
      await db.prepare('UPDATE asks SET thread_id = ? WHERE id = ?').bind(threadId, id).run()
    }

    const status = await sendInThread(c.env, {
      threadId,
      kind,
      from: { email: ask.ownerEmail, name: ask.ownerName },
      sentBy: sender.email,
      scope: `ask-${ask.id}`,
      to: [ask.toEmail],
      cc,
      subject: input.subject,
      body: input.body,
      replyToFallback: ask.ownerEmail,
      origin: new URL(c.req.url).origin,
    })
    if (status === 'failed') {
      // The draft stays as it was, so it can go again.
      await db.prepare(`UPDATE asks SET subject = ?, body = ?, updated_at = datetime('now') WHERE id = ?`).bind(input.subject, input.body, id).run()
      throw new ApiError(502, "Resend didn't accept the email. Nothing was sent. Check the server logs, then try again.")
    }
    await db
      .prepare(
        `UPDATE asks SET status = 'waiting', subject = '', body = '', questions = '[]', notes = '',
           sent_at = COALESCE(sent_at, datetime('now')), follow_up_due = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(ask.followUpDays > 0 ? addDays(bostonToday(), ask.followUpDays) : null, id)
      .run()
    return c.json({ item: await loadAsk(db, id), logged: status === 'logged' })
  } finally {
    await db.prepare('UPDATE asks SET sending_at = NULL WHERE id = ?').bind(id).run()
  }
})

// ---- An ask's forms -----------------------------------------------------------------------------

app.post('/api/admin/asks/:id/web-forms', async (c) => {
  const id = idParam(c)
  await loadAskRow(c.env.DB, id)
  const input = await readBody(c, webFormInput)
  const name = input.name || (input.url ? new URL(input.url).hostname.replace(/^www\./, '') : 'Web form')
  await c.env.DB.prepare('INSERT INTO ask_forms (ask_id, name, url, questions) VALUES (?, ?, ?, ?)')
    .bind(id, name.slice(0, 120), input.url, input.questions)
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

// A teammate's own answers.
app.patch('/api/admin/asks/:id/forms/:formId', async (c) => {
  const { id, form } = await loadForm(c)
  const input = await readBody(c, formPatch)
  await fillForm(c.env.DB, form, input.answers, form.missing)
  return c.json({ item: await loadAsk(c.env.DB, id) })
})

app.delete('/api/admin/asks/:id/forms/:formId', async (c) => {
  const { id, form } = await loadForm(c)
  await c.env.DB.prepare('DELETE FROM ask_forms WHERE id = ?').bind(form.id).run()
  return c.json({ item: await loadAsk(c.env.DB, id) })
})

export default app
