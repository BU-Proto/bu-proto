import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { NOT_FOUND_INTRO } from '../content/notFound'
import { NAV_ITEMS } from '../content/site'
import styles from './NotFound.module.css'

// Every page once: grouped pages (About's) are listed in place of their group, and in-page
// anchors (#offer) are left out, since they aren't pages of their own.
type Page = { label: string; to: string }
const PAGES = NAV_ITEMS.flatMap((item): readonly Page[] => item.children ?? [item]).filter((item) => !item.to.includes('#'))

export function NotFound() {
  return (
    <div className={ui.page}>
      <PageIntro intro={NOT_FOUND_INTRO} />
      {/* Every page, as a short directory listing: the name, and the path it lives at. */}
      <nav aria-label="All pages">
        <ul className={styles.links}>
          {PAGES.map((item) => (
            <li key={item.to}>
              <Link className={styles.link} to={item.to} data-fog-clear>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.route} aria-hidden="true">
                  {item.to}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
