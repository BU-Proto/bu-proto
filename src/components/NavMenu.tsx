import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { navItemHolds, type NavItem } from '../content/site'
import styles from './NavMenu.module.css'

/** How long the panel waits after the pointer leaves before it closes, so a slightly crooked path
 * from the trigger down to a link doesn't drop it. */
const CLOSE_DELAY = 180

/**
 * A tab item with pages under it. Its name is a link to its own page, like the tab's other
 * links; beside it a chevron button opens a short list of the pages under it. With a mouse the
 * list opens on hover over either and closes shortly after the pointer leaves. Clicking the chevron
 * or ArrowDown/ArrowUp on either opens it; the arrow keys, Home and End move through the links, Tab
 * moves on as usual, and Escape, a click outside or focus leaving it closes it. Not a role="menu":
 * these are links.
 */
export function NavMenu({ item }: { item: NavItem }) {
  const { pathname, key } = useLocation()
  // Open only at the location it was opened at, so picking a page (or going back) closes it.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === key
  const setOpen = (next: boolean) => setOpenAt(next ? key : null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const current = navItemHolds(item, pathname)
  const links = () => [...(listRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])]
  // Whether a mouse is over it, so a click on the trigger while hovering doesn't shut what the
  // hover just opened. Touch and pens fire no hover, so they open and close with a tap as before.
  const hovering = useRef(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const cancelClose = () => window.clearTimeout(closeTimer.current)

  useEffect(() => cancelClose, [])

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenAt(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const focusLink = (which: 'first' | 'last') => {
    // The panel is hidden until the open state renders, so wait a frame before focusing in it.
    requestAnimationFrame(() => {
      const all = links()
      all[which === 'first' ? 0 : all.length - 1]?.focus()
    })
  }

  const onButtonKey = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    setOpen(true)
    focusLink(event.key === 'ArrowDown' ? 'first' : 'last')
  }

  const onListKey = (event: KeyboardEvent) => {
    const all = links()
    const at = all.indexOf(document.activeElement as HTMLAnchorElement)
    const go = (index: number) => {
      event.preventDefault()
      all[(index + all.length) % all.length]?.focus()
    }
    if (event.key === 'ArrowDown') go(at + 1)
    else if (event.key === 'ArrowUp') go(at - 1)
    else if (event.key === 'Home') go(0)
    else if (event.key === 'End') go(all.length - 1)
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return
        hovering.current = true
        cancelClose()
        setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return
        hovering.current = false
        cancelClose()
        closeTimer.current = window.setTimeout(() => {
          // Keyboard focus inside keeps it open; only the pointer leaving closes it.
          if (!rootRef.current?.contains(document.activeElement) || document.activeElement === buttonRef.current) setOpenAt(null)
        }, CLOSE_DELAY)
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        event.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }}
      onBlur={(event) => {
        // Tabbing past the last link (or back before the button) closes it.
        if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className={styles.trigger} data-open={open || undefined} data-current={current || undefined}>
        <Link
          className={styles.label}
          to={item.to}
          aria-current={pathname === item.to ? 'page' : undefined}
          onClick={() => setOpen(false)}
          onKeyDown={onButtonKey}
        >
          {item.label}
          {current && <span className={styles.srOnly}>, current section</span>}
        </Link>
        <button
          ref={buttonRef}
          type="button"
          className={styles.toggle}
          aria-label={`More in ${item.label}`}
          aria-expanded={open}
          aria-controls={id}
          // A mouse click while hovering keeps it open; a keyboard click (detail 0) or a tap toggles.
          onClick={(event) => setOpen(event.detail > 0 && hovering.current ? true : !open)}
          onKeyDown={onButtonKey}
        >
          <svg className={styles.chevron} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div id={id} className={styles.panel} hidden={!open}>
        <ul ref={listRef} className={styles.list} onKeyDown={onListKey}>
          {item.children?.map((child) => {
            const [path, anchor] = child.to.split('#')
            // A section of a page is never the page itself, so only the plain path is current.
            const here = !anchor && path === pathname
            return (
              <li key={child.to}>
                <Link
                  className={styles.link}
                  to={child.to}
                  aria-current={here ? 'page' : undefined}
                  // Following a link always makes a new location, but close at once anyway, so
                  // the panel doesn't linger while a page with a loader fetches.
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.name}>{child.label}</span>
                  <span className={styles.line}>{child.line}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
