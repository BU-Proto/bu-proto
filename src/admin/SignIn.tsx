import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useLocation, useNavigate, useRevalidator, useSearchParams } from 'react-router'
import { AUTH_CHANNEL } from '../../shared/constants'
import { AsciiField, DEFAULT_FIELD_SETTINGS } from '../ascii-field'
import styles from './SignIn.module.css'
import { pageTitle } from './lib/format'

function errorMessage(error: string | null, email: string | null) {
  switch (error) {
    case null:
      return null
    case 'not-configured':
      return 'Google sign-in isn’t set up on this server yet. Whoever runs it needs to add the Google OAuth client id and secret.'
    case 'denied':
      return email
        ? `${email} isn’t a portal admin yet. Ask an admin to add that email on the Admins page, then sign in again.`
        : 'That Google account isn’t a portal admin yet. Ask an admin to add you, then sign in again.'
    case 'google':
      return 'Google didn’t finish signing you in. If you cancelled, that’s why; otherwise try again.'
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
  const message = errorMessage(error, params.get('email'))

  // Come back to this page after Google, minus the error from the last attempt.
  const next = new URLSearchParams(params)
  next.delete('error')
  next.delete('email')
  const query = next.toString()
  const href = `/api/auth/google?next=${encodeURIComponent(location.pathname + (query ? `?${query}` : ''))}`

  const navigate = useNavigate()
  const revalidator = useRevalidator()
  const popupRef = useRef<Window | null>(null)
  const [waiting, setWaiting] = useState(false)

  // The pop-up reports where to go next (the page, or /admin?error=…) and closes itself.
  useEffect(() => {
    const finish = (to: unknown) => {
      if (typeof to !== 'string' || !to.startsWith('/admin')) return
      popupRef.current?.close()
      popupRef.current = null
      setWaiting(false)
      navigate(to, { replace: true })
      revalidator.revalidate()
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === AUTH_CHANNEL) finish(event.data.to)
    }
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(AUTH_CHANNEL)
    if (channel) channel.onmessage = (event) => event.data?.type === AUTH_CHANNEL && finish(event.data.to)
    window.addEventListener('message', onMessage)
    // Back from the pop-up some other way (closed it, or a browser cut the channel): check the session.
    const onFocus = () => {
      if (popupRef.current) revalidator.revalidate()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      channel?.close()
      window.removeEventListener('message', onMessage)
      window.removeEventListener('focus', onFocus)
    }
  }, [navigate, revalidator])

  const openPopup = (event: MouseEvent<HTMLAnchorElement>) => {
    const width = 480
    const height = 640
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2)
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 3)
    const popup = window.open(
      `${href}&popup=1`,
      'proto-google-sign-in',
      `popup,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`,
    )
    // Blocked pop-ups fall through to the link's own full-page redirect.
    if (!popup) return
    event.preventDefault()
    popup.focus()
    popupRef.current = popup
    setWaiting(true)
  }

  return (
    <>
      <title>{pageTitle('Sign in')}</title>
      <AsciiField settings={DEFAULT_FIELD_SETTINGS} className={styles.field} />

      <main className={styles.screen}>
        <a className={styles.brand} href="/" data-fog-clear>
          <img className={styles.mark} src="/proto-seal.svg" alt="" width={24} height={24} />
          Proto
        </a>

        <div className={styles.card}>
          <h1 className={styles.title} data-fog-clear>
            {expired ? 'Your session ended' : 'Sign in to the portal'}
          </h1>
          <p className={styles.lede} data-fog-clear>
            {expired
              ? 'You were signed out. Sign in again to pick up where you left off; unsaved changes on this page are lost.'
              : 'Where the team updates the site and looks after members, the fund list and email. For admins only.'}
          </p>

          <div className={styles.message} role="alert">
            {message && <p className={styles.error}>{message}</p>}
          </div>

          <a className={styles.google} href={href} onClick={openPopup} data-fog-clear="box">
            <GoogleMark />
            Sign in with Google
          </a>
          <p className={styles.waiting} role="status" aria-live="polite" data-fog-clear>
            {waiting && 'Finish signing in in the Google window. It closes on its own when you’re done.'}
          </p>

          <p className={styles.fine} data-fog-clear>
            {import.meta.env.DEV
              ? 'Local dev: this signs you straight in as the first owner. Production always uses Google.'
              : 'Only Google accounts on the admin list get in. We read your name, email and photo, nothing else.'}{' '}
            See the <a href="/privacy">privacy policy</a> and <a href="/terms">terms</a>.
          </p>
        </div>

        <a className={styles.back} href="/" data-fog-clear>
          ← Back to the site
        </a>
      </main>
    </>
  )
}

/** Google's "G", in its four brand colours, as the sign-in branding guidelines require. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width={18} height={18} aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
