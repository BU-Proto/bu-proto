import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { navItemHolds, type NavItem } from '../content/site'
import styles from './NavMenu.module.css'

/**
 * A pill item with pages under it: a disclosure button that opens a short list of links. Click
 * or Enter opens it; the arrow keys, Home and End move through the links, Tab moves on as usual,
 * and Escape, a click outside or focus leaving it closes it. Not a role="menu": these are links.
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
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={id}
        data-current={current || undefined}
        data-fog-clear="box"
        onClick={() => setOpen(!open)}
        onKeyDown={onButtonKey}
      >
        {item.label}
        {current && <span className={styles.srOnly}>, current section</span>}
        <svg className={styles.chevron} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={id} className={styles.panel} hidden={!open} data-fog-ignore>
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
