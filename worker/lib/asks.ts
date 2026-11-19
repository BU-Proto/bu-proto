import { TYPED_SOURCE, type Ask, type AskAnswer, type AskDetail, type AskForm, type AskMessage, type AskQuestion, type FormAnswer, type FormField } from '../../shared/api'
import { standInDraft, writeDraft, type DraftContext } from './claude'
import { bostonToday } from './dates'
import { prefillUrl } from './googleForm'
import { ApiError } from './http'
import { fillPdf } from './pdfForm'

// Asks: reading and writing them, their forms' PDFs, and Claude's drafts. The routes in
// routes/asks.ts and the daily follow-up check (the Cron Trigger) both come through here.

export interface AskRow {
  id: number
  contact_id: number | null
  to_name: string
  to_email: string
  to_organization: string
  request: string
  notes: string
  subject: string
  body: string
  draft_kind: Ask['draftKind']
  questions: string
  answers: string
  status: Ask['status']
  follow_up_days: number
  follow_up_due: string | null
  owner_email: string
  owner_name: string
  drafted_at: string | null
  sent_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

interface FormRow {
  id: number
  ask_id: number
  kind: AskForm['kind']
  name: string
  url: string
  questions: string
  fields: string
  answers: string
  missing: string
  attach: number
  blank_size: number
  filled_size: number
}

interface MessageRow {
  id: number
  kind: AskMessage['kind']
  subject: string
  body: string
  attachments: string
  status: AskMessage['status']
  sent_by: string
  created_at: string
}

/** A JSON column, or `fallback` when it's somehow not JSON (never worth a 500). */
function json<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toAsk(row: AskRow): Ask {
  return {
    id: row.id,
    contactId: row.contact_id,
    toName: row.to_name,
    toEmail: row.to_email,
    toOrganization: row.to_organization,
    request: row.request,
    notes: row.notes,
    subject: row.subject,
    body: row.body,
    draftKind: row.draft_kind,
    questions: json<AskQuestion[]>(row.questions, []),
    answers: json<AskAnswer[]>(row.answers, []),
    status: row.status,
    followUpDays: row.follow_up_days,
    followUpDue: row.follow_up_due,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    draftedAt: row.drafted_at,
    sentAt: row.sent_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toForm(row: FormRow): AskForm {
  const fields = json<FormField[]>(row.fields, [])
  const answers = json<FormAnswer[]>(row.answers, [])
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    url: row.url,
    questions: row.questions,
    fields,
    answers,
    missing: json<string[]>(row.missing, []),
    attach: row.attach === 1,
    blankSize: row.blank_size,
    filledSize: row.filled_size,
    prefillUrl: row.kind === 'web' && fields.length ? prefillUrl(row.url, fields, answers) : null,
  }
}

export async function loadAskRow(db: D1Database, id: number): Promise<AskRow> {
  const row = await db.prepare('SELECT * FROM asks WHERE id = ?').bind(id).first<AskRow>()
  if (!row) throw new ApiError(404, 'That ask no longer exists.')
  return row
}

export async function loadAsk(db: D1Database, id: number): Promise<AskDetail> {
  const [ask, forms, messages] = await db.batch([
    db.prepare('SELECT * FROM asks WHERE id = ?').bind(id),
    db.prepare('SELECT * FROM ask_forms WHERE ask_id = ? ORDER BY id').bind(id),
    db.prepare('SELECT * FROM ask_messages WHERE ask_id = ? ORDER BY id').bind(id),
  ])
  const row = ask.results[0] as AskRow | undefined
  if (!row) throw new ApiError(404, 'That ask no longer exists.')
  return {
    ...toAsk(row),
    forms: (forms.results as FormRow[]).map(toForm),
    messages: (messages.results as MessageRow[]).map((message) => ({
      id: message.id,
      kind: message.kind,
      subject: message.subject,
      body: message.body,
      attachments: json<string[]>(message.attachments, []),
      status: message.status,
      sentBy: message.sent_by,
      createdAt: message.created_at,
    })),
  }
}

// ---- A form's PDF, in parts -----------------------------------------------------------------

/** D1 holds at most 2 MB in one value; a form may run to 5 MB. */
const PART_BYTES = 1024 * 1024

export async function savePdf(db: D1Database, formId: number, copy: 'blank' | 'filled', bytes: Uint8Array): Promise<void> {
  const parts: D1PreparedStatement[] = []
  for (let offset = 0, part = 0; offset < bytes.byteLength; offset += PART_BYTES, part += 1) {
    parts.push(
      db.prepare('INSERT INTO ask_form_parts (form_id, copy, part, data) VALUES (?, ?, ?, ?)').bind(formId, copy, part, bytes.slice(offset, offset + PART_BYTES)),
    )
  }
  const size = copy === 'blank' ? 'blank_size' : 'filled_size'
  await db.batch([
    db.prepare('DELETE FROM ask_form_parts WHERE form_id = ? AND copy = ?').bind(formId, copy),
    ...parts,
    db.prepare(`UPDATE ask_forms SET ${size} = ?, updated_at = datetime('now') WHERE id = ?`).bind(bytes.byteLength, formId),
  ])
}

export async function readPdf(db: D1Database, formId: number, copy: 'blank' | 'filled'): Promise<Uint8Array<ArrayBuffer> | null> {
  const { results } = await db
    .prepare('SELECT data FROM ask_form_parts WHERE form_id = ? AND copy = ? ORDER BY part')
    .bind(formId, copy)
    .all<{ data: ArrayBuffer | number[] }>()
  if (results.length === 0) return null
  // D1 hands a BLOB back as an array of bytes; the local one as a buffer.
  const chunks = results.map(({ data }) => (data instanceof ArrayBuffer ? new Uint8Array(data) : Uint8Array.from(data)))
  const bytes = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.byteLength, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

/** Starts each `missing` line the PDF itself refused, so the next fill can replace them. */
const REFUSED = 'Couldn’t fill: '

/**
 * Store a PDF form's answers and fill its boxes. Returns the answers kept and what's missing,
 * with anything the PDF refused added to `missing`, so nothing is dropped silently.
 */
export async function fillForm(db: D1Database, form: AskForm, answers: FormAnswer[], missing: string[]): Promise<void> {
  let kept = answers.filter((answer) => answer.value.trim() !== '')
  // What the last fill refused is said again (or not) by this one.
  let gaps = [...new Set(missing.filter((line) => !line.startsWith(REFUSED)))]
  if (form.kind === 'pdf' && form.fields.length > 0) {
    // A signature is never kept, let alone filled; it's said in `missing` instead.
    const signatures = form.fields.filter((field) => field.type === 'signature')
    for (const field of signatures) {
      if (kept.some((answer) => answer.field === field.name)) gaps.push(`${field.label || field.name}: a signature is left for a person`)
    }
    const known = new Set(form.fields.filter((field) => field.type !== 'signature').map((field) => field.name))
    kept = kept.filter((answer) => known.has(answer.field))
    const blank = await readPdf(db, form.id, 'blank')
    if (blank) {
      const filled = await fillPdf(blank, kept)
      gaps = [...gaps, ...filled.problems.map((problem) => `${REFUSED}${problem}`)]
      await savePdf(db, form.id, 'filled', filled.bytes)
    }
  }
  await db
    .prepare(`UPDATE ask_forms SET answers = ?, missing = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(JSON.stringify(kept), JSON.stringify([...new Set(gaps)]), form.id)
    .run()
}

// ---- Drafting -------------------------------------------------------------------------------

export interface Author {
  email: string
  name: string
}

/** What Claude may say about Proto in any email: its facts, its upcoming events, its board. */
export async function protoContext(
  db: D1Database,
  today: string,
): Promise<{ facts: DraftContext['facts']; events: DraftContext['events']; board: DraftContext['board'] }> {
  const [facts, events, board] = await db.batch([
    db.prepare('SELECT label, value, source FROM facts ORDER BY label COLLATE NOCASE'),
    db.prepare(`SELECT title, date, time, place FROM events WHERE published = 1 AND placeholder = 0 AND date >= ? ORDER BY date, id LIMIT 8`).bind(today),
    db.prepare('SELECT name, role FROM board_members WHERE published = 1 AND placeholder = 0 ORDER BY position, id'),
  ])
  return {
    facts: facts.results as DraftContext['facts'],
    events: events.results as DraftContext['events'],
    board: board.results as DraftContext['board'],
  }
}

/** Keep an answer about Proto itself as a fact, so the next form doesn't ask again. */
function rememberStatement(db: D1Database, question: string, answer: string, source: string, by: string): D1PreparedStatement {
  // "Who is Proto's faculty advisor?" → "Proto's faculty advisor"
  const bare = question
    .replace(/\?\s*$/, '')
    .replace(/^(what|who|which|where|when)(['’]s|\s+(is|are|was|were))\s+(the\s+)?/i, '')
    .trim()
  const label = (bare.charAt(0).toUpperCase() + bare.slice(1) || question).slice(0, 80)
  return db
    .prepare(
      `INSERT INTO facts (label, value, source, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT (label) DO UPDATE SET value = excluded.value, source = excluded.source,
         updated_by = excluded.updated_by, updated_at = datetime('now')`,
    )
    .bind(label, answer, source, by)
}

/**
 * Claude writes the waiting email (the first, or a follow-up once the ask is out) and answers
 * its forms. New answers are saved first; those about Proto itself become facts. Returns a
 * notice when the draft is the local stand-in.
 */
export async function draftAsk(
  env: Env,
  id: number,
  input: { notes: string; answers: { question: string; answer: string; remember: boolean }[] },
  by: Author,
): Promise<{ notice?: string }> {
  const db = env.DB
  const ask = await loadAsk(db, id)
  if (ask.status === 'answered' || ask.status === 'closed') throw new ApiError(409, 'This ask is done. Open it again to write to them.')
  const kind = ask.status === 'draft' ? 'ask' : 'follow-up'
  const today = bostonToday()

  // Answers first: they're kept even if Claude then can't be reached.
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const answers = [...ask.answers]
  const remembers: D1PreparedStatement[] = []
  for (const given of input.answers) {
    const entry: AskAnswer = { question: given.question, answer: given.answer, by: by.name || by.email, at: now }
    const index = answers.findIndex((answer) => answer.question === given.question)
    if (index >= 0) answers[index] = entry
    else answers.push(entry)
    if (given.remember) {
      remembers.push(rememberStatement(db, given.question, given.answer, `${entry.by}, ${today}, answering ask #${id}`, by.email))
    }
  }
  await db.batch([
    db.prepare(`UPDATE asks SET answers = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`).bind(JSON.stringify(answers), input.notes, id),
    ...remembers,
  ])

  const [{ facts, events, board }, contact] = await Promise.all([
    protoContext(db, today),
    db.prepare('SELECT notes FROM contacts WHERE id = ?').bind(ask.contactId ?? 0).first<{ notes: string }>(),
  ])

  const forms: DraftContext['forms'] = []
  for (const form of ask.forms) {
    forms.push({
      id: form.id,
      kind: form.kind,
      name: form.name,
      url: form.url,
      questions: form.questions,
      fields: form.fields,
      attach: form.attach,
      // A follow-up only names the forms: they were filled for the first email and stay as they are.
      pdf: form.kind === 'pdf' && kind === 'ask' ? await readPdf(db, form.id, 'blank') : null,
    })
  }

  const waiting = ask.body.trim() !== '' && ask.draftKind === kind
  const context: DraftContext = {
    kind,
    today,
    teammate: { name: ask.ownerName, email: ask.ownerEmail },
    to: { name: ask.toName, email: ask.toEmail, organization: ask.toOrganization, notes: contact?.notes ?? '' },
    request: ask.request,
    notes: input.notes,
    answers,
    previous: waiting ? { subject: ask.subject, body: ask.body } : null,
    sent: ask.messages
      .filter((message) => message.status !== 'failed')
      .map((message) => ({ kind: message.kind, subject: message.subject, body: message.body, date: message.createdAt.slice(0, 10) })),
    facts,
    events,
    board,
    forms,
  }

  let notice: string | undefined
  let draft
  if (env.ANTHROPIC_API_KEY) {
    const written = await writeDraft(env, context)
    draft = written.draft
    if (written.problems.length) notice = `Check the wording before you send: ${written.problems.join('; ')}.`
  } else if (import.meta.env.DEV) {
    draft = standInDraft(context)
    notice = 'Claude isn’t set up on this server (no ANTHROPIC_API_KEY), so this is a stand-in: your request as typed.'
  } else {
    throw new ApiError(502, 'Claude isn’t set up yet. An owner adds the ANTHROPIC_API_KEY secret (see the README).')
  }

  await db
    .prepare(
      `UPDATE asks SET subject = ?, body = ?, draft_kind = ?, questions = ?, drafted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(draft.subject.trim().slice(0, 200), draft.body.trim(), kind, JSON.stringify(draft.questions.slice(0, 20)), id)
    .run()
  if (kind === 'ask') {
    for (const result of draft.forms) {
      const form = ask.forms.find((candidate) => candidate.id === result.formId)
      if (!form) continue
      // What a teammate typed into a form themselves stays over Claude's answer for that field.
      const typed = form.answers.filter((answer) => answer.source === TYPED_SOURCE)
      const mine = new Set(typed.map((answer) => answer.field))
      await fillForm(db, form, [...result.answers.filter((answer) => !mine.has(answer.field)), ...typed], result.missing)
    }
  }
  return { notice }
}

/**
 * The daily check: an ask that's been waiting past its follow-up day, with nothing drafted yet,
 * gets a follow-up drafted for a teammate to look at. Never sent from here.
 */
export async function draftFollowUps(env: Env): Promise<void> {
  if (!env.ANTHROPIC_API_KEY) return
  const { results } = await env.DB.prepare(
    `SELECT id FROM asks WHERE status = 'waiting' AND follow_up_due IS NOT NULL AND follow_up_due <= ? AND body = ''
     ORDER BY follow_up_due, id LIMIT 10`,
  )
    .bind(bostonToday())
    .all<{ id: number }>()
  for (const { id } of results) {
    try {
      await draftAsk(env, id, { notes: '', answers: [] }, { email: 'claude', name: 'Claude' })
    } catch (error) {
      console.error(`[asks] follow-up for ask ${id} failed:`, error)
    }
  }
}
