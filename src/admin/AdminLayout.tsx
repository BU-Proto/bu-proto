import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  isRouteErrorResponse,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigation,
  useNavigationType,
  useRouteError,
} from 'react-router'
import type { Me, Stats } from '../../shared/api'
import { api, ApiError } from '../lib/api'
import styles from './AdminLayout.module.css'
import admin from './admin.module.css'
import { CommandMenu } from './components/CommandMenu'
import { ArrowOutIcon, CloseIcon, MenuIcon, SearchIcon, SelectorIcon, SignOutIcon } from './components/icons'
import { Kbd } from './components/Kbd'
import { ToastProvider } from './components/Toasts'
import { BarContext } from './lib/bar'
import { pageTitle } from './lib/format'
import { COMMAND_KEYS } from './lib/keys'
import { useToast } from './lib/toast'
import { isUnauthorized, messageFor, SessionContext } from './lib/session'
import type { layoutLoader } from './loaders'
import { NAV, type NavItem } from './nav'
import { SignIn } from './SignIn'

export function Component() {
  const { me, stats } = useLoaderData<typeof layoutLoader>()
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
      <div className={styles.shell}>
        <ToastProvider>
          <Shell me={session.me} stats={stats} />
        </ToastProvider>
      </div>
    </SessionContext>
  )
}

function Shell({ me, stats }: { me: Me; stats: Stats | null }) {
  const navigation = useNavigation()
  const navigationType = useNavigationType()
  const { pathname } = useLocation()
  const toast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [bar, setBar] = useState<HTMLElement | null>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
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

  // ⌘K on a Mac, Ctrl+K elsewhere, from anywhere in the portal, text fields included.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      event.preventDefault()
      setCommandOpen((open) => !open)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The page scrolls inside the sheet on a laptop, so a new page starts at its top. Back and
  // forward are left where the browser puts them.
  useEffect(() => {
    if (navigationType !== 'POP') sheet.current?.scrollTo(0, 0)
  }, [pathname, navigationType])

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch (error) {
      // Already signed out is as good as signing out.
      if (!isUnauthorized(error)) {
        toast({ tone: 'error', text: 'Couldn’t sign out', detail: messageFor(error) })
        return
      }
    }
    // A full load drops every bit of in-memory admin data along with the session.
    window.location.assign('/admin')
  }, [toast])

  const openCommand = () => {
    setMenuOpen(false)
    setCommandOpen(true)
  }

  return (
    <>
      <a className={styles.skip} href="#admin-main">
        Skip to content
      </a>
      <div className={styles.progress} data-active={loading || undefined} aria-hidden="true" />

      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} to="/admin" onClick={close}>
            {/* The site's sail, as a file: a flat filled mark, the same one the favicon carries. */}
            <img className={styles.mark} src="/proto-seal.svg" alt="" width={24} height={24} />
            <span className={styles.brandName}>Proto</span>
            <span className={styles.brandSub}>Admin</span>
          </Link>
          <div className={styles.brandTools}>
            <button type="button" className={styles.iconButton} aria-label="Search the portal" onClick={openCommand}>
              <SearchIcon />
            </button>
            <button
              ref={menuButton}
              type="button"
              className={styles.iconButton}
              aria-expanded={menuOpen}
              aria-controls="admin-menu"
              aria-label={menuOpen ? 'Close menu' : 'Menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div id="admin-menu" className={styles.menu} data-open={menuOpen || undefined}>
          {/* Looks like a search box, opens the command menu: one way to get anywhere. */}
          <button type="button" className={styles.search} onClick={openCommand}>
            <SearchIcon className={styles.searchIcon} />
            <span className={styles.searchLabel}>Search</span>
            <Kbd>{COMMAND_KEYS}</Kbd>
          </button>

          <Nav pathname={pathname} badges={{ '/admin/fund': stats?.fundNew ?? 0 }} onNavigate={close} />

          <Account me={me} onSignOut={signOut} />
        </div>
      </aside>

      <div ref={sheet} className={styles.sheet}>
        {/* Each page fills this through PageHeader: its heading, its tabs and its buttons. */}
        <header ref={setBar} className={styles.bar} />
        <BarContext value={bar}>
          <main id="admin-main" className={styles.main} aria-busy={loading || undefined} tabIndex={-1}>
            {/* Keyed by path, so each page arrives fresh (and fades in once). */}
            <div key={pathname} className={styles.page}>
              <Outlet />
            </div>
          </main>
        </BarContext>
      </div>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} onSignOut={signOut} />
    </>
  )
}

/**
 * The sidebar's links. One lit block marks the current section and slides to the next one when
 * the page changes, so the eye follows where it went.
 */
function Nav({ pathname, badges, onNavigate }: { pathname: string; badges: Record<string, number>; onNavigate: () => void }) {
  const nav = useRef<HTMLElement>(null)
  const [glider, setGlider] = useState<{ top: number; height: number } | null>(null)
  // The first placement is a jump, not a slide in from the top.
  const [settled, setSettled] = useState(false)

  useLayoutEffect(() => {
    const element = nav.current
    if (!element) return
    const place = () => {
      const current = element.querySelector<HTMLElement>('a[aria-current="page"]')
      setGlider(current ? { top: current.offsetTop, height: current.offsetHeight } : null)
    }
    place()
    // Sizes change when the phone menu opens or the window crosses a breakpoint.
    const observer = new ResizeObserver(place)
    observer.observe(element)
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <nav ref={nav} aria-label="Portal" className={styles.nav}>
      <span
        className={styles.glider}
        data-settled={settled || undefined}
        hidden={!glider}
        style={glider ? { transform: `translateY(${glider.top}px)`, height: glider.height } : undefined}
        aria-hidden="true"
      />
      {NAV.map((group, index) => (
        <div key={group.label ?? index} className={styles.navGroup}>
          {group.label && (
            <p className={styles.navLabel} id={`nav-${group.label.toLowerCase()}`}>
              {group.label}
            </p>
          )}
          <ul className={styles.navList} aria-labelledby={group.label ? `nav-${group.label.toLowerCase()}` : undefined}>
            {group.items.map((item) => (
              <NavEntry key={item.to} item={item} badge={badges[item.to] ?? 0} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function NavEntry({ item, badge, onNavigate }: { item: NavItem; badge: number; onNavigate: () => void }) {
  // Words only: the sidebar is a short list of plain names. (The command menu keeps each page's icon.)
  return (
    <li>
      <NavLink to={item.to} end={item.end} className={styles.navLink} onClick={onNavigate}>
        <span className={styles.navText}>{item.label}</span>
        {badge > 0 && (
          <span className={styles.navBadge}>
            {badge}
            <span className={styles.srOnly}> new</span>
          </span>
        )}
      </NavLink>
    </li>
  )
}

/** Who's signed in, at the foot of the sidebar; the row opens a small menu with the ways out. */
function Account({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // The phone menu listens for Escape too; this one is the inner layer, so it closes alone.
      event.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  // Arrow keys walk the menu, as they do in a native one.
  function onMenuKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    const at = items.indexOf(document.activeElement as HTMLElement)
    items[(at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
  }

  const name = me.name ?? me.email.split('@')[0]

  return (
    <div ref={root} className={styles.account}>
      {open && (
        <div className={styles.accountMenu} role="menu" aria-label="Account" onKeyDown={onMenuKey}>
          <p className={styles.accountEmail} title={me.email}>
            {me.email}
          </p>
          <a className={styles.menuItem} role="menuitem" href="/" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            <ArrowOutIcon />
            View the site
            <span className={styles.srOnly}>(opens in a new tab)</span>
          </a>
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true)
              void Promise.resolve(onSignOut()).finally(() => setSigningOut(false))
            }}
          >
            <SignOutIcon />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
      <button
        ref={trigger}
        type="button"
        className={styles.accountButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {me.avatarUrl ? (
          <img className={styles.avatar} src={me.avatarUrl} alt="" width={28} height={28} />
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className={styles.userText}>
          <span className={styles.userName}>{name}</span>
          {me.name && <span className={styles.userEmail}>{me.email}</span>}
        </span>
        <SelectorIcon className={styles.accountChevron} />
      </button>
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
      <title>{pageTitle('Error')}</title>
      <div className={admin.callout} role="alert">
        <h2>The portal couldn’t start.</h2>
        <p>{message || 'Something went wrong.'}</p>
        {status && <p className={admin.dim}>HTTP {status}</p>}
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
