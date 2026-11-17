import type { MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '../types'
import { ApiError, bodyFields } from './http'

// Cloudflare Turnstile on the public forms: the browser widget (src/components/Turnstile.tsx)
// hands the form a token, and we check it with Siteverify before the route touches the database.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** The body field the forms send the token in, the same name Turnstile's own hidden input uses. */
export const TOKEN_FIELD = 'cf-turnstile-response'

const NOT_HUMAN = 'Couldn’t confirm you’re human. Try again.'

/** Where the widget may be solved in production. Never localhost: a token minted there isn't ours. */
const HOSTNAMES = ['buproto.com']

/** Cloudflare's always-pass test secret. Its answers carry sample hostname and action values. */
const TEST_SECRET = '1x0000000000000000000000000000000AA'

export interface TurnstileResult {
  success: boolean
  'error-codes': string[]
  hostname?: string
  action?: string
}

function secretKey(env: Env): string | null {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY
  // The test secret lets the forms work in `vite dev` without a real widget. import.meta.env.DEV
  // is false in builds, so it never reaches production, where a missing secret refuses every
  // submission instead.
  if (import.meta.env.DEV) return TEST_SECRET
  return null
}

/**
 * Ask Siteverify whether `token` is a fresh, unspent Turnstile token. Returns null when no secret
 * is configured, so the caller can fail closed.
 */
export async function verifyTurnstile(env: Env, token: string, ip: string | undefined): Promise<TurnstileResult | null> {
  const secret = secretKey(env)
  if (!secret) return null
  const response = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      ...(ip && { remoteip: ip }),
      // Lets a retried request get the first answer back instead of "token already spent".
      idempotency_key: crypto.randomUUID(),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Siteverify answered ${response.status}`)
  return response.json<TurnstileResult>()
}

/**
 * Route middleware for one public form: reads the token from the body (JSON, or a multipart form
 * for the one that carries a file) and refuses the request unless Siteverify accepts it for this
 * form (`action`, the same one the widget was rendered with) on our hostname. Hono caches the
 * parsed body, so the route can read it again.
 */
export function requireHuman(action: string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = (await bodyFields(c))?.[TOKEN_FIELD]
    if (typeof token !== 'string' || token === '' || token.length > 2048) {
      throw new ApiError(400, NOT_HUMAN, { [TOKEN_FIELD]: NOT_HUMAN })
    }

    let result: TurnstileResult | null
    try {
      result = await verifyTurnstile(c.env, token, c.req.header('CF-Connecting-IP'))
    } catch (error) {
      // Siteverify unreachable: refuse rather than let the request through unchecked.
      console.error('Turnstile siteverify failed', error)
      throw new HTTPException(503, { message: 'Couldn’t check the form right now. Try again in a minute.' })
    }
    if (!result) {
      console.error('TURNSTILE_SECRET_KEY is not set; refusing form submissions')
      throw new HTTPException(503, { message: 'Form protection isn’t set up yet, so this form can’t take submissions. Try again later.' })
    }
    if (!result.success) {
      // A bad secret or request is our fault, not the visitor's, so log it where it gets noticed.
      const ours = result['error-codes'].filter((code) => code.includes('secret') || code === 'bad-request')
      if (ours.length) console.error('Turnstile siteverify rejected our request', ours)
      throw new ApiError(400, NOT_HUMAN, { [TOKEN_FIELD]: NOT_HUMAN })
    }
    // A real secret's answers say where and for which form the token was made; test answers don't.
    const real = Boolean(c.env.TURNSTILE_SECRET_KEY)
    // `vite dev` with a real secret is solved on localhost, which production must never accept.
    const hostnames = import.meta.env.DEV ? [...HOSTNAMES, 'localhost', '127.0.0.1'] : HOSTNAMES
    if (real && (result.action !== action || !result.hostname || !hostnames.includes(result.hostname))) {
      console.warn('Turnstile token for the wrong form or host', { expected: action, action: result.action, hostname: result.hostname })
      throw new ApiError(400, NOT_HUMAN, { [TOKEN_FIELD]: NOT_HUMAN })
    }
    await next()
  }
}
