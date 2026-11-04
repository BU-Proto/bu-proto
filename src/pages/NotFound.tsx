import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { NOT_FOUND_INTRO } from '../content/notFound'
import { NAV_ITEMS } from '../content/site'
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <div className={ui.page}>
      <PageIntro intro={NOT_FOUND_INTRO} />
      {/* Every page, as a short directory listing: the name, and the path it lives at. */}
      <nav aria-label="All pages">
        <ul className={styles.links}>
          {NAV_ITEMS.map((item) => (
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
