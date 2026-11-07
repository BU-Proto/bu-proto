import { Link, NavLink } from 'react-router'
import { BRAND, NAV_ITEMS } from '../content/site'
import { Glass } from './Glass'
import { MenuSheet } from './MenuSheet'
import { NavMenu } from './NavMenu'
import { ProtoMark } from './ProtoMark'
import styles from './TopBar.module.css'

/**
 * The glass tab fixed to the top centre of every page: Proto's mark, the main pages, and Join. A tab
 * item with pages under it (About) opens them in a small menu. On phones the items don't fit, so the
 * menu sheet takes their place and carries every page; the footer lists the rest on desktop.
 */
export function TopBar() {
  return (
    <header className={styles.top}>
      <Glass radius={23} bezel={21} bend={44} />
      <Link className={styles.logo} to="/">
        <ProtoMark size={18} />
        {BRAND.short}
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.filter((item) => item.inPill).map((item) =>
          item.children ? (
            <NavMenu key={item.to} item={item} />
          ) : (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      <Link className={styles.join} to="/join">
        Join Proto
      </Link>
      <div className={styles.menu}>
        <MenuSheet />
      </div>
    </header>
  )
}
