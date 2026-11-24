import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { GroupTabs } from '../components/GroupTabs'
import { PageIntro } from '../components/PageIntro'
import ui from '../components/ui.module.css'
import { COMPETITIONS, COMPETITIONS_INTRO, COMPETITIONS_PAGE, type Competition } from '../content/competitions'
import { daysUntil } from '../lib/dates'
import styles from './PitchCompetitions.module.css'

/** Upcoming firm deadlines first (soonest first), then the rest in the order they're listed. */
function byDeadline(list: readonly Competition[]): Competition[] {
  const open = (item: Competition) => (item.deadline && daysUntil(item.deadline) >= 0 ? item.deadline : null)
  return [...list].sort((a, b) => {
    const da = open(a)
    const db = open(b)
    if (da && db) return da.localeCompare(db)
    if (da) return -1
    if (db) return 1
    return 0
  })
}

/** One competition: who can enter on its colour, what it is, the dates, and the way out. */
function Entry({ item, index }: { item: Competition; index: number }) {
  const days = item.deadline ? daysUntil(item.deadline) : -1
  return (
    <li className={styles.entry} data-tone={item.tone} style={{ '--n': index } as CSSProperties}>
      <div className={styles.tags}>
        <span className={styles.who}>{item.who}</span>
        {item.practice && <span className={styles.practice}>{COMPETITIONS_PAGE.practice}</span>}
        {days >= 0 && <span className={styles.left}>{COMPETITIONS_PAGE.left(days)}</span>}
      </div>
      <h3 className={styles.name}>{item.name}</h3>
      <p className={styles.host}>{item.host}</p>
      <p className={styles.offer}>{item.offer}</p>
      <p className={styles.dates}>{item.dates}</p>
      <a className={styles.official} href={item.href} target="_blank" rel="noopener noreferrer">
        {COMPETITIONS_PAGE.official}
        <span aria-hidden="true"> ↗</span>
        <span className={ui.srOnly}> for {item.name} (opens in a new tab)</span>
      </a>
    </li>
  )
}

/**
 * The Business group's pitch competitions, its answer to the CS group's hackathons: the ones open
 * to anyone first, then each school's own, as tiles on the hairline grid with who can enter on
 * the tile's colour and days left where a deadline is set.
 */
export function PitchCompetitions() {
  const open = byDeadline(COMPETITIONS.filter((item) => item.open))
  const schools = byDeadline(COMPETITIONS.filter((item) => !item.open))
  return (
    <div className={ui.page}>
      <GroupTabs group="business" />
      <PageIntro intro={COMPETITIONS_INTRO} />

      <section className={styles.section} aria-labelledby="open-to-anyone" data-grid>
        <header className={styles.head}>
          <h2 id="open-to-anyone" className={styles.title}>
            {COMPETITIONS_PAGE.open.title}
          </h2>
          <p className={styles.lede}>{COMPETITIONS_PAGE.open.lede}</p>
        </header>
        <ul className={styles.grid}>
          {open.map((item, index) => (
            <Entry key={item.name} item={item} index={index} />
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="at-a-school" data-grid>
        <header className={styles.head}>
          <h2 id="at-a-school" className={styles.title}>
            {COMPETITIONS_PAGE.schools.title}
          </h2>
          <p className={styles.lede}>{COMPETITIONS_PAGE.schools.lede}</p>
        </header>
        <ul className={styles.grid}>
          {schools.map((item, index) => (
            <Entry key={item.name} item={item} index={index} />
          ))}
        </ul>
      </section>

      <p className={styles.note}>{COMPETITIONS_PAGE.note}</p>
      <p className={styles.outro}>
        {COMPETITIONS_PAGE.outro.text}{' '}
        <Link className={ui.textLink} to={COMPETITIONS_PAGE.outro.link.href}>
          {COMPETITIONS_PAGE.outro.link.label}
        </Link>
      </p>
    </div>
  )
}
