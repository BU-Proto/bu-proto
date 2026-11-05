import { Link, useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { EVENT_COVERS, type CoverPhoto } from '../content/covers'
import { EVENTS_EMPTY, EVENTS_INTRO, EVENTS_LATER, HACK_NIGHT, NEXT_EVENT } from '../content/events'
import { dateParts, daysUntil, formatMonth } from '../lib/dates'
import { kindAddsInfo } from '../lib/events'
import { useRsvp } from '../lib/useRsvp'
import styles from './Events.module.css'

const HACK_NIGHT_COVER = EVENT_COVERS['Hack night']

/**
 * What's coming up: the next event set large with its photo, then the rest as one ruled list
 * grouped by month. Past events are left off; each event's own page links to its neighbours.
 */
export function Events() {
  const events = useLoaderData<ProtoEvent[]>()
  const upcoming = events
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
  const [next, ...later] = upcoming
  const nextHackNight = upcoming.find((event) => event.kind === 'Hack night')

  const months = new Map<string, ProtoEvent[]>()
  for (const event of later) {
    const month = formatMonth(event.date)
    months.set(month, [...(months.get(month) ?? []), event])
  }

  return (
    <div className={`${ui.page} ${styles.page}`}>
      <div className={styles.head}>
        <PageIntro intro={EVENTS_INTRO} />
        <HackNight next={nextHackNight} />
      </div>

      {next ? <NextEvent key={next.id} event={next} /> : <Empty />}

      {months.size > 0 && (
        <section className={styles.later} aria-labelledby="later">
          <h2 id="later" className={ui.sectionTitle} data-fog-clear>
            {EVENTS_LATER}
          </h2>
          <div className={`${ui.panel} ${styles.sheet}`}>
            {[...months].map(([month, monthEvents]) => (
              <section key={month} className={styles.month} aria-label={month}>
                <h3 className={styles.monthName} data-fog-clear>
                  {month}
                </h3>
                <ol className={styles.list}>
                  {monthEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/** The weekly beat, beside the intro. It names the next hack night only when one is on the list. */
function HackNight({ next }: { next: ProtoEvent | undefined }) {
  const date = next && dateParts(next.date)
  return (
    <aside className={styles.rhythm} aria-label={HACK_NIGHT.title}>
      <p className={styles.rhythmTitle} data-fog-clear>
        {HACK_NIGHT.title}
      </p>
      <p className={styles.rhythmText} data-fog-clear>
        {HACK_NIGHT.text}
      </p>
      {next && date && (
        <p className={styles.rhythmText} data-fog-clear>
          {HACK_NIGHT.next}{' '}
          <Link className={ui.textLink} to={`/events/${next.id}`}>
            {date.weekdayLong}, {date.monthLong} {date.day}
          </Link>
        </p>
      )}
    </aside>
  )
}

/** A campus photo for the lead, credited when it's one of the stock covers. */
function Cover({ src, alt, credit }: { src: string; alt: string; credit?: CoverPhoto }) {
  return (
    <figure className={styles.cover}>
      <img src={src} alt={alt} decoding="async" fetchPriority="high" />
      {credit && (
        <figcaption className={styles.credit}>
          Photo by {credit.author},{' '}
          <a href={credit.source} target="_blank" rel="noopener noreferrer">
            {credit.license} via Wikimedia Commons
          </a>
        </figcaption>
      )}
    </figure>
  )
}

/** The next event: its photo beside the date set large, the details, and the RSVP. */
function NextEvent({ event }: { event: ProtoEvent }) {
  const rsvp = useRsvp(event)
  const { day, monthLong, weekdayLong } = dateParts(event.date)
  // No photo of its own yet: the BU building matched to its kind, as on the event's own page.
  const stock = EVENT_COVERS[event.kind] ?? HACK_NIGHT_COVER

  return (
    <article className={styles.lead} aria-labelledby="next-event">
      {event.photo ? <Cover src={event.photo} alt="" /> : <Cover src={stock.src} alt={stock.alt} credit={stock} />}

      <div className={styles.leadBody}>
        <p className={styles.date}>
          <span className={styles.day}>{day}</span>
          <span className={styles.dateRest}>
            {monthLong}
            <br />
            {weekdayLong}
            <br />
            <span className={styles.countdown}>{NEXT_EVENT.when(daysUntil(event.date))}</span>
          </span>
        </p>

        <h2 id="next-event" className={styles.leadTitle}>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
          <SampleTag show={event.placeholder} />
        </h2>
        {/* Kind, time and place, set apart by space and tone rather than separators. */}
        <p className={styles.meta}>
          {kindAddsInfo(event.kind, event.title) && <span className={styles.kind}>{event.kind}</span>}
          <span>{event.time}</span>
          <span className={styles.place}>{event.place}</span>
        </p>
        {event.text && <p className={styles.leadText}>{event.text}</p>}

        <div className={styles.actions}>
          <RsvpButton rsvp={rsvp} prominent />
          <Link className={ui.textLink} to={`/events/${event.id}`}>
            {NEXT_EVENT.details}
            <span className={ui.srOnly}> about {event.title}</span>
          </Link>
        </div>
        <RsvpForm rsvp={rsvp} className={styles.leadRsvp} />
      </div>
    </article>
  )
}

/** Nothing scheduled: the same frame as the lead, with hack night's room and a way to hear first. */
function Empty() {
  return (
    <section className={styles.lead} aria-labelledby="no-events">
      <Cover src={HACK_NIGHT_COVER.src} alt={HACK_NIGHT_COVER.alt} credit={HACK_NIGHT_COVER} />
      <div className={`${styles.leadBody} ${styles.emptyBody}`}>
        <h2 id="no-events" className={styles.emptyTitle}>
          {EVENTS_EMPTY.title}
        </h2>
        <p className={styles.leadText}>{EVENTS_EMPTY.text}</p>
        <div className={styles.actions}>
          <Link className={ui.primary} to={EVENTS_EMPTY.join.href}>
            {EVENTS_EMPTY.join.label}
          </Link>
          <Link className={ui.textLink} to={EVENTS_EMPTY.hackathons.href}>
            {EVENTS_EMPTY.hackathons.label}
          </Link>
        </div>
      </div>
    </section>
  )
}

/** One later event: the day to scan by, what and where, and a quiet RSVP. */
function EventRow({ event }: { event: ProtoEvent }) {
  const rsvp = useRsvp(event)
  const { day, weekday } = dateParts(event.date)

  return (
    <li className={styles.event}>
      <time className={styles.rowDate} dateTime={event.date} data-fog-clear>
        <span className={styles.rowDay}>{day}</span>
        <span className={styles.rowWeekday}>{weekday}</span>
      </time>

      <div className={styles.body}>
        <h4 className={styles.title} data-fog-clear>
          {/* Stretched over the whole row, so a click anywhere opens the event's page. */}
          <Link className={styles.rowLink} to={`/events/${event.id}`}>
            {event.title}
          </Link>
          <SampleTag show={event.placeholder} />
        </h4>
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
