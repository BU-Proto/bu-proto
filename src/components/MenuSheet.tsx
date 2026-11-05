import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
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
  const { pathname, hash } = useLocation()
  const close = () => dialogRef.current?.close()

  // Picking a page or a section of one (or using back/forward) closes the sheet.
  useEffect(() => {
    dialogRef.current?.close()
  }, [pathname, hash])

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
            <IconButton label="Close menu" onClick={close}>
              <CloseIcon />
            </IconButton>
          </div>

          <nav aria-label="All pages">
            <ol className={styles.list}>
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  // A group: its name, then its pages set smaller under it.
                  <li key={item.to} className={styles.group}>
                    <span id={`group-${item.label}`} className={styles.groupName}>
                      {item.label}
                    </span>
                    <ul className={styles.children} aria-labelledby={`group-${item.label}`}>
                      {item.children.map((child) => {
                        const [path, anchor] = child.to.split('#')
                        // A section isn't the page itself, so only the plain path is current.
                        const here = !anchor && path === pathname
                        return (
                          <li key={child.to}>
                            <Link
                              to={child.to}
                              className={`${styles.link} ${styles.child}`}
                              aria-current={here ? 'page' : undefined}
                              onClick={close}
                            >
                              <span className={styles.label}>{child.label}</span>
                              <span className={styles.route} aria-hidden="true">
                                {child.to}
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ) : (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.to === '/'} className={styles.link} onClick={close}>
                      <span className={styles.label}>{item.label}</span>
                      <span className={styles.route} aria-hidden="true">
                        {item.to}
                      </span>
                    </NavLink>
                  </li>
                ),
              )}
            </ol>
          </nav>
        </div>
      </dialog>
    </>
  )
}
