import { Link, useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { EVENTS_INTRO, RSVP } from '../content/events'
import { dateParts, daysUntil, formatMonth } from '../lib/dates'
import { kindAddsInfo } from '../lib/events'
import { useRsvp } from '../lib/useRsvp'
import styles from './Events.module.css'

function EventRow({ event }: { event: ProtoEvent }) {
  const rsvp = useRsvp(event)
  const { month, day, weekday } = dateParts(event.date)

  return (
    <li className={styles.event}>
      <div className={styles.tile} data-fog-clear="box">
        <span>{month}</span>
        <b>{day}</b>
        <span>{weekday}</span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title} data-fog-clear>
          {/* Stretched over the whole row, so a click anywhere opens the event's page. */}
          <Link className={styles.rowLink} to={`/events/${event.id}`}>
            {event.title}
          </Link>
          <SampleTag show={event.placeholder} />
        </h3>
        {/* Kind, time and place, set apart by space and tone rather than separators. */}
        <p className={styles.meta} data-fog-clear>
          {kindAddsInfo(event.kind, event.title) && <span className={styles.kind}>{event.kind}</span>}
          <span>{event.time}</span>
          <span className={styles.place}>{event.place}</span>
        </p>
        {event.text && (
          <p className={styles.text} data-fog-clear>
            {event.text}
          </p>
        )}
      </div>

      <RsvpButton rsvp={rsvp} className={styles.above} />
      <RsvpForm rsvp={rsvp} className={styles.rsvp} />
    </li>
  )
}

/** Upcoming events, grouped under month headings. */
export function Events() {
  const events = useLoaderData<ProtoEvent[]>()
  const upcoming = events
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
  const months = new Map<string, ProtoEvent[]>()
  for (const event of upcoming) {
    const month = formatMonth(event.date)
    months.set(month, [...(months.get(month) ?? []), event])
  }

  return (
    <div className={ui.page}>
      <PageIntro intro={EVENTS_INTRO} />

      {months.size === 0 && (
        <p className={ui.panel} data-fog-clear>
          {RSVP.empty}
        </p>
      )}

      {[...months].map(([month, monthEvents]) => (
        <section key={month} className={styles.month} aria-label={month}>
          <h2 className={styles.monthName} data-fog-clear>
            {month}
          </h2>
          <ol className={`${ui.panel} ${styles.list}`}>
            {monthEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
