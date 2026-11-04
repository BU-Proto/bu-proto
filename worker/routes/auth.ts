import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { randomToken, sha256Base64url } from '../lib/crypto'
import { ApiError } from '../lib/http'
import { createSession, destroySession, isAllowed, isLocalDev, LOCAL_EMAIL } from '../lib/session'
import type { AppEnv } from '../types'

// Google sign-in (OpenID Connect, authorization code flow with PKCE). Google only proves who
// someone is; whether they get in is isAllowed's call. Google's tokens are read once for the
// profile and then dropped: the portal never acts as the user.

const app = new Hono<AppEnv>()

const OAUTH_COOKIE = '__Host-proto_oauth'
const OAUTH_MINUTES = 10
const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com'])

/** Only paths inside the portal, so `next` can't send anyone off-site (no `//host`, no `\`). */
const NEXT_PATH = /^\/admin(?:[/?#][^\s\\]*)?$/

function safeNext(next: string | undefined): string | null {
  if (next === undefined || next === '') return '/admin'
  return NEXT_PATH.test(next) && !next.includes('//') ? next : null
}

const callbackUrl = (url: string) => `${new URL(url).origin}/api/auth/callback`

app.get('/api/auth/google', async (c) => {
  const next = safeNext(c.req.query('next'))
  if (!next) throw new ApiError(400, 'next must be a path under /admin.')

  // Local sign-in: under `npm run dev` the button signs you straight in, without Google. The
  // whole branch is compiled out of production builds (see isLocalDev).
  if (import.meta.env.DEV && isLocalDev(c.req.url)) {
    const email = String(c.env.ADMIN_EMAILS ?? '').split(',')[0]?.trim().toLowerCase() || LOCAL_EMAIL
    await createSession(c, { sub: 'local', email, name: null, avatarUrl: null })
    return c.redirect(next)
  }

  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) return c.redirect('/admin?error=not-configured')

  const state = randomToken(16)
  const nonce = randomToken(16)
  const verifier = randomToken(32)
  // The three tokens are base64url, so the first three '.'s are the separators.
  setCookie(c, OAUTH_COOKIE, [state, nonce, verifier, next].join('.'), {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: OAUTH_MINUTES * 60,
  })

  const authorize = new URL(AUTHORIZE_URL)
  authorize.search = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl(c.req.url),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: await sha256Base64url(verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString()
  return c.redirect(authorize.toString())
})

interface SavedFlow {
  state: string
  nonce: string
  verifier: string
  next: string
}

function readFlow(saved: string | undefined): SavedFlow | null {
  const parts = saved?.split('.') ?? []
  if (parts.length < 4) return null
  const [state, nonce, verifier] = parts
  const next = safeNext(parts.slice(3).join('.'))
  if (!state || !nonce || !verifier || !next) return null
  return { state, nonce, verifier, next }
}

interface GoogleClaims {
  iss?: unknown
  aud?: unknown
  exp?: unknown
  nonce?: unknown
  sub?: unknown
  email?: unknown
  email_verified?: unknown
  name?: unknown
  picture?: unknown
}

/** A JWT's payload. Unverified: only safe for a token fetched straight from Google over TLS. */
function jwtClaims(jwt: string): GoogleClaims {
  const payload = jwt.split('.')[1]
  if (!payload) throw new Error('Google sent an id_token without a payload')
  const base64 = payload.replaceAll('-', '+').replaceAll('_', '/')
  const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as GoogleClaims
}

interface GoogleUser {
  sub: string
  email: string
  emailVerified: boolean
  name: string | null
  picture: string | null
}

async function fetchGoogleUser(env: Env, code: string, flow: SavedFlow, redirectUri: string): Promise<GoogleUser> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: flow.verifier,
    }),
  })
  const body = response.ok ? ((await response.json()) as { id_token?: unknown }) : null
  if (typeof body?.id_token !== 'string') throw new Error(`Google token exchange failed (${response.status})`)

  const claims = jwtClaims(body.id_token)
  if (typeof claims.iss !== 'string' || !ISSUERS.has(claims.iss)) throw new Error('id_token from the wrong issuer')
  if (claims.aud !== env.GOOGLE_CLIENT_ID) throw new Error('id_token for another client')
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) throw new Error('id_token expired')
  if (claims.nonce !== flow.nonce) throw new Error('id_token nonce mismatch')
  if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') throw new Error('id_token without sub or email')
  return {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === 'string' ? claims.name : null,
    picture: typeof claims.picture === 'string' ? claims.picture : null,
  }
}

app.get('/api/auth/callback', async (c) => {
  const flow = readFlow(getCookie(c, OAUTH_COOKIE))
  deleteCookie(c, OAUTH_COOKIE, { path: '/', secure: true })

  // Google also lands here with ?error=access_denied when someone cancels; that has no code.
  const code = c.req.query('code')
  if (!code || !flow || c.req.query('state') !== flow.state) return c.redirect('/admin?error=google')

  let user: GoogleUser
  try {
    user = await fetchGoogleUser(c.env, code, flow, callbackUrl(c.req.url))
  } catch (error) {
    console.error(error)
    return c.redirect('/admin?error=google')
  }
  // An unverified address could be anyone's, so it never matches the allow list.
  if (!user.emailVerified) return c.redirect('/admin?error=google')

  if (!(await isAllowed(c.env, user.email, c.req.url))) {
    return c.redirect(`/admin?${new URLSearchParams({ error: 'denied', email: user.email })}`)
  }
  await createSession(c, { sub: user.sub, email: user.email, name: user.name, avatarUrl: user.picture })
  return c.redirect(flow.next)
})

app.post('/api/auth/logout', async (c) => {
  await destroySession(c)
  return c.body(null, 204)
})

export default app
