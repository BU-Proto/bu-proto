import { factLabelFor, TYPED_SOURCE, type Ask, type AskAnswer, type AskDetail, type AskForm, type AskQuestion, type FormAnswer, type MailReading } from '../../shared/api'
import { standInDraft, writeDraft, type DraftContext } from './claude'
import { bostonDay, bostonToday } from './dates'
import { escapeHtml } from './emailTemplate'
import { ApiError } from './http'
import { mailDomain, threadMessages } from './inbox'
import { sendPersonalEmail } from './resend'

// Asks: reading and writing them, their web forms' answers, and Claude's drafts. The routes in
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
  thread_id: number | null
  created_at: string
  updated_at: string
  /** From ASK_SELECT: the latest reply's time and Claude's reading of it. */
  reply_at?: string | null
  reply_reading?: string | null
}

/** Every ask column, plus its latest reply (when, and Claude's reading) for the list and the page. */
export const ASK_SELECT = `SELECT a.*,
  (SELECT m.created_at FROM mail_messages m WHERE m.thread_id = a.thread_id AND m.direction = 'in' ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS reply_at,
  (SELECT m.reading FROM mail_messages m WHERE m.thread_id = a.thread_id AND m.direction = 'in' ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS reply_reading
  FROM asks a`

interface FormRow {
  id: number
  ask_id: number
  name: string
  url: string
  questions: string
  answers: string
  missing: string
}

/** A JSON column, or `fallback` when it's somehow not JSON (never worth a 500). */
function json<T>(value: string | null, fallback: T): T {
  if (value === null) return fallback
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
    lastReply: row.reply_at && row.thread_id ? { at: row.reply_at, threadId: row.thread_id, reading: json<MailReading | null>(row.reply_reading ?? null, null) } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toForm(row: FormRow): AskForm {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    questions: row.questions,
    answers: json<FormAnswer[]>(row.answers, []),
    missing: json<string[]>(row.missing, []),
  }
}

export async function loadAskRow(db: D1Database, id: number): Promise<AskRow> {
  const row = await db.prepare('SELECT * FROM asks WHERE id = ?').bind(id).first<AskRow>()
  if (!row) throw new ApiError(404, 'That ask no longer exists.')
  return row
}

export async function loadAsk(db: D1Database, id: number): Promise<AskDetail> {
  const [ask, forms] = await db.batch([
    db.prepare(`${ASK_SELECT} WHERE a.id = ?`).bind(id),
    db.prepare('SELECT * FROM ask_forms WHERE ask_id = ? ORDER BY id').bind(id),
  ])
  const row = ask.results[0] as AskRow | undefined
  if (!row) throw new ApiError(404, 'That ask no longer exists.')
  return {
    ...toAsk(row),
    forms: (forms.results as FormRow[]).map(toForm),
    threadId: row.thread_id,
    messages: row.thread_id ? await threadMessages(db, row.thread_id) : [],
  }
}

// ---- A form's answers ------------------------------------------------------------------------

/** Store a web form's answers (the ones with a value) and what's still missing. */
export async function fillForm(db: D1Database, form: AskForm, answers: FormAnswer[], missing: string[]): Promise<void> {
  const kept = answers.filter((answer) => answer.value.trim() !== '')
  await db
    .prepare(`UPDATE ask_forms SET answers = ?, missing = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(JSON.stringify(kept), JSON.stringify([...new Set(missing)]), form.id)
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
export function rememberStatement(db: D1Database, label: string, answer: string, source: string, by: string): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO facts (label, value, source, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT (label) DO UPDATE SET value = excluded.value, source = excluded.source,
         updated_by = excluded.updated_by, updated_at = datetime('now')`,
    )
    .bind(label.trim().slice(0, 80), answer, source, by)
}

/**
 * Claude writes the waiting email (the first, or a follow-up once the ask is out) and answers
 * its forms. New answers are saved first; those about Proto itself become facts. Returns a
 * notice when the draft is the local stand-in.
 */
export async function draftAsk(
  env: Env,
  id: number,
  input: { notes: string; answers: { question: string; answer: string; remember: boolean; factLabel?: string }[] },
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
      remembers.push(rememberStatement(db, given.factLabel?.trim() || factLabelFor(given.question), given.answer, `${entry.by}, ${today}, answering ask #${id}`, by.email))
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

  const forms: DraftContext['forms'] = ask.forms.map((form) => ({
    id: form.id,
    name: form.name,
    url: form.url,
    questions: form.questions,
  }))

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
      .map((message) => ({
        direction: message.direction,
        kind: message.kind,
        from: message.fromName || message.fromEmail,
        subject: message.subject,
        body: message.text.slice(0, 6000),
        date: message.createdAt.slice(0, 10),
      })),
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
      continue
    }
    // Only once the draft is there: the owner hears about it, and is never sent the follow-up itself.
    await tellOwnerOfFollowUp(env, id).catch((error) => console.error(`[asks] follow-up notice for ask ${id} failed:`, error))
  }
}

/** The ask's owner gets a short note that a follow-up is waiting for them to check and send. */
async function tellOwnerOfFollowUp(env: Env, id: number): Promise<void> {
  const ask = await env.DB.prepare('SELECT to_name, to_organization, request, owner_email, sent_at FROM asks WHERE id = ?')
    .bind(id)
    .first<{ to_name: string; to_organization: string; request: string; owner_email: string; sent_at: string | null }>()
  if (!ask) return
  const who = ask.to_organization ? `${ask.to_name} (${ask.to_organization})` : ask.to_name
  const since = ask.sent_at ? ` since ${bostonDay(ask.sent_at)}` : ''
  const body = [
    `${who} hasn't replied to your ask${since}:`,
    `"${ask.request.split('\n')[0].slice(0, 160)}"`,
    '',
    'Claude drafted a follow-up. It goes nowhere until you check it and press Send:',
    `https://${mailDomain(env)}/admin/email/asks/${id}`,
  ].join('\n')
  await sendPersonalEmail(
    env,
    {
      fromName: 'Proto asks',
      to: [ask.owner_email],
      cc: [],
      replyTo: ask.owner_email,
      subject: `Follow-up ready for ${ask.to_name}`,
      text: body,
      html: `<p style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(body)}</p>`,
      attachments: [],
    },
    `follow-up-notice-${id}-${bostonToday()}`,
  )
}
