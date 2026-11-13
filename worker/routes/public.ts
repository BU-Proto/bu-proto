import { Hono, type Context, type MiddlewareHandler } from 'hono'
import {
  RESUME_MAX_BYTES,
  RESUME_TYPE,
  boardInterestInput,
  fundInterestInput,
  joinInput,
  roleApplicationInput,
  rsvpInput,
  type RsvpResult,
} from '../../shared/api'
import { randomToken } from '../lib/crypto'
import { sendApplicationEmails, sendBoardInterest, sendFundConfirmation, sendRsvpConfirmation, sendWelcome } from '../lib/confirmations'
import { PUBLIC_ROWS } from '../lib/content'
import { bostonToday } from '../lib/dates'
import { limitForms } from '../lib/forms'
import { ApiError, bodyFields, idParam, parseInput, readBody } from '../lib/http'
import { requireHuman } from '../lib/turnstile'
import type { AppEnv } from '../types'

// The five forms the public site posts. None needs a session; all are rate limited per IP, then
// need a Turnstile token (lib/turnstile) before anything is read or written. Four send JSON; a
// role application sends a multipart form, for its résumé. The action names
// match the ones the forms render their widgets with.

const app = new Hono<AppEnv>()

const origin = (c: Context<AppEnv>) => new URL(c.req.url).origin

/**
 * Whether the hidden `website` field came back filled. The shared schemas would reject that with
 * a 400, which tells a bot exactly what tripped it, so we check first and pretend it worked.
 * Hono caches the parsed body, so readBody can still read it afterwards.
 */
async function isBot(c: Context<AppEnv>): Promise<boolean> {
  const website = (await bodyFields(c))?.website
  return website !== undefined && website !== null && website !== ''
}

// ---- The résumé on a role application ---------------------------------------------------------

const RESUME_TOO_BIG = `That file is over ${RESUME_MAX_BYTES / 1024 / 1024} MB.`

/** D1 holds at most 2 MB in one value, so a résumé is stored a megabyte at a time. */
const RESUME_PART_BYTES = 1024 * 1024

/** Turns away an upload that's plainly too big before any of it is read. Leaves room for the other fields. */
const withinUploadSize: MiddlewareHandler<AppEnv> = async (c, next) => {
  const length = Number(c.req.header('Content-Length') ?? 0)
  if (length > RESUME_MAX_BYTES + 256 * 1024) {
    // Nothing of it is wanted, so stop taking it in before answering.
    await c.req.raw.body?.cancel().catch(() => {})
    throw new ApiError(413, RESUME_TOO_BIG, { resume: RESUME_TOO_BIG })
  }
  await next()
}

/**
 * The uploaded résumé as a name and its bytes, or what's wrong with it. A PDF by what it says it
 * is and by how it starts, so the portal can open it as one without trusting the upload.
 */
async function readResume(value: unknown): Promise<{ name: string; bytes: ArrayBuffer } | string> {
  if (!(value instanceof File) || value.size === 0) return 'Add your résumé as a PDF.'
  if (value.size > RESUME_MAX_BYTES) return RESUME_TOO_BIG
  const bytes = await value.arrayBuffer()
  const opening = new TextDecoder('latin1').decode(bytes.slice(0, 1024))
  if ((value.type && value.type !== RESUME_TYPE) || !opening.includes('%PDF-')) return 'That isn’t a PDF. Export your résumé as a PDF and try again.'
  // The name is only ever shown and offered back as a download: keep it short and free of anything odd.
  const name = value.name.replace(/[^\p{L}\p{N} .()_-]+/gu, '_').slice(-120) || 'resume.pdf'
  return { name: /\.pdf$/i.test(name) ? name : `${name}.pdf`, bytes }
}

/** A role's questions out of its JSON column; a hand-edited row with bad JSON asks none. */
function parseQuestions(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

app.post('/api/join', limitForms, requireHuman('join'), async (c) => {
  if (await isBot(c)) return c.json({ ok: true }, 201)
  const input = await readBody(c, joinInput)
  const token = randomToken()
  // On conflict the stored token survives, so getting ours back means the row is new.
  const row = await c.env.DB.prepare(
    `INSERT INTO members (name, email, year, track, unsubscribe_token) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (email) DO UPDATE SET
       name = excluded.name, year = excluded.year, track = excluded.track,
       unsubscribed = 0, updated_at = datetime('now')
     RETURNING unsubscribe_token = ? AS inserted`,
  )
    .bind(input.name, input.email, input.year, input.track, token, token)
    .first<{ inserted: number }>()
  // Only a new member gets the welcome; someone updating their details has had it already.
  if (row?.inserted) c.executionCtx.waitUntil(sendWelcome(c.env, origin(c), { ...input, unsubscribeToken: token }))
  return c.json({ ok: true }, row?.inserted ? 201 : 200)
})

app.post('/api/fund-interest', limitForms, requireHuman('fund-interest'), async (c) => {
  if (await isBot(c)) return c.json({ ok: true }, 201)
  const input = await readBody(c, fundInterestInput)
  await c.env.DB.prepare(
    'INSERT INTO fund_interest (name, email, year, target, spend, amount) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(input.name, input.email, input.year, input.target, input.spend, input.amount)
    .run()
  c.executionCtx.waitUntil(sendFundConfirmation(c.env, origin(c), input))
  return c.json({ ok: true }, 201)
})

app.post('/api/board-interest', limitForms, requireHuman('board-interest'), async (c) => {
  if (await isBot(c)) return c.json({ ok: true }, 201)
  const { website: _website, ...input } = await readBody(c, boardInterestInput)
  await c.env.DB.prepare('INSERT INTO board_interest (name, email, year, role, note) VALUES (?, ?, ?, ?, ?)')
    .bind(input.name, input.email, input.year, input.role, input.note)
    .run()
  c.executionCtx.waitUntil(sendBoardInterest(c.env, origin(c), input))
  return c.json({ ok: true }, 201)
})

// An application for one role, sent as a multipart form because it carries the résumé. The role
// has to be on the site and still taking applications, the résumé has to be a PDF, and each of the
// role's own questions needs an answer. One application per email per role: sending it again
// replaces what they sent and leaves our status and notes alone.
app.post('/api/roles/:id/apply', limitForms, withinUploadSize, requireHuman('role-application'), async (c) => {
  const id = idParam(c)
  const role = await c.env.DB.prepare(`SELECT title, apply_by, questions FROM roles WHERE id = ? AND ${PUBLIC_ROWS}`)
    .bind(id)
    .first<{ title: string; apply_by: string; questions: string }>()
  if (!role) throw new ApiError(404, 'That role isn’t open.')
  if (role.apply_by && role.apply_by < bostonToday()) throw new ApiError(400, 'Applications for this role have closed.')
  if (await isBot(c)) return c.json({ ok: true }, 201)

  const fields = (await bodyFields(c)) ?? {}
  const questions = parseQuestions(role.questions)
  const { website: _website, ...input } = parseInput(roleApplicationInput, {
    name: fields.name,
    email: fields.email,
    year: fields.year,
    link: fields.link,
    website: fields.website,
    // A missing answer goes through as '' so the complaint below names its field.
    answers: questions.map((_, index) => (typeof fields[`answers.${index}`] === 'string' ? fields[`answers.${index}`] : '')),
  })
  const issues: Record<string, string> = {}
  const answers = questions.map((question, index) => {
    const answer = input.answers[index] ?? ''
    if (!answer) issues[`answers.${index}`] = 'Required'
    return { question, answer }
  })
  const resume = await readResume(fields.resume)
  if (typeof resume === 'string') issues.resume = resume
  if (typeof resume === 'string' || Object.keys(issues).length > 0) throw new ApiError(400, 'Check the highlighted fields.', issues)

  const existing = await c.env.DB.prepare('SELECT id FROM role_applications WHERE role_id = ? AND email = ?')
    .bind(id, input.email)
    .first<{ id: number }>()
  const saved = await c.env.DB.prepare(
    `INSERT INTO role_applications (role_id, role_title, name, email, year, link, answers, resume_name, resume_size)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (role_id, email) DO UPDATE SET
       role_title = excluded.role_title, name = excluded.name, year = excluded.year, link = excluded.link,
       answers = excluded.answers, resume_name = excluded.resume_name, resume_size = excluded.resume_size,
       updated_at = datetime('now')
     RETURNING id`,
  )
    .bind(id, role.title, input.name, input.email, input.year, input.link, JSON.stringify(answers), resume.name, resume.bytes.byteLength)
    .first<{ id: number }>()
  if (!saved) throw new ApiError(500, 'Could not save that.')
  // The file, in parts (see the migration): the old one out and the new one in, together.
  const parts: D1PreparedStatement[] = []
  for (let offset = 0, part = 0; offset < resume.bytes.byteLength; offset += RESUME_PART_BYTES, part += 1) {
    parts.push(
      c.env.DB.prepare('INSERT INTO role_application_resume_parts (application_id, part, data) VALUES (?, ?, ?)').bind(
        saved.id,
        part,
        resume.bytes.slice(offset, offset + RESUME_PART_BYTES),
      ),
    )
  }
  await c.env.DB.batch([c.env.DB.prepare('DELETE FROM role_application_resume_parts WHERE application_id = ?').bind(saved.id), ...parts])

  // Someone correcting their application has had the confirmation, and the owners their note.
  if (!existing) {
    c.executionCtx.waitUntil(
      sendApplicationEmails(c.env, origin(c), {
        name: input.name,
        email: input.email,
        year: input.year,
        roleTitle: role.title,
        link: input.link,
        answers,
      }),
    )
  }
  return c.json({ ok: true }, existing ? 200 : 201)
})

app.post('/api/events/:id/rsvp', limitForms, requireHuman('rsvp'), async (c) => {
  const id = idParam(c)
  const event = await c.env.DB.prepare(`SELECT title, date, time, place FROM events WHERE id = ? AND ${PUBLIC_ROWS}`)
    .bind(id)
    .first<{ title: string; date: string; time: string; place: string }>()
  if (!event) throw new ApiError(404, 'That event isn’t on the calendar.')
  if (event.date < bostonToday()) throw new ApiError(400, 'That event has already happened.')

  const countRsvps = c.env.DB.prepare('SELECT COUNT(*) AS count FROM rsvps WHERE event_id = ?').bind(id)
  if (await isBot(c)) {
    const row = await countRsvps.first<{ count: number }>()
    return c.json({ ok: true, count: row?.count ?? 0 } satisfies RsvpResult, 201)
  }

  const input = await readBody(c, rsvpInput)
  const [insert, count] = await c.env.DB.batch<{ count: number }>([
    c.env.DB.prepare('INSERT INTO rsvps (event_id, name, email) VALUES (?, ?, ?) ON CONFLICT DO NOTHING').bind(
      id,
      input.name,
      input.email,
    ),
    countRsvps,
  ])
  const result: RsvpResult = { ok: true, count: count.results[0]?.count ?? 0 }
  // A repeat RSVP changes nothing, so it doesn't send a second confirmation either.
  if (insert.meta.changes > 0) c.executionCtx.waitUntil(sendRsvpConfirmation(c.env, origin(c), input, event))
  return c.json(result, insert.meta.changes > 0 ? 201 : 200)
})

export default app
