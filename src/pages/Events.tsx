import { useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { EVENTS, EVENTS_INTRO, RSVP, type ProtoEvent } from '../content/events'
import { dateParts, daysUntil, formatMonth } from '../lib/dates'
import styles from './Events.module.css'

function EventRow({ event }: { event: ProtoEvent }) {
  // RSVPs aren't stored anywhere yet: the button only remembers the click until you leave.
  const [going, setGoing] = useState(false)
  const { month, day, weekday } = dateParts(event.date)

  return (
    <li className={styles.event}>
      <div className={styles.tile} data-fog-clear="box">
        <span className={styles.tileMonth}>{month}</span>
        <b>{day}</b>
        <span>{weekday}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.kind} data-kind={event.kind} data-fog-clear>
          {event.kind} <SampleTag show={event.placeholder} />
        </p>
        <h3 className={styles.title} data-fog-clear>
          {event.title}
        </h3>
        <p className={styles.meta} data-fog-clear>
          {event.time} · {event.place}
        </p>
        <p className={styles.text} data-fog-clear>
          {event.text}
        </p>
      </div>

      <button
        type="button"
        className={going ? ui.primary : ui.secondary}
        aria-pressed={going}
        onClick={() => setGoing((value) => !value)}
        data-fog-clear="box"
        data-fog-ignore
      >
        {going ? RSVP.going : RSVP.label}
      </button>
    </li>
  )
}

/** Upcoming events, grouped under month headings. */
export function Events() {
  const upcoming = EVENTS.filter((event) => daysUntil(event.date) >= 0).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
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

      {[...months].map(([month, events]) => (
        <section key={month} className={styles.month} aria-label={month}>
          <h2 className={styles.monthName} data-fog-clear>
            {month}
          </h2>
          <ol className={`${ui.panel} ${styles.list}`}>
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
