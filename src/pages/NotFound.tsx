import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../components/PageIntro'
import { Pictogram } from '../components/Pictogram'
import ui from '../components/ui.module.css'
import { NOT_FOUND_INTRO } from '../content/notFound'
import { NAV_ITEMS } from '../content/site'
import styles from './NotFound.module.css'

// Every page once: grouped pages (About's) are listed in place of their group, and in-page
// anchors (#offer) are left out, since they aren't pages of their own.
type Page = { label: string; to: string }
const PAGES = NAV_ITEMS.flatMap((item): readonly Page[] => item.children ?? [item]).filter((item) => !item.to.includes('#'))

/** The tiles take these colours in turn. */
const TONES = ['sky', 'iris', 'rose', 'amber', 'mint'] as const

/**
 * Lost: a compass on a tile of its own, then every page as a colour tile to pick from, after the
 * section tiles on brand.dropbox.com.
 */
export function NotFound() {
  return (
    <div className={ui.page}>
      <PageIntro intro={NOT_FOUND_INTRO} />
      <nav aria-label="All pages">
        <ul className={styles.links} data-grid>
          <li className={styles.compass} data-tone="iris" aria-hidden="true">
            <Pictogram name="compass" className={styles.compassPicture} />
          </li>
          {PAGES.map((item, index) => (
            <li key={item.to}>
              <Link
                className={styles.link}
                to={item.to}
                data-tone={TONES[index % TONES.length]}
                style={{ '--i': index } as CSSProperties}
              >
                <span className={styles.label}>{item.label}</span>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
