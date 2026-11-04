import { Hono, type Context } from 'hono'
import { addAdminInput, type Admin, type InviteEmail, type Me } from '../../shared/api'
import { randomToken } from '../lib/crypto'
import { renderEmail } from '../lib/emailTemplate'
import { ApiError, readBody } from '../lib/http'
import { sendEmails } from '../lib/resend'
import { owners } from '../lib/session'
import type { AppEnv } from '../types'

// Who may use the portal. Owners live in the ADMIN_EMAILS secret and can only change with
// `wrangler secret put`; everyone else is a row in `admins` that any admin can add or remove here.

const app = new Hono<AppEnv>()

interface AdminRow {
  email: string
  added_by: string
  created_at: string
}

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
    'You’re a BU Proto admin',
    `${adder} added you as an admin of the BU Proto portal, where the team updates the site and looks after members, the fund list and email.`,
    `${origin}/admin`,
    `Sign in with Google using this exact address: ${email}. Any other Google account won’t get in.`,
    'If you weren’t expecting this, you can ignore it, or reply and let us know.',
  ].join('\n\n')
  try {
    const rendered = renderEmail({
      subject: 'You’re now a BU Proto admin',
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
  const { email, name, avatarUrl, isOwner } = c.var.admin
  return c.json<Me>({ email, name, avatarUrl, isOwner })
})

app.get('/api/admin/admins', async (c) => {
  const [rows, seen] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT email, added_by, created_at FROM admins ORDER BY created_at ASC, email ASC'),
    c.env.DB.prepare('SELECT email, MAX(last_seen_at) AS last_seen_at FROM admin_sessions GROUP BY email'),
  ])
  const lastSeen = new Map(
    (seen.results as { email: string; last_seen_at: string }[]).map((row) => [row.email.toLowerCase(), row.last_seen_at]),
  )
  const ownerSet = owners(c.env)

  const items: Admin[] = [
    ...[...ownerSet].map((email) => ({
      email,
      isOwner: true,
      addedBy: null,
      createdAt: null,
      lastSeenAt: lastSeen.get(email) ?? null,
    })),
    // A row for someone who has since been made an owner would show twice; the owner entry wins.
    ...(rows.results as AdminRow[])
      .filter((row) => !ownerSet.has(row.email.toLowerCase()))
      .map((row) => ({
        email: row.email,
        isOwner: false,
        addedBy: row.added_by,
        createdAt: row.created_at,
        lastSeenAt: lastSeen.get(row.email.toLowerCase()) ?? null,
      })),
  ]
  return c.json({ items })
})

app.post('/api/admin/admins', async (c) => {
  const { email } = await readBody(c, addAdminInput)
  if (owners(c.env).has(email)) {
    throw new ApiError(409, `${email} is an owner already.`, { email: 'Already an owner' })
  }
  // admins.email is COLLATE NOCASE, so the conflict catches any casing.
  const row = await c.env.DB.prepare(
    `INSERT INTO admins (email, added_by, invited_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT (email) DO NOTHING
     RETURNING email, added_by, created_at`,
  )
    .bind(email, c.var.admin.email)
    .first<AdminRow>()
  if (!row) throw new ApiError(409, `${email} is an admin already.`, { email: 'Already an admin' })

  const item: Admin = {
    email: row.email,
    isOwner: false,
    addedBy: row.added_by,
    createdAt: row.created_at,
    lastSeenAt: null,
  }
  return c.json({ item, emailed: await sendInvite(c, row.email) }, 201)
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

  // Dropping the sessions signs them out now rather than on their next request.
  const [deleted] = await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM admins WHERE email = ?').bind(email),
    c.env.DB.prepare('DELETE FROM admin_sessions WHERE email = ?').bind(email),
  ])
  if (!deleted.meta.changes) throw new ApiError(404, 'Not found.')
  return c.body(null, 204)
})

export default app
