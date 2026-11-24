import { Link, NavLink } from 'react-router'
import { JOIN_CTA } from '../content/home'
import { NAV_ITEMS } from '../content/site'
import { Logo } from './Logo'
import { MenuSheet } from './MenuSheet'
import { NavMenu } from './NavMenu'
import ui from './ui.module.css'
import styles from './TopBar.module.css'

/**
 * The bar at the top of every page, in the same place on all of them: the logo at the
 * left, the nav pill in the middle, Join at the right. A pill item with pages under it (About)
 * opens them in a small menu. Where the pill doesn't fit, a menu button beside Join opens a sheet
 * with every page. The bar holds its place as the page scrolls.
 */
export function TopBar() {
  return (
    <header className={styles.top}>
      <Link className={styles.logo} to="/" data-fog-clear>
        <Logo />
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.filter((item) => item.inPill).map((item) =>
          item.children ? (
            <NavMenu key={item.to} item={item} />
          ) : (
            <NavLink key={item.to} to={item.to} data-fog-clear="box">
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <div className={styles.actions}>
        <Link className={`${ui.primary} ${styles.join}`} to={JOIN_CTA.cta.href} data-fog-clear="box">
          {JOIN_CTA.cta.label}
        </Link>
        <div className={styles.menu}>
          <MenuSheet />
        </div>
      </div>
    </header>
  )
}
