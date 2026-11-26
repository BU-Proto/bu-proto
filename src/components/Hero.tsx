import { Link } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { HERO_COPY, HERO_CURSORS } from '../content/home'
import { KIND_HUE } from '../content/events'
import { dateParts } from '../lib/dates'
import { eventPath } from '../lib/paths'
import ui from './ui.module.css'
import styles from './Hero.module.css'

/**
 * Collaborators' cursors drifting round the headline, as in a shared design file: a founder, an
 * engineer, a designer, all at work on the same thing. Each is a pointer and a name tag in its
 * own colour. Decoration only, so screen readers skip it; still under reduced motion.
 */
function Cursors() {
  return (
    <div className={styles.cursors} aria-hidden="true">
      {HERO_CURSORS.map((cursor, index) => (
        <span key={cursor.label} className={styles.cursor} data-tone={cursor.tone} data-n={index} data-fog-clear="box">
          <svg className={styles.pointer} viewBox="0 0 16 20">
            <path d="M1.5 1.5v14.6l3.9-3.5 2.6 5.9 2.7-1.2-2.6-5.8h5.2z" />
          </svg>
          <span className={styles.tag}>{cursor.label}</span>
        </span>
      ))}
    </div>
  )
}

/** The next thing on the calendar, as one slim card: its kind, when, what, and the way to RSVP. */
function NextUp({ event }: { event: ProtoEvent | undefined }) {
  if (!event) {
    return (
      <p className={styles.next} data-fog-clear="box">
        <span className={styles.nextLabel}>{HERO_COPY.next}</span>
        <span className={styles.nextWhat}>{HERO_COPY.nothingYet}</span>
      </p>
    )
  }
  const { day, month, weekday } = dateParts(event.date)
  return (
    <Link className={styles.next} to={eventPath(event)} data-hue={KIND_HUE[event.kind]} data-fog-clear="box">
      <span className={styles.nextLabel}>{HERO_COPY.next}</span>
      <span className={styles.nextWhen}>
        {weekday}, {month} {day}
      </span>
      <span className={styles.nextWhat}>{event.title}</span>
      <span className={styles.nextGo} aria-hidden="true">
        {HERO_COPY.rsvp} →
      </span>
    </Link>
  )
}

/**
 * The top of the home page, on the field: what Proto is, in one line, with collaborators' cursors
 * round it; who it's for; the two ways in; and the next thing on the calendar. The film is further
 * down, in its own section.
 */
export function Hero({ next }: { next?: ProtoEvent }) {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <div className={styles.headlineBox}>
          <h1 className={styles.headline} data-fog-clear>
            {HERO_COPY.headline}
          </h1>
          <Cursors />
        </div>
        <p className={styles.lede} data-fog-clear>
          {HERO_COPY.lede}
        </p>
        <div className={styles.actions}>
          {HERO_COPY.actions.map((action, index) => (
            <Link key={action.href} className={index === 0 ? ui.primary : ui.secondary} to={action.href} data-fog-clear="box">
              {action.label}
            </Link>
          ))}
        </div>
        <NextUp event={next} />
      </div>
    </section>
  )
}
