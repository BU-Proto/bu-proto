import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
import {
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigation,
  useRouteError,
} from 'react-router'
import type { Me } from '../../shared/api'
import { api, ApiError } from '../lib/api'
import styles from './AdminLayout.module.css'
import admin from './admin.module.css'
import {
  ArrowOutIcon,
  CalendarIcon,
  ChevronDownIcon,
  CloseIcon,
  CodeIcon,
  CoinIcon,
  HomeIcon,
  KeyIcon,
  MailIcon,
  MenuIcon,
  PeopleIcon,
  SeatIcon,
  TrophyIcon,
} from './components/icons'
import { pageTitle } from './lib/format'
import { isUnauthorized, messageFor, SessionContext } from './lib/session'
import type { layoutLoader } from './loaders'
import { SignIn } from './SignIn'

// Grouped the way people think about the portal: what's on the site, who's signed up, who runs it.
const NAV: readonly NavGroup[] = [
  { items: [{ to: '/admin', label: 'Dashboard', icon: HomeIcon, end: true }] },
  {
    label: 'Site',
    items: [
      { to: '/admin/events', label: 'Events', icon: CalendarIcon, sub: [{ to: '/admin/events/import', label: 'Import' }] },
      { to: '/admin/hackathons', label: 'Hackathons', icon: CodeIcon, sub: [{ to: '/admin/hackathons/import', label: 'Import' }] },
      { to: '/admin/wins', label: 'Wins', icon: TrophyIcon, sub: [{ to: '/admin/wins/import', label: 'Import' }] },
      { to: '/admin/board', label: 'Board', icon: SeatIcon, sub: [{ to: '/admin/board/interest', label: 'Interest' }] },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/members', label: 'Members', icon: PeopleIcon },
      { to: '/admin/fund', label: 'Fund', icon: CoinIcon },
      { to: '/admin/email', label: 'Email', icon: MailIcon, sub: [{ to: '/admin/email/automatic', label: 'Automatic' }] },
    ],
  },
  { label: 'Portal', items: [{ to: '/admin/admins', label: 'Admins', icon: KeyIcon }] },
]

interface NavItem {
  to: string
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
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
  const menuButton = useRef<HTMLButtonElement>(null)
  const { isOpen, toggle } = useNavGroups()
  const loading = navigation.state === 'loading'
  const close = () => setMenuOpen(false)

  // On a phone the open menu covers the page, so Escape closes it like any other sheet.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      menuButton.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

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
      <a className={styles.skip} href="#admin-main">
        Skip to content
      </a>
      <div className={styles.progress} data-active={loading || undefined} aria-hidden="true" />

      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} to="/admin" onClick={close}>
            {/* The site's sail, as a file: a flat filled mark, the same one the favicon carries. */}
            <img className={styles.mark} src="/proto-seal.svg" alt="" width={26} height={26} />
            <span className={styles.brandName}>Proto</span>
            <span className={styles.brandSub}>Admin</span>
          </Link>
          <button
            ref={menuButton}
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
                    <NavEntry key={item.to} item={item} open={isOpen(item)} onToggle={() => toggle(item)} onNavigate={close} />
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className={styles.account}>
            <div className={styles.user}>
              {me.avatarUrl ? (
                <img className={styles.avatar} src={me.avatarUrl} alt="" width={28} height={28} />
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

const OPEN_KEY = 'proto-admin-nav-open'

const within = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`)

function readOpen(): Record<string, boolean> {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(OPEN_KEY) ?? '{}')
    return saved && typeof saved === 'object' ? (saved as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

/** Arriving on a sub-page reopens its group, so the current page is never hidden in a closed one. */
function reopenFor(pathname: string, saved: Record<string, boolean>) {
  const hidden = NAV.flatMap((group) => group.items).find(
    (item) => saved[item.to] === false && item.sub?.some((sub) => within(pathname, sub.to)),
  )
  return hidden ? { ...saved, [hidden.to]: true } : saved
}

/**
 * Which groups with sub-pages are expanded. Untouched, a group is open while you're in it and
 * closed otherwise; once someone opens or closes one, that choice holds for the session so the
 * sidebar doesn't rearrange itself on every navigation.
 */
function useNavGroups() {
  const { pathname } = useLocation()
  const [saved, setSaved] = useState(() => reopenFor(pathname, readOpen()))

  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    const next = reopenFor(pathname, saved)
    if (next !== saved) setSaved(next)
  }

  const isOpen = (item: NavItem) => saved[item.to] ?? within(pathname, item.to)

  const toggle = (item: NavItem) => {
    const next = { ...saved, [item.to]: !isOpen(item) }
    setSaved(next)
    try {
      sessionStorage.setItem(OPEN_KEY, JSON.stringify(next))
    } catch {
      // Private mode can refuse storage; the toggle still works for this page.
    }
  }

  return { isOpen, toggle }
}

/** One sidebar link, and for a section with sub-pages, the chevron that shows or hides them. */
function NavEntry({ item, open, onToggle, onNavigate }: { item: NavItem; open: boolean; onToggle: () => void; onNavigate: () => void }) {
  const { icon: Icon, sub } = item
  const listId = `nav-sub-${item.to.split('/').pop()}`
  return (
    <li className={styles.navItem} data-open={(sub && open) || undefined}>
      <div className={styles.navRow}>
        <NavLink to={item.to} end={item.end} className={styles.navLink} onClick={onNavigate}>
          {Icon && <Icon className={styles.navIcon} />}
          {item.label}
        </NavLink>
        {sub && (
          <button
            type="button"
            className={styles.disclosure}
            aria-expanded={open}
            aria-controls={listId}
            aria-label={`${item.label} pages`}
            onClick={onToggle}
          >
            <ChevronDownIcon className={styles.chevron} />
          </button>
        )}
      </div>
      {sub && (
        // inert while closed, so its links drop out of the tab order and the accessibility tree
        // while the height animates shut.
        <div id={listId} className={styles.subWrap} inert={!open}>
          <ul className={styles.subNav}>
            {sub.map((child) => (
              <li key={child.to}>
                <NavLink to={child.to} className={styles.subLink} onClick={onNavigate}>
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
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
