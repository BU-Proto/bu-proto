import { Hono, type Context } from 'hono'
import { mcpTokenInput, type McpToken } from '../../shared/api'
import { randomToken, sha256 } from '../lib/crypto'
import { ApiError, idParam, readBody } from '../lib/http'
import { actAs, adminFor, sqliteTime } from '../lib/session'
import { handleBody, type McpServer, type ToolResult } from '../mcp/protocol'
import { CallError, INSTRUCTIONS, isWrite, runTool, toolList, type Api } from '../mcp/tools'
import type { AdminSession, AppEnv } from '../types'

// The portal as an MCP server, for Claude Code, Claude Desktop or any MCP client:
//
//   POST /api/mcp                    Streamable HTTP (stateless JSON), Authorization: Bearer <token>
//   GET/POST /api/admin/mcp-tokens   a teammate's own tokens, made and revoked in the portal
//   DELETE /api/admin/mcp-tokens/:id
//
// A token acts as the teammate who made it. Each tool calls the portal's own route in-process
// (see actAs in lib/session.ts), so everything a route checks (validation, levels and areas, the
// email guards) holds exactly as it does in the portal, and the token can do no more than its
// maker can today. Tokens can't reach the token routes or change who has access (mcp/tools.ts).

/** Every token starts with this, so a leaked one is easy to recognise (and to scan for). */
export const TOKEN_PREFIX = 'proto_mcp_'

/** The most live tokens one teammate may hold. */
const MAX_TOKENS = 10

/** The biggest request body the endpoint reads. Tool arguments are small; this leaves room. */
const MAX_BODY = 1024 * 1024

/** Read tools that POST (Claude's draft, the preview, page lookups): the only writes a read-only token may send. */
const READ_ONLY_POSTS = new Set(['/api/admin/email/draft', '/api/admin/email/preview', '/api/admin/event-import/lookup', '/api/admin/devpost/lookup'])

type Dispatch = (request: Request, env: Env, ctx: Context<AppEnv>['executionCtx']) => Promise<Response>

interface TokenRow {
  id: number
  email: string
  google_sub: string
  name: string | null
  avatar_url: string | null
  read_only: number
}

/** The portal's API, called in-process as `admin`. */
function internalApi(c: Context<AppEnv>, dispatch: Dispatch, admin: AdminSession, readOnly: boolean): Api {
  const origin = new URL(c.req.url).origin

  const call = async (method: string, path: string, body?: unknown): Promise<unknown> => {
    const pathname = path.split('?')[0]
    // Belt and braces: the tools only ever build these paths, but nothing here may reach the token
    // routes, and a read-only token sends nothing but GETs and the read tools' POSTs.
    if (!pathname.startsWith('/api/admin/') || pathname.startsWith('/api/admin/mcp-tokens')) {
      throw new CallError(403, 'That isn’t available over MCP.')
    }
    if (readOnly && method !== 'GET' && !(method === 'POST' && READ_ONLY_POSTS.has(pathname))) {
      throw new CallError(403, 'This token is read-only.')
    }
    const headers: Record<string, string> = { Origin: origin, Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const request = actAs(
      new Request(origin + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }),
      admin,
    )
    const response = await dispatch(request, c.env, c.executionCtx)
    const text = await response.text()
    let data: unknown = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { text }
      }
    }
    if (!response.ok) {
      const error = (data ?? {}) as { error?: unknown; issues?: Record<string, string> }
      throw new CallError(response.status, typeof error.error === 'string' ? error.error : response.statusText || 'Request failed.', error.issues)
    }
    return data ?? { ok: true }
  }

  return {
    get: (path, query) => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined) params.set(key, String(value))
      const search = params.toString()
      return call('GET', search ? `${path}?${search}` : path)
    },
    send: (method, path, body) => call(method, path, body),
  }
}

function unauthorized(c: Context<AppEnv>, message: string) {
  c.header('WWW-Authenticate', `Bearer realm="proto", error="invalid_token", error_description="${message}"`)
  return c.json({ error: message }, 401)
}

const toToken = (row: { id: number; label: string; read_only: number; created_at: string; expires_at: string; last_used_at: string | null }): McpToken => ({
  id: row.id,
  label: row.label,
  readOnly: row.read_only === 1,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  lastUsedAt: row.last_used_at,
})

export function mcpRoutes(dispatch: Dispatch) {
  const app = new Hono<AppEnv>()

  app.post('/api/mcp', async (c) => {
    // MCP clients aren't browsers and send no Origin; a page in a browser that tries is refused
    // unless it's our own (the spec's guard against DNS rebinding).
    const origin = c.req.header('Origin')
    if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'Cross-site request blocked.' }, 403)

    const token = /^Bearer\s+(\S+)$/i.exec(c.req.header('Authorization') ?? '')?.[1]
    if (!token?.startsWith(TOKEN_PREFIX)) return unauthorized(c, 'Send a Proto MCP token as Authorization: Bearer. Make one in the portal under Access, then Claude.')
    const hash = await sha256(token)
    const row = await c.env.DB.prepare(
      `SELECT id, email, google_sub, name, avatar_url, read_only FROM mcp_tokens WHERE token_hash = ? AND expires_at > datetime('now')`,
    )
      .bind(hash)
      .first<TokenRow>()
    if (!row) return unauthorized(c, 'That token is unknown, revoked or expired. Make a new one in the portal.')

    const admin = await adminFor(c.env, { email: row.email, googleSub: row.google_sub, name: row.name, avatarUrl: row.avatar_url }, c.req.url)
    if (!admin) {
      await c.env.DB.prepare('DELETE FROM mcp_tokens WHERE email = ?').bind(row.email).run()
      return unauthorized(c, 'Whoever made this token no longer has access to the portal.')
    }
    c.executionCtx.waitUntil(c.env.DB.prepare("UPDATE mcp_tokens SET last_used_at = datetime('now') WHERE id = ?").bind(row.id).run())

    const readOnly = row.read_only === 1
    const api = internalApi(c, dispatch, admin, readOnly)
    const server: McpServer = {
      info: { name: 'proto-admin', title: 'Proto admin portal', version: '1.0.0' },
      instructions: readOnly ? `${INSTRUCTIONS}\n\nThis token is read-only: it can look at everything and change nothing.` : INSTRUCTIONS,
      tools: toolList(readOnly),
      call: (name, args): Promise<ToolResult> =>
        readOnly && isWrite(name)
          ? Promise.resolve({ content: [{ type: 'text', text: 'This token is read-only.' }], isError: true })
          : runTool(name, args, api),
    }

    const length = Number(c.req.header('Content-Length') ?? 0)
    if (length > MAX_BODY) return c.json({ error: 'That request is too big.' }, 413)
    const raw = await c.req.text()
    if (raw.length > MAX_BODY) return c.json({ error: 'That request is too big.' }, 413)
    const { status, body } = await handleBody(server, raw)
    if (status === 202) return c.body(null, 202)
    return c.json(body, status)
  })

  // Stateless: no server-sent stream to open and no session to end.
  const notHere = (c: Context<AppEnv>) => {
    c.header('Allow', 'POST')
    return c.json({ error: 'This MCP server answers POST only.' }, 405)
  }
  app.get('/api/mcp', notHere)
  app.delete('/api/mcp', notHere)

  // ---- Tokens, in the portal (cookie session; tokens can't reach these) ------------------------

  app.get('/api/admin/mcp-tokens', async (c) => {
    const { results } = await c.env.DB.prepare(
      `SELECT id, label, read_only, created_at, expires_at, last_used_at FROM mcp_tokens
       WHERE email = ? AND expires_at > datetime('now') ORDER BY created_at DESC, id DESC`,
    )
      .bind(c.var.admin.email.toLowerCase())
      .all<{ id: number; label: string; read_only: number; created_at: string; expires_at: string; last_used_at: string | null }>()
    return c.json({ items: results.map(toToken) })
  })

  app.post('/api/admin/mcp-tokens', async (c) => {
    const input = await readBody(c, mcpTokenInput)
    const admin = c.var.admin
    const email = admin.email.toLowerCase()
    // Expired ones go first, so they don't count against the limit.
    await c.env.DB.prepare("DELETE FROM mcp_tokens WHERE email = ? AND expires_at <= datetime('now')").bind(email).run()
    const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM mcp_tokens WHERE email = ?').bind(email).first<{ n: number }>()
    if ((count?.n ?? 0) >= MAX_TOKENS) throw new ApiError(409, `You have ${MAX_TOKENS} tokens already. Revoke one you don’t use first.`)

    const token = TOKEN_PREFIX + randomToken()
    const expires = sqliteTime(new Date(Date.now() + input.days * 86_400_000))
    const row = await c.env.DB.prepare(
      `INSERT INTO mcp_tokens (token_hash, email, google_sub, name, avatar_url, label, read_only, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, label, read_only, created_at, expires_at, last_used_at`,
    )
      .bind(await sha256(token), email, admin.googleSub, admin.name, admin.avatarUrl, input.label, input.readOnly ? 1 : 0, expires)
      .first<{ id: number; label: string; read_only: number; created_at: string; expires_at: string; last_used_at: string | null }>()
    if (!row) throw new ApiError(500, 'Could not make the token.')
    return c.json({ item: toToken(row), token }, 201)
  })

  app.delete('/api/admin/mcp-tokens/:id', async (c) => {
    const { meta } = await c.env.DB.prepare('DELETE FROM mcp_tokens WHERE id = ? AND email = ?')
      .bind(idParam(c), c.var.admin.email.toLowerCase())
      .run()
    if (!meta.changes) throw new ApiError(404, 'Not found.')
    return c.body(null, 204)
  })

  return app
}
