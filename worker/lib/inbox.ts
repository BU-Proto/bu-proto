import { factLabelFor, type AskStatus, type MailAttachment, type MailMessage, type MailReading, type MailThread, type MailThreadDetail, type SentMail } from '../../shared/api'
import { protoContext, rememberStatement, type Author } from './asks'
import { readEmail, standInReply, writeReply, type ReplyContext } from './claude'
import { bostonToday } from './dates'
import { escapeHtml } from './emailTemplate'
import { sha256 } from './crypto'
import { ApiError } from './http'
import { messageIds, normalizeSubject, parseAddress, parseReplyAddress } from './mailAddress'
import { fromAddress, sendPersonalEmail } from './resend'

export { messageIds, normalizeSubject, parseAddress, parseReplyAddress }

// The inbox: every conversation by email. Mail to any address at proto.boston arrives through
// Resend's webhook (routes/inbox.ts) and lands here, on the conversation it belongs to: each
// thread has its own reply address, and an email's In-Reply-To / References or its sender and
// subject are the fallbacks. Asks send through here too, so their replies thread onto them.

/** Receiving is set up: Resend's webhook has its secret, so replies to proto.boston come back here. */
export const inboxOn = (env: Env) => Boolean(env.RESEND_WEBHOOK_SECRET)

/** The domain we send from and receive at (proto.boston). */
export const mailDomain = (env: Env) => fromAddress(String(env.EMAIL_FROM)).split('@')[1]?.toLowerCase() ?? ''

/** Where replies to a thread go: reply-<id>-<token>@proto.boston. */
export const replyAddress = (env: Env, thread: { id: number; token: string }) => `reply-${thread.id}-${thread.token}@${mailDomain(env)}`

function json<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const randomToken = () => [...crypto.getRandomValues(new Uint8Array(6))].map((byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 10)

// ---- Rows ---------------------------------------------------------------------------------------

interface ThreadRow {
  id: number
  subject: string
  token: string
  contact_id: number | null
  ask_id: number | null
  status: MailThread['status']
  unread: number
  draft_body: string
  draft_notes: string
  draft_questions: string
  drafted_at: string | null
  last_message_at: string
}

interface MessageRow {
  id: number
  thread_id: number
  direction: MailMessage['direction']
  kind: MailMessage['kind']
  message_id: string | null
  in_reply_to: string | null
  refs: string
  from_name: string
  from_email: string
  to_addrs: string
  cc_addrs: string
  subject: string
  text: string
  html: string
  attachments: string
  status: MailMessage['status']
  sent_by: string
  reading: string | null
  created_at: string
}

function toMessage(row: MessageRow): MailMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    direction: row.direction,
    kind: row.kind,
    fromName: row.from_name,
    fromEmail: row.from_email,
    to: json<string[]>(row.to_addrs, []),
    cc: json<string[]>(row.cc_addrs, []),
    subject: row.subject,
    text: row.text,
    html: row.html,
    attachments: json<MailAttachment[]>(row.attachments, []),
    status: row.status,
    sentBy: row.sent_by,
    reading: json<MailReading | null>(row.reading, null),
    createdAt: row.created_at,
  }
}

/** Who a thread is with: the latest sender who isn't us, else whoever we first wrote to. */
function counterpart(messages: MailMessage[], contactName: string | null): { name: string; email: string } {
  const lastIn = [...messages].reverse().find((message) => message.direction === 'in')
  if (lastIn) return { name: lastIn.fromName || contactName || '', email: lastIn.fromEmail }
  const firstOut = messages.find((message) => message.direction === 'out')
  return { name: contactName ?? '', email: firstOut?.to[0] ?? '' }
}

function toThread(row: ThreadRow, messages: MailMessage[], contactName: string | null): MailThread {
  const latest = messages.at(-1)
  const other = counterpart(messages, contactName)
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    unread: row.unread,
    contactId: row.contact_id,
    askId: row.ask_id,
    withName: other.name,
    withEmail: other.email,
    messageCount: messages.length,
    latest: latest
      ? { direction: latest.direction, snippet: latest.text.replace(/\s+/g, ' ').trim().slice(0, 180), at: latest.createdAt, reading: latest.reading }
      : null,
    hasDraft: row.draft_body.trim() !== '',
    lastMessageAt: row.last_message_at,
  }
}

export async function threadMessages(db: D1Database, threadId: number): Promise<MailMessage[]> {
  const { results } = await db.prepare('SELECT * FROM mail_messages WHERE thread_id = ? ORDER BY created_at, id').bind(threadId).all<MessageRow>()
  return results.map(toMessage)
}

/** The conversations, latest first. `status` 'all' is every one; the list caps at 300. */
export async function listThreads(db: D1Database, status: MailThread['status'] | 'all'): Promise<MailThread[]> {
  const where = status === 'all' ? '' : 'WHERE t.status = ?'
  const query = db.prepare(
    `SELECT t.*, c.name AS contact_name FROM mail_threads t LEFT JOIN contacts c ON c.id = t.contact_id ${where}
     ORDER BY t.last_message_at DESC, t.id DESC LIMIT 300`,
  )
  const threads = (await (status === 'all' ? query : query.bind(status)).all<ThreadRow & { contact_name: string | null }>()).results
  if (threads.length === 0) return []
  // The messages' light columns, for who each thread is with and the latest line. No bodies beyond a snippet.
  const ids = threads.map((thread) => thread.id)
  const { results } = await db
    .prepare(
      `SELECT id, thread_id, direction, kind, message_id, in_reply_to, refs, from_name, from_email, to_addrs, cc_addrs, subject,
              substr(text, 1, 400) AS text, '' AS html, attachments, status, sent_by, reading, created_at
       FROM mail_messages WHERE thread_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at, id`,
    )
    .bind(...ids)
    .all<MessageRow>()
  const byThread = new Map<number, MailMessage[]>()
  for (const row of results) {
    const list = byThread.get(row.thread_id) ?? []
    list.push(toMessage(row))
    byThread.set(row.thread_id, list)
  }
  return threads.map((thread) => toThread(thread, byThread.get(thread.id) ?? [], thread.contact_name))
}

export async function loadThread(env: Env, id: number): Promise<MailThreadDetail> {
  const db = env.DB
  const row = await db
    .prepare('SELECT t.*, c.name AS contact_name FROM mail_threads t LEFT JOIN contacts c ON c.id = t.contact_id WHERE t.id = ?')
    .bind(id)
    .first<ThreadRow & { contact_name: string | null }>()
  if (!row) throw new ApiError(404, 'That conversation no longer exists.')
  const messages = await threadMessages(db, id)
  const ask = row.ask_id
    ? await db.prepare('SELECT id, request, status FROM asks WHERE id = ?').bind(row.ask_id).first<{ id: number; request: string; status: AskStatus }>()
    : null
  // A reply goes to whoever wrote last, and the others on that email (never our own addresses).
  const ours = (email: string) => email.toLowerCase().endsWith(`@${mailDomain(env)}`)
  const lastIn = [...messages].reverse().find((message) => message.direction === 'in')
  const firstOut = messages.find((message) => message.direction === 'out')
  let replyTo: string[] = []
  let replyCc: string[] = []
  if (lastIn) {
    replyTo = [lastIn.fromEmail]
    replyCc = [...lastIn.to, ...lastIn.cc].map((address) => parseAddress(address).email).filter((email) => email && !ours(email) && email !== lastIn.fromEmail)
  } else if (firstOut) {
    replyTo = firstOut.to
    replyCc = firstOut.cc
  }
  return {
    ...toThread(row, messages, row.contact_name),
    messages,
    draftBody: row.draft_body,
    draftNotes: row.draft_notes,
    draftQuestions: json<string[]>(row.draft_questions, []),
    draftedAt: row.drafted_at,
    replyTo: [...new Set(replyTo)],
    replyCc: [...new Set(replyCc)],
    ask: ask ? { id: ask.id, request: ask.request, status: ask.status } : null,
  }
}

/** Every one-to-one email sent from the portal, newest first, for the Email page's history. */
export async function sentMail(db: D1Database): Promise<SentMail[]> {
  const { results } = await db
    .prepare(
      `SELECT m.*, t.ask_id, a.to_name AS ask_to_name FROM mail_messages m JOIN mail_threads t ON t.id = m.thread_id
       LEFT JOIN asks a ON a.id = t.ask_id WHERE m.direction = 'out' ORDER BY m.created_at DESC, m.id DESC LIMIT 200`,
    )
    .all<MessageRow & { ask_id: number | null; ask_to_name: string | null }>()
  return results.map((row) => {
    const message = toMessage(row)
    return { ...message, askId: row.ask_id, withName: row.ask_to_name ?? message.to[0] ?? '' }
  })
}

// ---- Sending --------------------------------------------------------------------------------------

export async function createThread(db: D1Database, input: { subject: string; contactId: number | null; askId: number | null }): Promise<number> {
  const row = await db
    .prepare(`INSERT INTO mail_threads (subject, token, contact_id, ask_id, status) VALUES (?, ?, ?, ?, 'waiting') RETURNING id`)
    .bind(input.subject.slice(0, 200), randomToken(), input.contactId, input.askId)
    .first<{ id: number }>()
  if (!row) throw new ApiError(500, 'Could not start the conversation.')
  return row.id
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

export interface OutgoingMail {
  threadId: number
  kind: 'ask' | 'follow-up' | 'reply'
  /** Whose email it is: their first name on the From line, their full name in the signature. */
  from: Author
  /** Who pressed Send. */
  sentBy: string
  /** What this send is for ("ask-12", "thread-7"): the same email sent twice for the same thing goes once. */
  scope: string
  to: string[]
  cc: string[]
  subject: string
  body: string
  /** Where replies go when the inbox isn't set up: a teammate's own address. */
  replyToFallback: string
  /** The site's address, for the signature. */
  origin: string
}

/** How long a Send holds its thread before someone else may try: longer than any send takes. */
const SENDING_HOLD = "datetime('now', '-2 minutes')"

/**
 * Sends one email in a thread and records it. From "<first name> from Proto" at EMAIL_FROM's
 * address, signed with the full name; replies come back to the thread's own address once the
 * inbox is set up, and to a teammate until then. It answers the thread's latest email
 * (In-Reply-To / References), so mail apps keep the conversation together.
 *
 * It never sends the same email twice. The thread is held while it sends, so a second press (or a
 * second teammate) gets a 409 instead of a second email. And the Message-ID, the stored row and
 * Resend's Idempotency-Key all come from the email's own content, so pressing Send again after an
 * error the database caused (Resend had already accepted it) reuses the same key, and Resend
 * answers without sending again.
 */
export async function sendInThread(env: Env, mail: OutgoingMail): Promise<'sent' | 'failed' | 'logged'> {
  const db = env.DB
  const thread = await db.prepare('SELECT id, token FROM mail_threads WHERE id = ?').bind(mail.threadId).first<{ id: number; token: string }>()
  if (!thread) throw new ApiError(404, 'That conversation no longer exists.')
  const held = await db
    .prepare(`UPDATE mail_threads SET sending_at = datetime('now') WHERE id = ? AND (sending_at IS NULL OR sending_at < ${SENDING_HOLD})`)
    .bind(thread.id)
    .run()
  if (!held.meta.changes) throw new ApiError(409, 'This email is being sent right now. Give it a moment, then look again.')

  try {
    const earlier = await db
      .prepare(`SELECT message_id, refs FROM mail_messages WHERE thread_id = ? AND message_id IS NOT NULL AND status != 'failed' ORDER BY created_at DESC, id DESC LIMIT 1`)
      .bind(thread.id)
      .first<{ message_id: string; refs: string }>()
    const references = earlier ? [...messageIds(earlier.refs), earlier.message_id].slice(-20) : []
    const fingerprint = (await sha256(JSON.stringify([mail.scope, mail.kind, mail.to, mail.cc, mail.subject, mail.body, earlier?.message_id ?? '']))).slice(0, 32)
    const messageId = `<proto.${thread.id}.${fingerprint.slice(0, 20)}@${mailDomain(env)}>`
    const fullName = mail.from.name.trim() || mail.from.email.split('@')[0]
    const fromName = `${fullName.split(/\s+/)[0]} from Proto`
    const fromEmail = fromAddress(String(env.EMAIL_FROM))

    // An earlier try at this same email (its Send failed, or the database did after it) is reused.
    const again = await db.prepare('SELECT id FROM mail_messages WHERE thread_id = ? AND message_id = ?').bind(thread.id, messageId).first<{ id: number }>()
    const rowId =
      again?.id ??
      (
        await db
          .prepare(
            `INSERT INTO mail_messages (thread_id, direction, kind, message_id, in_reply_to, refs, from_name, from_email, to_addrs, cc_addrs, subject, text, status, sent_by)
             VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'failed', ?) RETURNING id`,
          )
          .bind(
            thread.id,
            mail.kind,
            messageId,
            earlier?.message_id ?? null,
            references.join(' '),
            fromName,
            fromEmail,
            JSON.stringify(mail.to),
            JSON.stringify(mail.cc),
            mail.subject,
            mail.body,
            mail.sentBy,
          )
          .first<{ id: number }>()
      )?.id
    if (!rowId) throw new ApiError(500, 'Could not save the email.')

    const { text, html } = personalEmail(mail.body, [fullName, 'Proto · Boston University', mail.origin.replace(/^https?:\/\//, '')])
    const status = await sendPersonalEmail(
      env,
      {
        fromName,
        to: mail.to,
        cc: mail.cc,
        replyTo: inboxOn(env) ? replyAddress(env, thread) : mail.replyToFallback,
        subject: mail.subject,
        text,
        html,
        attachments: [],
        headers: {
          'Message-ID': messageId,
          ...(earlier && { 'In-Reply-To': earlier.message_id, References: references.join(' ') }),
        },
      },
      `mail-${fingerprint}`,
    )
    await db.batch([
      db.prepare(`UPDATE mail_messages SET status = ?, sent_by = ?, created_at = datetime('now') WHERE id = ?`).bind(status, mail.sentBy, rowId),
      ...(status === 'failed'
        ? []
        : [
            db
              .prepare(
                `UPDATE mail_threads SET status = 'waiting', unread = 0, draft_body = '', draft_notes = '', draft_questions = '[]',
                   last_message_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
              )
              .bind(thread.id),
          ]),
    ])
    return status
  } finally {
    await db.prepare('UPDATE mail_threads SET sending_at = NULL WHERE id = ?').bind(thread.id).run()
  }
}

// ---- Receiving ------------------------------------------------------------------------------------

/** An email that arrived, as the webhook (or the local stand-in) hands it over. */
export interface IncomingMail {
  resendId: string | null
  fromName: string
  fromEmail: string
  to: string[]
  cc: string[]
  /** Every address it was delivered for, to find a thread's reply address. */
  recipients: string[]
  subject: string
  text: string
  html: string
  messageId: string | null
  inReplyTo: string | null
  references: string[]
  attachments: MailAttachment[]
  authentication: unknown
}

/** D1 holds at most 2 MB in a value; an email's HTML can be bigger. Cut long ones (the text is kept whole up to the same). */
const MAX_BODY = 900_000

/**
 * Store an email on the conversation it belongs to, or a new one. Null when it's already stored
 * (Resend sends a webhook again if we were slow to answer).
 */
export async function receive(env: Env, mail: IncomingMail): Promise<{ threadId: number; messageId: number; askId: number | null } | null> {
  const db = env.DB
  if (mail.resendId && (await db.prepare('SELECT 1 FROM mail_messages WHERE resend_id = ?').bind(mail.resendId).first())) return null

  let threadId: number | null = null
  // 1. Sent to one of our reply addresses, with its token.
  for (const address of mail.recipients) {
    const parsed = parseReplyAddress(parseAddress(address).email)
    if (!parsed) continue
    const thread = await db.prepare('SELECT id FROM mail_threads WHERE id = ? AND token = ?').bind(parsed.id, parsed.token).first<{ id: number }>()
    if (thread) {
      threadId = thread.id
      break
    }
  }
  // 2. Answers an email we have (its In-Reply-To or References).
  const ids = [...new Set([...(mail.inReplyTo ? messageIds(mail.inReplyTo) : []), ...mail.references])].slice(-20)
  if (!threadId && ids.length) {
    const found = await db
      .prepare(`SELECT thread_id FROM mail_messages WHERE message_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at DESC LIMIT 1`)
      .bind(...ids)
      .first<{ thread_id: number }>()
    threadId = found?.thread_id ?? null
  }
  // 3. Same person, same subject, in the last 90 days.
  if (!threadId) {
    const subject = normalizeSubject(mail.subject)
    const { results } = await db
      .prepare(
        `SELECT DISTINCT t.id, t.subject FROM mail_threads t JOIN mail_messages m ON m.thread_id = t.id
         WHERE (m.from_email = ?1 OR m.to_addrs LIKE ?2) AND t.last_message_at >= datetime('now', '-90 days')
         ORDER BY t.last_message_at DESC LIMIT 20`,
      )
      .bind(mail.fromEmail, `%${mail.fromEmail.replace(/[%_]/g, '')}%`)
      .all<{ id: number; subject: string }>()
    threadId = (subject && results.find((thread) => normalizeSubject(thread.subject) === subject)?.id) || null
  }
  // 4. Something new.
  if (!threadId) {
    const contact = await db.prepare('SELECT id FROM contacts WHERE email = ?').bind(mail.fromEmail).first<{ id: number }>()
    threadId = await createThread(db, { subject: mail.subject || '(no subject)', contactId: contact?.id ?? null, askId: null })
  }

  const row = await db
    .prepare(
      `INSERT INTO mail_messages (thread_id, direction, kind, resend_id, message_id, in_reply_to, refs, from_name, from_email, to_addrs, cc_addrs,
         subject, text, html, attachments, status, authentication)
       VALUES (?, 'in', 'message', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?) RETURNING id`,
    )
    .bind(
      threadId,
      mail.resendId,
      mail.messageId,
      mail.inReplyTo,
      mail.references.join(' '),
      mail.fromName.slice(0, 200),
      mail.fromEmail,
      JSON.stringify(mail.to),
      JSON.stringify(mail.cc),
      mail.subject.slice(0, 500),
      mail.text.slice(0, MAX_BODY),
      mail.html.length > MAX_BODY ? '' : mail.html,
      JSON.stringify(mail.attachments),
      mail.authentication ? JSON.stringify(mail.authentication) : null,
    )
    .first<{ id: number }>()
  if (!row) throw new Error('Could not store the email.')
  const thread = await db
    .prepare(
      `UPDATE mail_threads SET status = 'open', unread = unread + 1, last_message_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ? RETURNING ask_id`,
    )
    .bind(threadId)
    .first<{ ask_id: number | null }>()
  // A reply to an ask: no follow-up needed any more.
  if (thread?.ask_id) {
    await db.prepare(`UPDATE asks SET follow_up_due = NULL, updated_at = datetime('now') WHERE id = ?`).bind(thread.ask_id).run()
  }
  return { threadId, messageId: row.id, askId: thread?.ask_id ?? null }
}

/**
 * After an email is stored: Claude reads it (what it says, whether it needs a reply, whether it
 * answers the ask), spam is filed as done, and the teammate who made the ask hears about a reply.
 * Runs after the webhook has answered, so a slow API call never makes Resend retry.
 */
export async function afterReceive(env: Env, origin: string, stored: { threadId: number; messageId: number; askId: number | null }): Promise<void> {
  const db = env.DB
  let reading: MailReading | null = null
  if (env.ANTHROPIC_API_KEY) {
    try {
      const messages = await threadMessages(db, stored.threadId)
      const email = messages.find((message) => message.id === stored.messageId)
      const ask = stored.askId
        ? await db.prepare('SELECT request, answers FROM asks WHERE id = ?').bind(stored.askId).first<{ request: string; answers: string }>()
        : null
      if (email) {
        reading = await readEmail(env, {
          email,
          earlier: messages.filter((message) => message.id !== stored.messageId).slice(-6),
          ask: ask ? { request: ask.request, answers: json(ask.answers, []) } : null,
        })
        await db.prepare('UPDATE mail_messages SET reading = ? WHERE id = ?').bind(JSON.stringify(reading), stored.messageId).run()
        if (reading.category === 'spam' && messages.length === 1) {
          await db.prepare(`UPDATE mail_threads SET status = 'done', unread = 0 WHERE id = ?`).bind(stored.threadId).run()
        }
      }
    } catch (error) {
      console.error(`[inbox] reading message ${stored.messageId} failed:`, error)
    }
  }
  if (stored.askId) await tellAsker(env, origin, stored, reading).catch((error) => console.error('[inbox] notice failed:', error))
}

/** The teammate who made the ask gets a short note that a reply came in, with Claude's take. */
async function tellAsker(env: Env, origin: string, stored: { threadId: number; askId: number | null }, reading: MailReading | null) {
  const ask = await env.DB.prepare('SELECT to_name, owner_email, owner_name, request FROM asks WHERE id = ?')
    .bind(stored.askId)
    .first<{ to_name: string; owner_email: string; owner_name: string; request: string }>()
  if (!ask) return
  const verdict =
    reading?.answersAsk === 'yes'
      ? 'It looks like they gave us what we asked for.'
      : reading?.answersAsk === 'partly'
        ? 'They answered part of it.'
        : reading?.answersAsk === 'no'
          ? "They didn't give us what we asked for yet."
          : ''
  const link = `${origin}/admin/email/inbox/${stored.threadId}`
  const lines = [
    `${ask.to_name} replied to your ask: "${ask.request.split('\n')[0].slice(0, 140)}"`,
    reading ? `\n${reading.summary}${verdict ? ` ${verdict}` : ''}` : '',
    reading?.stillNeeded.length ? `\nStill open:\n${reading.stillNeeded.map((line) => `- ${line}`).join('\n')}` : '',
    `\nRead it and reply: ${link}`,
  ]
  const body = lines.filter(Boolean).join('\n')
  await sendPersonalEmail(
    env,
    {
      fromName: 'Proto inbox',
      to: [ask.owner_email],
      cc: [],
      replyTo: ask.owner_email,
      subject: `${ask.to_name} replied`,
      text: body,
      html: `<p style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(body)}</p>`,
      attachments: [],
    },
    `ask-reply-notice-${stored.threadId}-${Date.now()}`,
  )
}

// ---- Writing a reply ----------------------------------------------------------------------------

/**
 * Claude writes the reply to a thread's latest email. Answers to its earlier questions are kept
 * (those about Proto itself as facts). The draft is saved on the thread for any teammate.
 */
export async function draftReply(
  env: Env,
  threadId: number,
  input: { notes: string; answers: { question: string; answer: string; remember: boolean; factLabel?: string }[] },
  by: Author,
): Promise<{ notice?: string }> {
  const db = env.DB
  const thread = await loadThread(env, threadId)
  const today = bostonToday()
  const remembers = input.answers
    .filter((answer) => answer.remember)
    .map((answer) => rememberStatement(db, answer.factLabel?.trim() || factLabelFor(answer.question), answer.answer, `${by.name || by.email}, ${today}, answering a reply`, by.email))
  if (remembers.length) await db.batch(remembers)

  const [proto, contact, ask] = await Promise.all([
    protoContext(db, today),
    thread.contactId ? db.prepare('SELECT name, organization, notes FROM contacts WHERE id = ?').bind(thread.contactId).first<{ name: string; organization: string; notes: string }>() : null,
    thread.askId ? db.prepare('SELECT request, answers FROM asks WHERE id = ?').bind(thread.askId).first<{ request: string; answers: string }>() : null,
  ])
  const context: ReplyContext = {
    today,
    teammate: { name: by.name, email: by.email },
    withName: thread.withName,
    contactNotes: contact?.notes ?? '',
    messages: thread.messages.slice(-12),
    ask: ask ? { request: ask.request, answers: json(ask.answers, []) } : null,
    answers: input.answers,
    notes: input.notes,
    previous: thread.draftBody || null,
    ...proto,
  }

  let notice: string | undefined
  let draft
  if (env.ANTHROPIC_API_KEY) {
    const written = await writeReply(env, context)
    draft = written.draft
    if (written.problems.length) notice = `Check the wording before you send: ${written.problems.join('; ')}.`
  } else if (import.meta.env.DEV) {
    draft = standInReply(context)
    notice = 'Claude isn’t set up on this server (no ANTHROPIC_API_KEY), so this is a stand-in.'
  } else {
    throw new ApiError(502, 'Claude isn’t set up yet. An owner adds the ANTHROPIC_API_KEY secret (see the README).')
  }
  await db
    .prepare(
      `UPDATE mail_threads SET draft_body = ?, draft_notes = ?, draft_questions = ?, drafted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(draft.body.trim(), input.notes, JSON.stringify(draft.questions.slice(0, 10)), threadId)
    .run()
  return { notice }
}

