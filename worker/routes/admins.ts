import { Hono } from 'hono'
import { addAdminInput, type Admin, type Me } from '../../shared/api'
import { ApiError, readBody } from '../lib/http'
import { owners } from '../lib/session'
import type { AppEnv } from '../types'

// Who may use the portal. Owners live in ADMIN_GITHUB_LOGINS and can only change with a deploy;
// everyone else is a row in `admins` that any admin can add or remove here.

const app = new Hono<AppEnv>()

interface AdminRow {
  login: string
  added_by: string
  created_at: string
}

/** Owners as written in ADMIN_GITHUB_LOGINS (owners() lowercases, which would lose the casing we show). */
function ownerLogins(env: Env): string[] {
  const byLower = new Map<string, string>()
  for (const raw of String(env.ADMIN_GITHUB_LOGINS).split(',')) {
    const login = raw.trim()
    if (login && !byLower.has(login.toLowerCase())) byLower.set(login.toLowerCase(), login)
  }
  return [...byLower.values()]
}

app.get('/api/admin/me', (c) => {
  const { login, name, avatarUrl, isOwner } = c.var.admin
  return c.json<Me>({ login, name, avatarUrl, isOwner })
})

app.get('/api/admin/admins', async (c) => {
  const [rows, seen] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT login, added_by, created_at FROM admins ORDER BY created_at ASC, login ASC'),
    c.env.DB.prepare('SELECT login, MAX(last_seen_at) AS last_seen_at FROM admin_sessions GROUP BY login'),
  ])
  const lastSeen = new Map(
    (seen.results as { login: string; last_seen_at: string }[]).map((row) => [row.login.toLowerCase(), row.last_seen_at]),
  )
  const ownerSet = owners(c.env)

  const items: Admin[] = [
    ...ownerLogins(c.env).map((login) => ({
      login,
      isOwner: true,
      addedBy: null,
      createdAt: null,
      lastSeenAt: lastSeen.get(login.toLowerCase()) ?? null,
    })),
    // A row for someone who has since been made an owner would show twice; the owner entry wins.
    ...(rows.results as AdminRow[])
      .filter((row) => !ownerSet.has(row.login.toLowerCase()))
      .map((row) => ({
        login: row.login,
        isOwner: false,
        addedBy: row.added_by,
        createdAt: row.created_at,
        lastSeenAt: lastSeen.get(row.login.toLowerCase()) ?? null,
      })),
  ]
  return c.json({ items })
})

/**
 * GitHub's spelling of a login, or null if no such user. When GitHub can't say (offline,
 * rate-limited at 60 an hour unauthenticated), trust the login as typed.
 */
async function canonicalLogin(login: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'bu-proto-admin', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(5000),
    })
    if (response.status === 404) return null
    if (!response.ok) return login
    const user = (await response.json()) as { login?: unknown }
    return typeof user.login === 'string' ? user.login : login
  } catch {
    return login
  }
}

app.post('/api/admin/admins', async (c) => {
  const input = await readBody(c, addAdminInput)
  const login = await canonicalLogin(input.login)
  if (!login) throw new ApiError(400, 'Check the highlighted fields.', { login: 'No GitHub user with that name' })

  if (owners(c.env).has(login.toLowerCase())) {
    throw new ApiError(409, `${login} is an owner already.`, { login: 'Already an owner' })
  }
  // admins.login is COLLATE NOCASE, so the conflict catches any casing.
  const row = await c.env.DB.prepare(
    `INSERT INTO admins (login, added_by) VALUES (?, ?)
     ON CONFLICT (login) DO NOTHING
     RETURNING login, added_by, created_at`,
  )
    .bind(login, c.var.admin.login)
    .first<AdminRow>()
  if (!row) throw new ApiError(409, `${login} is an admin already.`, { login: 'Already an admin' })

  const item: Admin = {
    login: row.login,
    isOwner: false,
    addedBy: row.added_by,
    createdAt: row.created_at,
    lastSeenAt: null,
  }
  return c.json({ item }, 201)
})

app.delete('/api/admin/admins/:login', async (c) => {
  const login = c.req.param('login')
  if (owners(c.env).has(login.toLowerCase())) throw new ApiError(403, 'Owners are set in ADMIN_GITHUB_LOGINS.')
  if (login.toLowerCase() === c.var.admin.login.toLowerCase()) {
    throw new ApiError(400, 'You can’t remove yourself. Ask another admin.')
  }

  // Dropping the sessions signs them out now rather than on their next request.
  const [deleted] = await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM admins WHERE login = ?').bind(login),
    c.env.DB.prepare('DELETE FROM admin_sessions WHERE login = ?').bind(login),
  ])
  if (!deleted.meta.changes) throw new ApiError(404, 'Not found.')
  return c.body(null, 204)
})

export default app
