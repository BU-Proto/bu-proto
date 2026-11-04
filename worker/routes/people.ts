import { Hono } from 'hono'
import {
  FUND_STATUSES,
  TRACKS,
  fundPatch,
  memberPatch,
  type FundInterest,
  type FundStatus,
  type Member,
  type MemberDetail,
  type Stats,
} from '../../shared/api'
import { bostonToday } from '../lib/dates'
import { ApiError, idParam, readBody } from '../lib/http'
import { owners } from '../lib/session'
import type { AppEnv } from '../types'

// Members, fund interest and the dashboard numbers. Everything here sits under /api/admin, so
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

// Deleting a member deletes everything we hold under their email: RSVPs and fund sign-ups too,
// as the privacy policy promises. One batch, so it all goes or none of it does.
app.delete('/api/admin/members/:id', async (c) => {
  const id = idParam(c)
  const member = await c.env.DB.prepare('SELECT email FROM members WHERE id = ?').bind(id).first<{ email: string }>()
  if (!member) throw new ApiError(404, 'No such member.')
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM rsvps WHERE email = ?').bind(member.email),
    c.env.DB.prepare('DELETE FROM fund_interest WHERE email = ?').bind(member.email),
    c.env.DB.prepare('DELETE FROM members WHERE id = ?').bind(id),
  ])
  return c.body(null, 204)
})

// ---- Fund interest ----------------------------------------------------------------------------

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
    admins: emails.size,
    wins: row.wins,
    sampleWins: row.sampleWins,
  }
  return c.json(stats)
})

export default app
