import { Outlet, ScrollRestoration, useNavigation } from 'react-router'
import { useSmoothScroll } from '../lib/smoothScroll'
import { Footer } from './Footer'
import { TopBar } from './TopBar'
import styles from './Layout.module.css'

/** Every public page, on the one dark ground: the fixed top tab, the page and the footer. */
export function Layout() {
  useSmoothScroll()
  // Moving to a page that loads data keeps the old page up until the data lands; a line along
  // the top says the click registered.
  const navigating = useNavigation().state === 'loading'

  return (
    <>
      <div className={styles.shell} data-site="public">
        <span className={styles.progress} data-active={navigating || undefined} aria-hidden="true" />
        <TopBar />
        <main className={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
      <ScrollRestoration />
    </>
  )
}
