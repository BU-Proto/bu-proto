import type { ReactNode } from 'react'
import { NAV_ITEMS } from '../content/hero'
import { IconButton } from './IconButton'
import { ClockIcon, LogoMark, MenuIcon } from './icons'
import styles from './TopBar.module.css'

/** Logo, centered nav pill and the round action buttons; `children` join the actions. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className={styles.top}>
      <a className={styles.logo} href="#" data-fog-clear>
        <LogoMark />
        BU Builders
      </a>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            aria-current={item.current ? 'page' : undefined}
            data-fog-clear="box"
          >
            {item.label}
            {item.badge && (
              <span className={styles.badge} aria-hidden="true">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className={styles.actions}>
        <IconButton label="Upcoming events" variant="solid">
          <ClockIcon />
        </IconButton>
        <IconButton label="Menu">
          <MenuIcon />
        </IconButton>
        {children}
      </div>
    </header>
  )
}
