import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { NOT_FOUND_INTRO } from '../content/notFound'
import { NAV_ITEMS } from '../content/site'
import styles from './NotFound.module.css'

export function NotFound() {
  return (
    <div className={ui.page}>
      <PageIntro intro={NOT_FOUND_INTRO}>
        <ul className={styles.links}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link className={ui.secondary} to={item.to} data-fog-clear="box">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </PageIntro>
    </div>
  )
}
