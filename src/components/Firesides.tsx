import { Link } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { FIRESIDES } from '../content/events'
import { dateParts, daysUntil, formatMonth } from '../lib/dates'
import { eventPath } from '../lib/paths'
import { SampleTag } from './SampleTag'
import ui from './ui.module.css'
import styles from './Firesides.module.css'

/** A fireside: filed as one, or one of the panels from before the kind existed, named so in its title. */
const isFireside = (event: ProtoEvent) => event.kind === 'Fireside' || (event.kind === 'Panel' && /fireside/i.test(event.title))

/**
 * The firesides, as light tiles: the ones coming up first, soonest first, in iris with ink of the
 * same hue, then the past ones, newest first, quieter. Each tile is a link to the event's page.
 * Only what the calendar says: the date, the title and the place.
 */
export function Firesides({ events }: { events: readonly ProtoEvent[] }) {
  const firesides = events.filter(isFireside)
  const upcoming = firesides.filter((event) => daysUntil(event.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))
  const past = firesides.filter((event) => daysUntil(event.date) < 0).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section id={FIRESIDES.id} className={styles.firesides} aria-labelledby="firesides-title">
      <header className={styles.head}>
        <h2 id="firesides-title" className={ui.sectionTitle} data-fog-clear>
          {FIRESIDES.title}
        </h2>
        <p className={styles.lede} data-fog-clear>
          {FIRESIDES.lede}
        </p>
      </header>

      {firesides.length === 0 ? (
        <p className={styles.empty} data-fog-clear>
          {FIRESIDES.empty}{' '}
          <Link className={ui.textLink} to={FIRESIDES.join.href}>
            {FIRESIDES.join.label}
          </Link>
        </p>
      ) : (
        <ol className={styles.grid}>
          {[...upcoming, ...past].map((event) => {
            const soon = daysUntil(event.date) >= 0
            const { day, monthLong } = dateParts(event.date)
            return (
              <li key={event.id} className={styles.tile} data-tone={soon ? 'iris' : undefined} data-past={soon ? undefined : ''}>
                <p className={styles.tag}>{soon ? FIRESIDES.upcoming : FIRESIDES.past}</p>
                <p className={styles.date}>
                  <span className={styles.day}>{day}</span>
                  <span className={styles.month}>
                    {monthLong} {formatMonth(event.date).split(' ').at(-1)}
                  </span>
                </p>
                <h3 className={styles.title}>
                  {/* Stretched over the tile, so a click anywhere opens the event's page. */}
                  <Link className={styles.link} to={eventPath(event)}>
                    {event.title}
                  </Link>
                  <SampleTag show={event.placeholder} />
                </h3>
                <p className={styles.place}>{event.place}</p>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
