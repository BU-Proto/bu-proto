import type { Context, MiddlewareHandler } from 'hono'
import { canChange, CONTENT_GATES, whoCanChange, type Gate } from '../../shared/access.ts'
import type { AppEnv } from '../types'
import { ApiError } from './http.ts'

// Server-side checks for who can change what (shared/access.ts says what each gate covers).
// Reading is never gated: every /api/admin GET is open to anyone signed in.
//
// Imports carry their .ts extension so `npm test` can load this file straight from Node.

/** 403 unless the signed-in admin may make changes behind this gate. Call at the top of a write. */
export function requireGate(c: Context<AppEnv>, gate: Gate): void {
  if (!canChange(c.var.admin, gate)) throw new ApiError(403, whoCanChange(gate))
}

/** Whether the signed-in admin may make changes behind this gate, for a write that's only partly gated. */
export function mayChange(c: Context<AppEnv>, gate: Gate): boolean {
  return canChange(c.var.admin, gate)
}

const READS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Every write the portal had before levels existed, and the gate it sits behind. First match
 * wins. The CRM's routes (people, orgs, deals, interactions, follow-ups, intros, event guests,
 * today, the queue) aren't here: each one checks its own gate, since some of them depend on the
 * row (an org's logo-wall spot, say).
 */
const WRITE_GATES: readonly [RegExp, Gate | ((match: RegExpExecArray) => Gate)][] = [
  // Site content, by kind. A kind nobody knows gets the strictest gate; the route 404s it anyway.
  [
    /^\/api\/admin\/content\/([^/]+)(?:\/[^/]+)?$/,
    (match) => (Object.hasOwn(CONTENT_GATES, match[1]) ? CONTENT_GATES[match[1] as keyof typeof CONTENT_GATES] : 'admin'),
  ],
  // Taking someone off an event's RSVPs is the event's business.
  [/^\/api\/admin\/rsvps\/[^/]+$/, 'community'],
  [/^\/api\/admin\/fund\/[^/]+$/, 'fund'],
  // Roles and who gets them are the owners' and admins' call, and so is who joins the Founders Circle.
  [/^\/api\/admin\/applications\/[^/]+$/, 'admin'],
  [/^\/api\/admin\/founders\/[^/]+$/, 'admin'],
  [/^\/api\/admin\/roles\/[^/]+\/filled$/, 'admin'],
  [/^\/api\/admin\/admins(?:\/.*)?$/, 'admin'],
  // A list email goes to hundreds of people; Compose's test and preview and Claude's draft send
  // nothing to anyone but one address, which the Inbox lets anyone do already.
  [/^\/api\/admin\/email\/send$/, 'community'],
  [/^\/api\/admin\/email\/.+$/, 'shared'],
  [/^\/api\/admin\/hackathon-imports\/.+$/, 'community'],
  [/^\/api\/admin\/event-import\/import$/, 'community'],
  [/^\/api\/admin\/devpost\/import$/, 'scouting'],
  // Looking a page up reads it and saves nothing.
  [/^\/api\/admin\/(?:event-import|devpost)\/lookup$/, 'shared'],
  // Shared work: members, sign-up triage, contacts, asks, facts, the one-to-one inbox, pictures.
  [/^\/api\/admin\/(?:members|board-interest|contacts|facts|asks|inbox)(?:\/.*)?$/, 'shared'],
  [/^\/api\/admin\/uploads$/, 'shared'],
  // Everyone makes and revokes their own MCP tokens; a token acts with its maker's own access.
  [/^\/api\/admin\/mcp-tokens(?:\/.*)?$/, 'shared'],
]

/**
 * The gate a request to an existing /api/admin route sits behind, or null for a read or a path
 * that isn't in the table (the CRM routes, which gate themselves).
 */
export function gateFor(method: string, path: string): Gate | null {
  if (READS.has(method.toUpperCase())) return null
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path
  for (const [pattern, gate] of WRITE_GATES) {
    const match = pattern.exec(trimmed)
    if (match) return typeof gate === 'function' ? gate(match) : gate
  }
  return null
}

/** Mounted on /api/admin/* after requireAdmin: a 403 before any handler runs, for a write the admin can't make. */
export const gateWrites: MiddlewareHandler<AppEnv> = async (c, next) => {
  const gate = gateFor(c.req.method, c.req.path)
  if (gate) requireGate(c, gate)
  await next()
}
