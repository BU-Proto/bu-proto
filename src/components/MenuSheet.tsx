import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router'
import { BRAND, NAV_ITEMS } from '../content/site'
import { IconButton } from './IconButton'
import { CloseIcon, MenuIcon } from './icons'
import styles from './MenuSheet.module.css'

/**
 * The menu button and the sheet it opens, listing every page. A modal <dialog>, so focus,
 * Escape and the inert background come from the browser.
 */
export function MenuSheet() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { pathname } = useLocation()

  // Picking a page (or using back/forward) closes the sheet.
  useEffect(() => {
    dialogRef.current?.close()
  }, [pathname])

  return (
    <>
      <IconButton label="Menu" aria-haspopup="dialog" onClick={() => dialogRef.current?.showModal()}>
        <MenuIcon />
      </IconButton>

      <dialog
        ref={dialogRef}
        className={styles.sheet}
        aria-label="All pages"
        data-fog-ignore
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself.
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <div className={styles.inner}>
          <div className={styles.head}>
            <span className={styles.title}>
              <img src={BRAND.seal} alt="" width={20} height={20} />
              {BRAND.full}
            </span>
            <IconButton label="Close menu" onClick={() => dialogRef.current?.close()}>
              <CloseIcon />
            </IconButton>
          </div>

          <nav aria-label="All pages">
            <ol className={styles.list}>
              {NAV_ITEMS.map((item, index) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} className={styles.link}>
                    <span className={styles.index} aria-hidden="true">
                      {String(index).padStart(2, '0')}
                    </span>
                    {item.label}
                    <span className={styles.route} aria-hidden="true">
                      {item.to}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </dialog>
    </>
  )
}
