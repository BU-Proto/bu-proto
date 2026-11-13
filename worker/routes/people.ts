import { Hono } from 'hono'
import {
  FUND_STATUSES,
  TRACKS,
  applicationPatch,
  fundPatch,
  memberPatch,
  type ApplicationStatus,
  type BoardInterest,
  type FundInterest,
  type FundStatus,
  type Member,
  type MemberDetail,
  type RoleApplication,
  type Stats,
} from '../../shared/api'
import { bostonToday } from '../lib/dates'
import { ApiError, idParam, readBody } from '../lib/http'
import { owners } from '../lib/session'
import type { AppEnv } from '../types'

// Members, fund interest, board interest, role applications and the dashboard numbers. Everything here sits under /api/admin, so
// requireAdmin has already run.

const app = new Hono<AppEnv>()

interface MemberRow {
  id: number
  name: string
  email: string
  year: string
  track: string
  notes: string
  unsubscribed: number
  created_at: string
  updated_at: string
}

interface FundRow {
  id: number
  name: string
  email: string
  year: string
  target: string
  spend: string
  amount: string
  status: FundStatus
  notes: string
  created_at: string
  updated_at: string
}

interface RsvpRow {
  id: number
  event_id: number
  name: string
  email: string
  created_at: string
  event_title: string
  event_date: string
}

// Listed explicitly so unsubscribe_token never leaves the database.
const MEMBER_COLUMNS = 'id, name, email, year, track, notes, unsubscribed, created_at, updated_at'
const FUND_COLUMNS = 'id, name, email, year, target, spend, amount, status, notes, created_at, updated_at'

const toMember = (row: MemberRow): Member => ({
  id: row.id,
  name: row.name,
  email: row.email,
  year: row.year,
  track: row.track,
  notes: row.notes,
  unsubscribed: row.unsubscribed === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toFund = (row: FundRow): FundInterest => ({
  id: row.id,
  name: row.name,
  email: row.email,
  year: row.year,
  target: row.target,
  spend: row.spend,
  amount: row.amount,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

/** SET clause and values for a partial patch whose keys are column names. Empty patch → 400. */
function setClause(patch: Record<string, string | boolean | undefined>): { sql: string; values: (string | number)[] } {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined) as [string, string | boolean][]
  if (entries.length === 0) throw new ApiError(400, 'Nothing to change.')
  return {
    sql: [...entries.map(([key]) => `${key} = ?`), "updated_at = datetime('now')"].join(', '),
    values: entries.map(([, value]) => (typeof value === 'boolean' ? Number(value) : value)),
  }
}

const isTrack = (value: string | undefined): value is (typeof TRACKS)[number] =>
  (TRACKS as readonly string[]).includes(value ?? '')

// ---- Members ----------------------------------------------------------------------------------

app.get('/api/admin/members', async (c) => {
  const q = c.req.query('q')?.trim()
  const track = c.req.query('track')
  const where: string[] = []
  const values: string[] = []
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`
    where.push("(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')")
    values.push(pattern, pattern)
  }
  if (isTrack(track)) {
    where.push('track = ?')
    values.push(track)
  }
  const { results } = await c.env.DB.prepare(
    `SELECT ${MEMBER_COLUMNS} FROM members ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC, id DESC`,
  )
    .bind(...values)
    .all<MemberRow>()
  return c.json({ items: results.map(toMember) })
})

app.get('/api/admin/members/:id', async (c) => {
  const id = idParam(c)
  const row = await c.env.DB.prepare(`SELECT ${MEMBER_COLUMNS} FROM members WHERE id = ?`).bind(id).first<MemberRow>()
  if (!row) throw new ApiError(404, 'No such member.')
  const [rsvps, fund] = await c.env.DB.batch<RsvpRow | FundRow>([
    c.env.DB.prepare(
      `SELECT r.id, r.event_id, r.name, r.email, r.created_at, e.title AS event_title, e.date AS event_date
       FROM rsvps r JOIN events e ON e.id = r.event_id
       WHERE r.email = ? ORDER BY e.date DESC, r.id DESC`,
    ).bind(row.email),
    c.env.DB.prepare(`SELECT ${FUND_COLUMNS} FROM fund_interest WHERE email = ? ORDER BY created_at DESC, id DESC`).bind(
      row.email,
    ),
  ])
  const detail: MemberDetail = {
    member: toMember(row),
    rsvps: (rsvps.results as RsvpRow[]).map((rsvp) => ({
      id: rsvp.id,
      eventId: rsvp.event_id,
      name: rsvp.name,
      email: rsvp.email,
      createdAt: rsvp.created_at,
      eventTitle: rsvp.event_title,
      eventDate: rsvp.event_date,
    })),
    fundInterest: (fund.results as FundRow[]).map(toFund),
  }
  return c.json(detail)
})

app.patch('/api/admin/members/:id', async (c) => {
  const id = idParam(c)
  const { sql, values } = setClause(await readBody(c, memberPatch))
  const row = await c.env.DB.prepare(`UPDATE members SET ${sql} WHERE id = ? RETURNING ${MEMBER_COLUMNS}`)
    .bind(...values, id)
    .first<MemberRow>()
  if (!row) throw new ApiError(404, 'No such member.')
  return c.json({ item: toMember(row) })
})

// Deleting a member deletes everything we hold under their email: RSVPs, fund sign-ups and role
// applications too, as the privacy policy promises. One batch, so it all goes or none of it does.
app.delete('/api/admin/members/:id', async (c) => {
  const id = idParam(c)
  const member = await c.env.DB.prepare('SELECT email FROM members WHERE id = ?').bind(id).first<{ email: string }>()
  if (!member) throw new ApiError(404, 'No such member.')
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM rsvps WHERE email = ?').bind(member.email),
    c.env.DB.prepare('DELETE FROM fund_interest WHERE email = ?').bind(member.email),
    c.env.DB.prepare('DELETE FROM role_applications WHERE email = ?').bind(member.email),
    c.env.DB.prepare('DELETE FROM members WHERE id = ?').bind(id),
  ])
  return c.body(null, 204)
})

// ---- Fund interest ----------------------------------------------------------------------------

// ---- Board interest: who put their hand up for a seat ---------------------------------------------

app.get('/api/admin/board-interest', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, email, year, role, note, created_at FROM board_interest ORDER BY created_at DESC, id DESC',
  ).all<{ id: number; name: string; email: string; year: string; role: string; note: string; created_at: string }>()
  const items: BoardInterest[] = results.map(({ created_at, ...row }) => ({ ...row, createdAt: created_at }))
  return c.json({ items })
})

app.delete('/api/admin/board-interest/:id', async (c) => {
  const { meta } = await c.env.DB.prepare('DELETE FROM board_interest WHERE id = ?').bind(idParam(c)).run()
  if (meta.changes === 0) throw new ApiError(404, 'No such entry.')
  return c.body(null, 204)
})

app.get('/api/admin/fund', async (c) => {
  const status = c.req.query('status')
  const filter = (FUND_STATUSES as readonly string[]).includes(status ?? '')
  const statement = c.env.DB.prepare(
    `SELECT ${FUND_COLUMNS} FROM fund_interest ${filter ? 'WHERE status = ?' : ''} ORDER BY created_at DESC, id DESC`,
  )
  const { results } = await (filter ? statement.bind(status) : statement).all<FundRow>()
  return c.json({ items: results.map(toFund) })
})

app.patch('/api/admin/fund/:id', async (c) => {
  const id = idParam(c)
  const { sql, values } = setClause(await readBody(c, fundPatch))
  const row = await c.env.DB.prepare(`UPDATE fund_interest SET ${sql} WHERE id = ? RETURNING ${FUND_COLUMNS}`)
    .bind(...values, id)
    .first<FundRow>()
  if (!row) throw new ApiError(404, 'No such sign-up.')
  return c.json({ item: toFund(row) })
})

app.delete('/api/admin/fund/:id', async (c) => {
  const id = idParam(c)
  const { meta } = await c.env.DB.prepare('DELETE FROM fund_interest WHERE id = ?').bind(id).run()
  if (meta.changes === 0) throw new ApiError(404, 'No such sign-up.')
  return c.body(null, 204)
})

// ---- Role applications: who applied for which role, and where each one stands ---------------------

interface ApplicationRow {
  id: number
  role_id: number | null
  role_title: string
  name: string
  email: string
  year: string
  link: string
  resume_name: string
  resume_size: number
  answers: string
  status: ApplicationStatus
  notes: string
  created_at: string
  updated_at: string
}

const APPLICATION_COLUMNS =
  'id, role_id, role_title, name, email, year, link, resume_name, resume_size, answers, status, notes, created_at, updated_at'

function parseAnswers(value: string): RoleApplication['answers'] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item: unknown) => {
      if (typeof item !== 'object' || item === null) return []
      const { question, answer } = item as { question?: unknown; answer?: unknown }
      return typeof question === 'string' && typeof answer === 'string' ? [{ question, answer }] : []
    })
  } catch {
    return []
  }
}

const toApplication = (row: ApplicationRow): RoleApplication => ({
  id: row.id,
  roleId: row.role_id,
  roleTitle: row.role_title,
  name: row.name,
  email: row.email,
  year: row.year,
  link: row.link,
  resume: row.resume_size > 0 ? { name: row.resume_name, size: row.resume_size } : null,
  answers: parseAnswers(row.answers),
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

app.get('/api/admin/applications', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${APPLICATION_COLUMNS} FROM role_applications ORDER BY created_at DESC, id DESC`,
  ).all<ApplicationRow>()
  return c.json({ items: results.map(toApplication) })
})

app.patch('/api/admin/applications/:id', async (c) => {
  const id = idParam(c)
  const { sql, values } = setClause(await readBody(c, applicationPatch))
  const row = await c.env.DB.prepare(`UPDATE role_applications SET ${sql} WHERE id = ? RETURNING ${APPLICATION_COLUMNS}`)
    .bind(...values, id)
    .first<ApplicationRow>()
  if (!row) throw new ApiError(404, 'No such application.')
  return c.json({ item: toApplication(row) })
})

// The résumé itself, put back together from its parts. Only ever a PDF (checked on the way in),
// and served as nothing else, so the browser opens it in its PDF viewer.
app.get('/api/admin/applications/:id/resume', async (c) => {
  const id = idParam(c)
  const [application, parts] = await c.env.DB.batch<{ resume_name: string } | { data: ArrayBuffer | number[] }>([
    c.env.DB.prepare('SELECT resume_name FROM role_applications WHERE id = ?').bind(id),
    c.env.DB.prepare('SELECT data FROM role_application_resume_parts WHERE application_id = ? ORDER BY part').bind(id),
  ])
  const row = application.results[0] as { resume_name: string } | undefined
  if (!row || parts.results.length === 0) throw new ApiError(404, 'No résumé on this application.')
  // D1 hands a BLOB back as an array of bytes; the local one as a buffer. Either becomes bytes.
  const chunks = (parts.results as { data: ArrayBuffer | number[] }[]).map(({ data }) =>
    data instanceof ArrayBuffer ? new Uint8Array(data) : Uint8Array.from(data),
  )
  // A header can only carry Latin-1, and names come in every script: a plain fallback, then the
  // real name encoded the way browsers read it (RFC 5987).
  const plainName = row.resume_name.replace(/[^\x20-\x7e]|["\\]/g, '_')
  return new Response(new Blob(chunks, { type: 'application/pdf' }), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${plainName}"; filename*=UTF-8''${encodeURIComponent(row.resume_name)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})

app.delete('/api/admin/applications/:id', async (c) => {
  const { meta } = await c.env.DB.prepare('DELETE FROM role_applications WHERE id = ?').bind(idParam(c)).run()
  if (meta.changes === 0) throw new ApiError(404, 'No such application.')
  return c.body(null, 204)
})

// ---- Dashboard --------------------------------------------------------------------------------

app.get('/api/admin/stats', async (c) => {
  const today = bostonToday()
  const db = c.env.DB
  const [counts, adminRows] = await db.batch<Record<string, number> | { email: string }>([
    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM members) AS members,
           (SELECT COUNT(*) FROM members WHERE created_at >= datetime('now', '-7 days')) AS membersThisWeek,
           (SELECT COUNT(*) FROM events WHERE published = 1 AND date >= ?1) AS upcomingEvents,
           (SELECT COUNT(*) FROM rsvps r JOIN events e ON e.id = r.event_id
              WHERE e.published = 1 AND e.date >= ?1) AS upcomingRsvps,
           (SELECT COUNT(*) FROM fund_interest WHERE status = 'new') AS fundNew,
           (SELECT COUNT(*) FROM fund_interest) AS fundTotal,
           (SELECT COUNT(*) FROM role_applications WHERE status = 'new') AS applicationsNew,
           (SELECT COUNT(*) FROM role_applications) AS applicationsTotal,
           (SELECT COUNT(*) FROM wins WHERE published = 1 AND placeholder = 0) AS wins,
           (SELECT COUNT(*) FROM wins WHERE published = 1 AND placeholder = 1) AS sampleWins`,
      )
      .bind(today),
    db.prepare('SELECT email FROM admins'),
  ])
  // Owners may also have a row in admins; emails are case-insensitive.
  const emails = owners(c.env)
  for (const { email } of adminRows.results as { email: string }[]) emails.add(email.toLowerCase())
  const row = counts.results[0] as Record<string, number>
  const stats: Stats = {
    members: row.members,
    membersThisWeek: row.membersThisWeek,
    upcomingEvents: row.upcomingEvents,
    upcomingRsvps: row.upcomingRsvps,
    fundNew: row.fundNew,
    fundTotal: row.fundTotal,
    applicationsNew: row.applicationsNew,
    applicationsTotal: row.applicationsTotal,
    admins: emails.size,
    wins: row.wins,
    sampleWins: row.sampleWins,
  }
  return c.json(stats)
})

export default app
