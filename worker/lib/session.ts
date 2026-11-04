import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from '../types'
import { randomToken, sha256 } from './crypto'
import { ApiError } from './http'

// The admin session: a random token in an HttpOnly cookie, its SHA-256 in admin_sessions.
// `__Host-` pins the cookie to this exact host over HTTPS (browsers treat localhost as secure).

export const SESSION_COOKIE = '__Host-proto_session'
const SESSION_DAYS = 14

/** Logins in ADMIN_GITHUB_LOGINS, lowercased. */
export function owners(env: Env): Set<string> {
  return new Set(
    String(env.ADMIN_GITHUB_LOGINS)
      .split(',')
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean),
  )
}

/** Whether a GitHub login may use the portal: an owner, or in the admins table. */
export async function isAllowed(env: Env, login: string): Promise<boolean> {
  if (owners(env).has(login.toLowerCase())) return true
  const row = await env.DB.prepare('SELECT 1 FROM admins WHERE login = ?').bind(login).first()
  return row !== null
}

interface GitHubProfile {
  id: number
  login: string
  name: string | null
  avatarUrl: string | null
}

/** Start a session for an allowed admin and set the cookie. Call only after isAllowed. */
export async function createSession(c: Context<AppEnv>, profile: GitHubProfile): Promise<void> {
  const token = randomToken()
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (token_hash, login, github_id, name, avatar_url, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(await sha256(token), profile.login, profile.id, profile.name, profile.avatarUrl, sqliteTime(expires))
    .run()
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    expires,
  })
}

/** End the current session, if any, and clear the cookie. */
export async function destroySession(c: Context<AppEnv>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sha256(token)).run()
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true })
}

/**
 * Every /api/admin route: 401 without a live session, and 401 (session dropped) if the login
 * has since been removed from the admins. Sets `c.var.admin`.
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) throw new ApiError(401, 'Sign in to continue.')
  const hash = await sha256(token)
  const session = await c.env.DB.prepare(
    `SELECT login, github_id, name, avatar_url FROM admin_sessions
     WHERE token_hash = ? AND expires_at > datetime('now')`,
  )
    .bind(hash)
    .first<{ login: string; github_id: number; name: string | null; avatar_url: string | null }>()
  if (!session) throw new ApiError(401, 'Sign in to continue.')

  if (!(await isAllowed(c.env, session.login))) {
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE login = ?').bind(session.login).run()
    deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true })
    throw new ApiError(401, 'You no longer have access.')
  }

  c.set('admin', {
    login: session.login,
    githubId: session.github_id,
    name: session.name,
    avatarUrl: session.avatar_url,
    isOwner: owners(c.env).has(session.login.toLowerCase()),
  })
  c.executionCtx.waitUntil(
    c.env.DB.prepare("UPDATE admin_sessions SET last_seen_at = datetime('now') WHERE token_hash = ?").bind(hash).run(),
  )
  await next()
}

/**
 * Every state-changing /api request must come from this site: the Origin header has to match.
 * Together with the SameSite=Lax cookie this keeps other sites from driving the portal.
 */
export const sameOrigin: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Mail clients' one-click unsubscribe (RFC 8058) POSTs here with no Origin; it only needs the token.
  const exempt = c.req.path === '/api/unsubscribe'
  if (!exempt && !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('Origin')
    if (origin !== new URL(c.req.url).origin) throw new ApiError(403, 'Cross-site request blocked.')
  }
  await next()
}

/** "2026-11-03 21:14:05", the format datetime('now') writes, so string comparisons in SQL work. */
export function sqliteTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}
