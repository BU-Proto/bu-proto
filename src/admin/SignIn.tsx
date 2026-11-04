import { useLocation, useSearchParams } from 'react-router'
import { AsciiField, DEFAULT_FIELD_SETTINGS } from '../ascii-field'
import styles from './SignIn.module.css'
import { pageTitle } from './lib/format'

/** What the portal covers, shown as chips so people know they're in the right place. */
const AREAS = ['Events', 'Hackathons', 'Wins', 'Board', 'Members', 'Fund', 'Email'] as const

function errorMessage(error: string | null, login: string | null) {
  switch (error) {
    case null:
      return null
    case 'not-configured':
      return 'GitHub sign-in isn’t set up on this server yet. Whoever runs it needs to add the GitHub OAuth app’s client id and secret.'
    case 'denied':
      return login
        ? `@${login} isn’t a portal admin yet. Ask an admin to add you on the Admins page, then sign in again.`
        : 'That GitHub account isn’t a portal admin yet. Ask an admin to add you, then sign in again.'
    case 'github':
      return 'GitHub didn’t finish signing you in. It’s usually a one-off: try again.'
    default:
      return 'Signing in didn’t work. Try again.'
  }
}

/**
 * Shown at /admin/* whenever nobody is signed in, including after a session runs out. It's the
 * one portal screen with the site's ASCII field behind it: the door still looks like Proto.
 */
export function SignIn({ expired = false }: { expired?: boolean }) {
  const location = useLocation()
  const [params] = useSearchParams()
  const error = params.get('error')
  const message = errorMessage(error, params.get('login'))

  // Come back to this page after GitHub, minus the error from the last attempt.
  const next = new URLSearchParams(params)
  next.delete('error')
  next.delete('login')
  const query = next.toString()
  const href = `/api/auth/github?next=${encodeURIComponent(location.pathname + (query ? `?${query}` : ''))}`

  return (
    <>
      <title>{pageTitle('Sign in')}</title>
      <AsciiField settings={DEFAULT_FIELD_SETTINGS} className={styles.field} />

      <main className={styles.screen}>
        <a className={styles.brand} href="/" data-fog-clear>
          <img src="/proto-seal.svg" alt="" width={22} height={22} />
          Proto
        </a>

        <div className={styles.card}>
          <div className={styles.handle} aria-hidden="true" />

          <p className={styles.path} data-fog-clear>
            ~/proto/admin
            <span className={styles.caret} aria-hidden="true">
              _
            </span>
          </p>

          <h1 className={styles.title} data-fog-clear>
            {expired ? 'Your session ended' : 'Sign in to the portal'}
          </h1>
          <p className={styles.lede} data-fog-clear>
            {expired
              ? 'You were signed out. Sign in again to pick up where you left off; unsaved changes on this page are lost.'
              : 'Where the team runs Proto. For admins only.'}
          </p>

          {!expired && (
            <ul className={styles.areas} aria-label="In the portal">
              {AREAS.map((area) => (
                <li key={area} data-fog-clear>
                  {area}
                </li>
              ))}
            </ul>
          )}

          <div className={styles.message} role="alert">
            {message && <p className={styles.error}>{message}</p>}
          </div>

          <a className={styles.github} href={href} data-fog-clear="box">
            <GitHubMark />
            Sign in with GitHub
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </a>

          <p className={styles.fine} data-fog-clear>
            {import.meta.env.DEV
              ? 'Local dev: this signs you straight in as the first owner. Production always uses GitHub.'
              : 'Only GitHub accounts on the admin list get in. We read your public profile and nothing else.'}
          </p>
        </div>

        <a className={styles.back} href="/" data-fog-clear>
          ← Back to the site
        </a>
      </main>
    </>
  )
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
