import { Hono, type Context } from 'hono'
import { parseAreas, type AdminLevel, type Area } from '../../shared/access'
import { addAdminInput, updateAdminInput, type Admin, type InviteEmail, type Me } from '../../shared/api'
import { randomToken } from '../lib/crypto'
import { renderEmail } from '../lib/emailTemplate'
import { ApiError, readBody } from '../lib/http'
import { sendEmails } from '../lib/resend'
import { owners } from '../lib/session'
import type { AppEnv } from '../types'

// Who may use the portal, and what each of them can change. Owners live in the ADMIN_EMAILS secret
// and can only change with `wrangler secret put`; everyone else is a row in `admins` with a level
// (admin, board, team), the areas a board seat holds, and a seat name. Adding, changing and
// removing them needs full access; lib/access.ts puts every write here behind the 'admin' gate.

const app = new Hono<AppEnv>()

interface AdminRow {
  email: string
  added_by: string
  created_at: string
  level: AdminLevel
  areas: string
  seat: string
}

const ADMIN_COLUMNS = 'email, added_by, created_at, level, areas, seat'

/** Who someone was at their latest sign-in, and when they were last in the portal. */
interface SeenRow {
  email: string
  last_seen_at: string
  name: string | null
  avatar_url: string | null
}

const toAdmin = (row: AdminRow, seen?: SeenRow): Admin => ({
  email: row.email,
  isOwner: false,
  level: row.level,
  areas: row.level === 'board' ? parseAreas(row.areas) : [],
  seat: row.seat,
  name: seen?.name ?? null,
  avatarUrl: seen?.avatar_url ?? null,
  addedBy: row.added_by,
  createdAt: row.created_at,
  lastSeenAt: seen?.last_seen_at ?? null,
})

/** Areas as the admins table keeps them: comma-joined, and only for the board. */
const storedAreas = (level: AdminLevel, areas: readonly Area[]) => (level === 'board' ? [...new Set(areas)].join(',') : '')

const INVITE_EVERY_MINUTES = 10

/**
 * Tell a new admin they're in, and that only this exact Google account works. Awaited rather
 * than left to waitUntil so the portal can say whether it went; never throws, so a Resend outage
 * can't undo the add.
 */
async function sendInvite(c: Context<AppEnv>, email: string): Promise<InviteEmail> {
  const adder = c.var.admin.name ?? c.var.admin.email
  const origin = new URL(c.req.url).origin
  const body = [
    'You’re a Proto admin!',
    'Proto is a home base for BU students who make things: weekly hack nights, group trips to hackathons, and demo nights, across three tracks (Start, Build and Launch) for first-timers through student founders.',
    `${adder} added you as an admin of the Proto portal, where the team updates the site and looks after members, the fund list and email.`,
    `${origin}/admin`,
    `Sign in with Google using this exact address: ${email}. Any other Google account won’t get in.`,
    'If you weren’t expecting this, you can ignore it, or reply and let us know.',
  ].join('\n\n')
  try {
    const rendered = renderEmail({
      subject: 'You’re in! Welcome to the Proto portal',
      body,
      recipient: { email, name: '' },
      reason: { kind: 'admin' },
      origin,
    })
    const result = await sendEmails(c.env, [{ to: email, ...rendered }], `admin-invite-${randomToken(12)}`)
    return result.logged ? 'logged' : result.sent === 1 ? 'sent' : 'failed'
  } catch (error) {
    console.error('[email] admin invite failed:', error)
    return 'failed'
  }
}

app.get('/api/admin/me', (c) => {
  const { email, name, avatarUrl, isOwner, level, areas, seat } = c.var.admin
  return c.json<Me>({ email, name, avatarUrl, isOwner, level, areas, seat })
})

app.get('/api/admin/admins', async (c) => {
  // SQLite fills the other columns of a MAX() row from the row that has the max, so name and
  // picture come from their latest session.
  const [rows, seen] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT ${ADMIN_COLUMNS} FROM admins ORDER BY created_at ASC, email ASC`),
    c.env.DB.prepare('SELECT email, MAX(last_seen_at) AS last_seen_at, name, avatar_url FROM admin_sessions GROUP BY email'),
  ])
  const lastSeen = new Map((seen.results as SeenRow[]).map((row) => [row.email.toLowerCase(), row]))
  const ownerSet = owners(c.env)

  const items: Admin[] = [
    ...[...ownerSet].map((email): Admin => {
      const session = lastSeen.get(email)
      return {
        email,
        isOwner: true,
        level: 'owner',
        areas: [],
        seat: '',
        name: session?.name ?? null,
        avatarUrl: session?.avatar_url ?? null,
        addedBy: null,
        createdAt: null,
        lastSeenAt: session?.last_seen_at ?? null,
      }
    }),
    // A row for someone who has since been made an owner would show twice; the owner entry wins.
    ...(rows.results as AdminRow[])
      .filter((row) => !ownerSet.has(row.email.toLowerCase()))
      .map((row) => toAdmin(row, lastSeen.get(row.email.toLowerCase()))),
  ]
  return c.json({ items })
})

app.post('/api/admin/admins', async (c) => {
  const { email, level = 'admin', areas = [], seat = '' } = await readBody(c, addAdminInput)
  if (owners(c.env).has(email)) {
    throw new ApiError(409, `${email} is an owner already.`, { email: 'Already an owner' })
  }
  // admins.email is COLLATE NOCASE, so the conflict catches any casing.
  const row = await c.env.DB.prepare(
    `INSERT INTO admins (email, added_by, invited_at, level, areas, seat) VALUES (?, ?, datetime('now'), ?, ?, ?)
     ON CONFLICT (email) DO NOTHING
     RETURNING ${ADMIN_COLUMNS}`,
  )
    .bind(email, c.var.admin.email, level, storedAreas(level, areas), seat)
    .first<AdminRow>()
  if (!row) throw new ApiError(409, `${email} is an admin already.`, { email: 'Already an admin' })

  return c.json({ item: toAdmin(row), emailed: await sendInvite(c, row.email) }, 201)
})

app.patch('/api/admin/admins/:email', async (c) => {
  const email = c.req.param('email').trim().toLowerCase()
  if (owners(c.env).has(email)) throw new ApiError(403, 'Owners are set in ADMIN_EMAILS, so they always have full access.')
  const input = await readBody(c, updateAdminInput)
  const current = await c.env.DB.prepare(`SELECT ${ADMIN_COLUMNS} FROM admins WHERE email = ?`).bind(email).first<AdminRow>()
  if (!current) throw new ApiError(404, 'Not found.')

  const level = input.level ?? current.level
  // Moving to the board without naming areas keeps whatever they held; off the board, none.
  const areas = input.areas ?? parseAreas(current.areas)
  const nextAreas = storedAreas(level, areas)
  // An admin who made themselves team couldn't undo it, so their own access is someone else's call.
  const self = email === c.var.admin.email.toLowerCase()
  if (self && (level !== current.level || nextAreas !== storedAreas(current.level, parseAreas(current.areas)))) {
    throw new ApiError(400, 'You can’t change your own access. Ask another admin.')
  }

  const row = await c.env.DB.prepare(`UPDATE admins SET level = ?, areas = ?, seat = ? WHERE email = ? RETURNING ${ADMIN_COLUMNS}`)
    .bind(level, nextAreas, input.seat ?? current.seat, email)
    .first<AdminRow>()
  if (!row) throw new ApiError(404, 'Not found.')
  const seen = await c.env.DB.prepare(
    'SELECT email, MAX(last_seen_at) AS last_seen_at, name, avatar_url FROM admin_sessions WHERE email = ? GROUP BY email',
  )
    .bind(email)
    .first<SeenRow>()
  return c.json({ item: toAdmin(row, seen ?? undefined) })
})

app.post('/api/admin/admins/:email/invite', async (c) => {
  const email = c.req.param('email').trim().toLowerCase()
  if (owners(c.env).has(email)) throw new ApiError(400, 'Owners don’t need an invite.')
  // Claiming the slot and checking the throttle in one statement, so two clicks can't both send.
  const claimed = await c.env.DB.prepare(
    `UPDATE admins SET invited_at = datetime('now')
     WHERE email = ? AND (invited_at IS NULL OR invited_at <= datetime('now', ?))
     RETURNING email`,
  )
    .bind(email, `-${INVITE_EVERY_MINUTES} minutes`)
    .first<{ email: string }>()
  if (!claimed) {
    const exists = await c.env.DB.prepare('SELECT 1 FROM admins WHERE email = ?').bind(email).first()
    if (!exists) throw new ApiError(404, 'Not found.')
    throw new ApiError(429, `We emailed ${email} in the last ${INVITE_EVERY_MINUTES} minutes. Give it a little longer.`)
  }
  return c.json({ emailed: await sendInvite(c, claimed.email) })
})

app.delete('/api/admin/admins/:email', async (c) => {
  const email = c.req.param('email').trim().toLowerCase()
  if (owners(c.env).has(email)) throw new ApiError(403, 'Owners are set in ADMIN_EMAILS.')
  if (email === c.var.admin.email.toLowerCase()) {
    throw new ApiError(400, 'You can’t remove yourself. Ask another admin.')
  }

  // Dropping the sessions signs them out now rather than on their next request, and their MCP
  // tokens go too (they'd be refused anyway: every token request checks access again).
  const [deleted] = await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM admins WHERE email = ?').bind(email),
    c.env.DB.prepare('DELETE FROM admin_sessions WHERE email = ?').bind(email),
    c.env.DB.prepare('DELETE FROM mcp_tokens WHERE email = ?').bind(email),
  ])
  if (!deleted.meta.changes) throw new ApiError(404, 'Not found.')
  return c.body(null, 204)
})

export default app
