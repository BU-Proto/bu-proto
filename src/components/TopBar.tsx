import { useRef } from 'react'
import { Link, NavLink } from 'react-router'
import { BRAND, NAV_ITEMS } from '../content/site'
import { Glass } from './Glass'
import { MenuSheet } from './MenuSheet'
import { NavMenu } from './NavMenu'
import { ProtoMark } from './ProtoMark'
import { useGlassLight } from './useGlassLight'
import { useNavPlate } from './useNavPlate'
import styles from './TopBar.module.css'

/**
 * The bar fixed to the top of every page, in three parts as the old site had it: Proto's mark on the
 * left, the main pages on a glass tab in the centre, and Join on its own at the right. A tab item
 * with pages under it (About) opens them in a small menu. On phones the items don't fit, so the tab
 * holds just the menu sheet, which carries every page and Join; the footer lists the rest on desktop.
 */
export function TopBar() {
  const bar = useRef<HTMLDivElement>(null)
  const nav = useRef<HTMLElement>(null)
  const plate = useRef<HTMLSpanElement>(null)
  useGlassLight(bar)
  useNavPlate(nav, plate)

  return (
    <header className={styles.top}>
      <Link className={styles.logo} to="/">
        <ProtoMark size={18} />
        {BRAND.short}
      </Link>

      <div ref={bar} className={styles.bar}>
        <Glass radius={23} bezel={18} bend={36} />
        <nav ref={nav} className={styles.nav} aria-label="Primary">
          <span ref={plate} className={styles.plate} aria-hidden="true" />
          {NAV_ITEMS.filter((item) => item.inPill).map((item) =>
            item.children ? (
              <NavMenu key={item.to} item={item} />
            ) : (
              <NavLink key={item.to} to={item.to} data-plate="">
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className={styles.menu}>
          <MenuSheet />
        </div>
      </div>

      <Link className={styles.join} to="/join">
        Join Proto
      </Link>
    </header>
  )
}
