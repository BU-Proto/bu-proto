import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { randomToken } from '../lib/crypto'
import { ApiError } from '../lib/http'
import { createSession, destroySession, isAllowed } from '../lib/session'
import type { AppEnv } from '../types'

// GitHub sign-in. GitHub only proves who someone is; whether they get in is isAllowed's call.
// The GitHub token is used once to read the profile and then dropped: the portal never acts as the user.

const app = new Hono<AppEnv>()

const OAUTH_COOKIE = '__Host-proto_oauth'
const OAUTH_MINUTES = 10
const USER_AGENT = 'bu-proto-admin'

/** Only paths inside the portal, so `next` can't send anyone off-site (no `//host`, no `\`). */
const NEXT_PATH = /^\/admin(?:[/?#][^\s\\]*)?$/

/**
 * Local sign-in: under `npm run dev`, the button signs you in as the first owner without GitHub.
 * import.meta.env.DEV is replaced with `false` when Vite builds for production, so this code is
 * stripped from every deployed Worker; no variable or secret can switch it back on. It also only
 * answers requests to localhost, as a second lock.
 */
const LOCAL_SIGN_IN = import.meta.env.DEV
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function safeNext(next: string | undefined): string | null {
  if (next === undefined || next === '') return '/admin'
  return NEXT_PATH.test(next) && !next.includes('//') ? next : null
}

app.get('/api/auth/github', async (c) => {
  const next = safeNext(c.req.query('next'))
  if (!next) throw new ApiError(400, 'next must be a path under /admin.')

  if (LOCAL_SIGN_IN && LOCAL_HOSTS.has(new URL(c.req.url).hostname)) {
    const login = String(c.env.ADMIN_GITHUB_LOGINS).split(',')[0]?.trim()
    if (login) {
      await createSession(c, { id: 0, login, name: login, avatarUrl: null })
      return c.redirect(next)
    }
  }

  if (!c.env.GITHUB_CLIENT_ID || !c.env.GITHUB_CLIENT_SECRET) return c.redirect('/admin?error=not-configured')

  const state = randomToken(16)
  // state is base64url, so the first '.' is the separator.
  setCookie(c, OAUTH_COOKIE, `${state}.${next}`, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: OAUTH_MINUTES * 60,
  })

  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.search = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${new URL(c.req.url).origin}/api/auth/callback`,
    scope: 'read:user',
    state,
    allow_signup: 'false',
  }).toString()
  return c.redirect(authorize.toString())
})

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string | null
}

async function fetchGitHubUser(env: Env, code: string, redirectUri: string): Promise<GitHubUser> {
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  })
  // GitHub answers 200 with { error } for bad codes, so check for the token itself.
  const token = tokenResponse.ok ? ((await tokenResponse.json()) as { access_token?: string }).access_token : undefined
  if (!token) throw new Error(`GitHub token exchange failed (${tokenResponse.status})`)

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': USER_AGENT,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!userResponse.ok) throw new Error(`GitHub user lookup failed (${userResponse.status})`)
  const user = (await userResponse.json()) as GitHubUser
  if (typeof user.id !== 'number' || typeof user.login !== 'string') throw new Error('GitHub sent an odd profile')
  return user
}

app.get('/api/auth/callback', async (c) => {
  const saved = getCookie(c, OAUTH_COOKIE)
  deleteCookie(c, OAUTH_COOKIE, { path: '/', secure: true })

  const code = c.req.query('code')
  const state = c.req.query('state')
  const dot = saved?.indexOf('.') ?? -1
  const savedState = saved && dot > 0 ? saved.slice(0, dot) : null
  const next = saved && dot > 0 ? safeNext(saved.slice(dot + 1)) : null
  if (!code || !state || !savedState || state !== savedState || !next) return c.redirect('/admin?error=github')

  let user: GitHubUser
  try {
    user = await fetchGitHubUser(c.env, code, `${new URL(c.req.url).origin}/api/auth/callback`)
  } catch (error) {
    console.error(error)
    return c.redirect('/admin?error=github')
  }

  if (!(await isAllowed(c.env, user.login))) {
    return c.redirect(`/admin?${new URLSearchParams({ error: 'denied', login: user.login })}`)
  }
  await createSession(c, { id: user.id, login: user.login, name: user.name, avatarUrl: user.avatar_url })
  return c.redirect(next)
})

app.post('/api/auth/logout', async (c) => {
  await destroySession(c)
  return c.body(null, 204)
})

export default app
