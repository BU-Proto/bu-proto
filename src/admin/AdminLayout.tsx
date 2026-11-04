import { useCallback, useMemo, useState } from 'react'
import {
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
  useRouteError,
} from 'react-router'
import type { Me } from '../../shared/api'
import { api, ApiError } from '../lib/api'
import styles from './AdminLayout.module.css'
import admin from './admin.module.css'
import { ArrowOutIcon, CloseIcon, MenuIcon } from './components/icons'
import { pageTitle } from './lib/format'
import { isUnauthorized, messageFor, SessionContext } from './lib/session'
import type { layoutLoader } from './loaders'
import { SignIn } from './SignIn'

// Grouped the way people think about the portal: what's on the site, who's signed up, who runs it.
const NAV: readonly NavGroup[] = [
  { items: [{ to: '/admin', label: 'Dashboard', end: true }] },
  {
    label: 'Site',
    items: [
      { to: '/admin/events', label: 'Events', sub: [{ to: '/admin/events/import', label: 'Import' }] },
      { to: '/admin/hackathons', label: 'Hackathons', sub: [{ to: '/admin/hackathons/import', label: 'Import' }] },
      { to: '/admin/wins', label: 'Wins' },
      { to: '/admin/board', label: 'Board' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/members', label: 'Members' },
      { to: '/admin/fund', label: 'Fund' },
      { to: '/admin/email', label: 'Email' },
    ],
  },
  { label: 'Portal', items: [{ to: '/admin/admins', label: 'Admins' }] },
]

interface NavItem {
  to: string
  label: string
  end?: boolean
  sub?: readonly NavItem[]
}

interface NavGroup {
  label?: string
  items: readonly NavItem[]
}

export function Component() {
  const { me } = useLoaderData<typeof layoutLoader>()
  // A 401 from any later call flips this, without another round trip to /me.
  const [expired, setExpired] = useState(false)
  const expire = useCallback(() => setExpired(true), [])
  const session = useMemo(() => (me ? { me, expire } : null), [me, expire])
  // The layout's own loader reruns on many navigations; if it comes back empty after a
  // signed-in visit, that's an expired session too, not a first visit.
  const [wasSignedIn, setWasSignedIn] = useState(Boolean(me))
  if (me && !wasSignedIn) setWasSignedIn(true)

  if (!session || expired) return <SignIn expired={expired || wasSignedIn} />
  return (
    <SessionContext value={session}>
      <Shell me={session.me} />
    </SessionContext>
  )
}

function Shell({ me }: { me: Me }) {
  const navigation = useNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const loading = navigation.state === 'loading'

  async function signOut() {
    setSigningOut(true)
    setSignOutError('')
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch (error) {
      // Already signed out is as good as signing out.
      if (!isUnauthorized(error)) {
        setSigningOut(false)
        setSignOutError(messageFor(error))
        return
      }
    }
    // A full load drops every bit of in-memory admin data along with the session.
    window.location.assign('/admin')
  }

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} aria-hidden="true" />
      <a className={styles.skip} href="#admin-main">
        Skip to content
      </a>
      <div className={styles.progress} data-active={loading || undefined} aria-hidden="true" />

      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} to="/admin" onClick={() => setMenuOpen(false)}>
            {/* The field's gradient in miniature, so the mark doesn't depend on an image loading. */}
            <span className={styles.mark} aria-hidden="true" />
            <span className={styles.brandText}>
              Proto <span className={styles.brandSub}>Admin</span>

            </span>
          </Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="admin-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
            <span>{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>

        <div id="admin-menu" className={styles.menu} data-open={menuOpen || undefined}>
          <nav aria-label="Portal" className={styles.navGroups}>
            {NAV.map((group, index) => (
              <div key={group.label ?? index} className={styles.navGroup}>
                {group.label && (
                  <p className={styles.navLabel} id={`nav-${group.label.toLowerCase()}`}>
                    {group.label}
                  </p>
                )}
                <ul className={styles.nav} aria-labelledby={group.label ? `nav-${group.label.toLowerCase()}` : undefined}>
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink to={item.to} end={item.end} className={styles.navLink} onClick={() => setMenuOpen(false)}>
                        {item.label}
                      </NavLink>
                      {item.sub && (
                        <ul className={styles.subNav}>
                          {item.sub.map((sub) => (
                            <li key={sub.to}>
                              <NavLink to={sub.to} className={styles.subLink} onClick={() => setMenuOpen(false)}>
                                {sub.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className={styles.account}>
            <div className={styles.user}>
              {me.avatarUrl ? (
                <img className={styles.avatar} src={me.avatarUrl} alt="" width={32} height={32} />
              ) : (
                <span className={styles.avatar} aria-hidden="true">
                  {(me.name ?? me.email).slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className={styles.userText}>
                {me.name && <span className={styles.userName}>{me.name}</span>}
                <span className={me.name ? styles.userEmail : styles.userName} title={me.email}>
                  {me.email}
                </span>
              </span>
            </div>
            <div className={styles.accountActions}>
              <a className={`${admin.ghost} ${admin.small}`} href="/" target="_blank" rel="noreferrer">
                View site <ArrowOutIcon width={13} height={13} />
                <span className={styles.srOnly}>(opens in a new tab)</span>
              </a>
              <button type="button" className={`${admin.button} ${admin.small}`} onClick={signOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
            <p className={admin.error} role="alert">
              {signOutError}
            </p>
          </div>
        </div>
      </aside>

      <main id="admin-main" className={styles.main} aria-busy={loading || undefined} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

/** /me itself failed with something other than a 401, so there's no shell to show it in. */
export function ErrorBoundary() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) || error instanceof ApiError ? error.status : undefined
  const message = isRouteErrorResponse(error) ? error.statusText : messageFor(error)
  if (!status) console.error(error)

  return (
    <main className={styles.fatal}>
      <div className={styles.backdrop} aria-hidden="true" />
      <title>{pageTitle('Error')}</title>
      <div className={admin.callout} role="alert">
        <h2>The portal couldn’t start.</h2>
        <p>{message || 'Something went wrong.'}</p>
        {status && <p className={`${admin.mono} ${admin.dim}`}>HTTP {status}</p>}
        <div className={admin.actions}>
          <button type="button" className={admin.button} onClick={() => window.location.reload()}>
            Try again
          </button>
          <a className={admin.ghost} href="/">
            Back to the site
          </a>
        </div>
      </div>
    </main>
  )
}
