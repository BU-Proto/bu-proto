import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { parseAreas, type AdminLevel } from '../../shared/access'
import type { AppEnv } from '../types'
import { randomToken, sha256 } from './crypto'
import { ApiError } from './http'

// The admin session: a random token in an HttpOnly cookie, its SHA-256 in admin_sessions.
// `__Host-` pins the cookie to this exact host over HTTPS (browsers treat localhost as secure).

export const SESSION_COOKIE = '__Host-proto_session'
const SESSION_DAYS = 14

/** Emails in ADMIN_EMAILS, trimmed and lowercased, in the order written. */
export function owners(env: Env): Set<string> {
  return new Set(
    String(env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

/**
 * Local sign-in's stand-in when ADMIN_EMAILS is empty. Only ever accepted under `vite dev` on
 * localhost (see isAllowed), so a real Google account can't claim it.
 */
export const LOCAL_EMAIL = 'you@localhost'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Whether this request may use local sign-in. import.meta.env.DEV is replaced with `false` when
 * Vite builds for production, so every branch behind it is stripped from the deployed Worker; no
 * variable or secret can switch it back on. The localhost check is a second lock.
 */
export function isLocalDev(url: string): boolean {
  return import.meta.env.DEV && LOCAL_HOSTS.has(new URL(url).hostname)
}

/** Whether an email may use the portal: an owner, or in the admins table. `url` is the request's. */
export async function isAllowed(env: Env, email: string, url: string): Promise<boolean> {
  const lower = email.toLowerCase()
  if (import.meta.env.DEV && lower === LOCAL_EMAIL && isLocalDev(url)) return true
  if (owners(env).has(lower)) return true
  const row = await env.DB.prepare('SELECT 1 FROM admins WHERE email = ?').bind(lower).first()
  return row !== null
}

interface Profile {
  /** Google's stable account id (`sub`). */
  sub: string
  email: string
  name: string | null
  avatarUrl: string | null
}

/** Start a session for an allowed admin and set the cookie. Call only after isAllowed. */
export async function createSession(c: Context<AppEnv>, profile: Profile): Promise<void> {
  const token = randomToken()
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (token_hash, email, google_sub, name, avatar_url, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(await sha256(token), profile.email.toLowerCase(), profile.sub, profile.name, profile.avatarUrl, sqliteTime(expires))
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
 * Every /api/admin route: 401 without a live session, and 401 (session dropped) if the email
 * has since been removed from the admins. Sets `c.var.admin`.
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) throw new ApiError(401, 'Sign in to continue.')
  const hash = await sha256(token)
  const session = await c.env.DB.prepare(
    `SELECT email, google_sub, name, avatar_url FROM admin_sessions
     WHERE token_hash = ? AND expires_at > datetime('now')`,
  )
    .bind(hash)
    .first<{ email: string; google_sub: string; name: string | null; avatar_url: string | null }>()
  if (!session) throw new ApiError(401, 'Sign in to continue.')

  if (!(await isAllowed(c.env, session.email, c.req.url))) {
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE email = ?').bind(session.email).run()
    deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true })
    throw new ApiError(401, 'You no longer have access.')
  }

  const isOwner = owners(c.env).has(session.email.toLowerCase())
  // Level and areas live on the admins row; owners have no row and change everything. Local
  // sign-in's stand-in has no row either, and gets full access the same way.
  const row = isOwner
    ? null
    : await c.env.DB.prepare('SELECT level, areas, seat FROM admins WHERE email = ?')
        .bind(session.email.toLowerCase())
        .first<{ level: AdminLevel; areas: string; seat: string }>()
  c.set('admin', {
    email: session.email,
    googleSub: session.google_sub,
    name: session.name,
    avatarUrl: session.avatar_url,
    isOwner,
    level: isOwner ? 'owner' : (row?.level ?? 'admin'),
    areas: row?.level === 'board' ? parseAreas(row.areas) : [],
    seat: row?.seat ?? '',
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
  // Resend's webhook comes from Resend's servers; its signature is checked instead (routes/inbox.ts).
  const exempt = c.req.path === '/api/unsubscribe' || c.req.path === '/api/inbound/resend'
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
