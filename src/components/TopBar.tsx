import { Link, NavLink } from 'react-router'
import { BRAND, NAV_ITEMS } from '../content/site'
import { IconLink } from './IconButton'
import { ClockIcon } from './icons'
import { MenuSheet } from './MenuSheet'
import styles from './TopBar.module.css'

/** Seal and name, the centered nav pill, and the round action buttons. */
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
            {item.badge && (
              <span className={styles.badge} aria-hidden="true">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.actions}>
        <IconLink to="/events" label="Upcoming events" variant="solid">
          <ClockIcon />
        </IconLink>
        <MenuSheet />
      </div>
    </header>
  )
}
