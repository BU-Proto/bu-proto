import { Link, NavLink } from 'react-router'
import { BRAND, NAV_ITEMS } from '../content/site'
import { MenuSheet } from './MenuSheet'
import ui from './ui.module.css'
import styles from './TopBar.module.css'

/**
 * Seal and name, the centered nav pill, and Join on the right. On phones the pill doesn't fit, so
 * the menu sheet takes Join's place and carries every page; the footer lists the rest on desktop.
 */
export function TopBar() {
  return (
    <header className={styles.top}>
      <Link className={styles.logo} to="/" data-fog-clear>
        {/* A filled flat mark: shown as-is, not through the stroked icon helper. */}
        <img src={BRAND.seal} alt="" width={24} height={24} />
        {BRAND.short}
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.filter((item) => item.inPill).map((item) => (
          <NavLink key={item.to} to={item.to} data-fog-clear="box">
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        <Link className={`${ui.primary} ${styles.join}`} to="/join" data-fog-clear="box">
          Join Proto
        </Link>
        <div className={styles.menu}>
          <MenuSheet />
        </div>
      </div>
    </header>
  )
}
