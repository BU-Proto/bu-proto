import { Link, useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { Firesides } from '../components/Firesides'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { coverThumb, EVENT_COVERS, type CoverPhoto } from '../content/covers'
import { BUILD_NIGHT, EVENTS_EMPTY, EVENTS_INTRO, EVENTS_LATER, KIND_GROUP, KIND_HUE, NEXT_EVENT } from '../content/events'
import { INVITE_ONLY } from '../content/founders'
import { groupInvite } from '../content/site'
import { dateParts, daysUntil, formatMonth } from '../lib/dates'
import { kindAddsInfo } from '../lib/events'
import { useRsvp } from '../lib/useRsvp'
import styles from './Events.module.css'
import { eventPath } from '../lib/paths'

const BUILD_NIGHT_COVER = EVENT_COVERS['Build night']

/** The BU building an event without a photo of its own opens with, matched to its kind. */
const stockCover = (event: ProtoEvent) => EVENT_COVERS[event.kind] ?? BUILD_NIGHT_COVER

/**
 * What's coming up: the next event set large with its photo, the firesides (coming up and past),
 * then the rest as one ruled list grouped by month. Other past events are left off; each event's
 * own page links to its neighbours.
 */
export function Events() {
  const events = useLoaderData<ProtoEvent[]>()
  const upcoming = events
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
  const [next, ...later] = upcoming
  const nextBuildNight = upcoming.find((event) => event.kind === 'Build night')

  const months = new Map<string, ProtoEvent[]>()
  for (const event of later) {
    const month = formatMonth(event.date)
    months.set(month, [...(months.get(month) ?? []), event])
  }
  // The stock covers the list shows, each credited once under it, as their licences require.
  const credits = [...new Set(later.filter((event) => !event.photo).map((event) => stockCover(event)))]

  return (
    <div className={`${ui.page} ${styles.page}`}>
      {/* The intro and build night's note side by side: the ground drains in under both. */}
      <div className={styles.head} data-ground-after="">
        <PageIntro intro={EVENTS_INTRO} groundAfter={false} />
        <BuildNight next={nextBuildNight} />
      </div>

      {next ? <NextEvent key={next.id} event={next} /> : <Empty />}

      <Firesides events={events} />

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
          {credits.length > 0 && (
            <p className={styles.listCredit} data-fog-clear>
              Photos by{' '}
              {credits.map((cover, i) => (
                <span key={cover.source}>
                  {i > 0 && (i === credits.length - 1 ? ' and ' : ', ')}
                  <a href={cover.source} target="_blank" rel="noopener noreferrer">
                    {cover.author}
                  </a>{' '}
                  ({cover.license})
                </span>
              ))}{' '}
              via Wikimedia Commons
            </p>
          )}
        </section>
      )}
    </div>
  )
}

/** The weekly beat, beside the intro. It names the next build night only when one is on the list. */
function BuildNight({ next }: { next: ProtoEvent | undefined }) {
  const date = next && dateParts(next.date)
  return (
    <aside className={styles.rhythm} data-hue={KIND_HUE['Build night']} aria-label={BUILD_NIGHT.title}>
      <p className={styles.rhythmTitle} data-fog-clear>
        {BUILD_NIGHT.title}
      </p>
      <p className={styles.rhythmText} data-fog-clear>
        {BUILD_NIGHT.text}
      </p>
      {next && date && (
        <p className={styles.rhythmText} data-fog-clear>
          {BUILD_NIGHT.next}{' '}
          <Link className={ui.textLink} to={eventPath(next)}>
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
  const stock = stockCover(event)

  return (
    <article className={styles.lead} data-hue={KIND_HUE[event.kind]} aria-labelledby="next-event">
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
          <Link to={eventPath(event)}>{event.title}</Link>
          <SampleTag show={event.placeholder} />
        </h2>
        {/* Kind, time and place, set apart by space and tone rather than separators. */}
        <p className={styles.meta}>
          {kindAddsInfo(event.kind, event.title) && <span className={styles.kind}>{event.kind}</span>}
          <span>{event.time}</span>
          <span className={styles.place}>{event.place}</span>
        </p>
        <GroupLine event={event} />
        {event.text && <p className={styles.leadText}>{event.text}</p>}

        <div className={styles.actions}>
          <RsvpButton rsvp={rsvp} prominent />
          <Link className={ui.textLink} to={eventPath(event)}>
            {NEXT_EVENT.details}
            <span className={ui.srOnly}> about {event.title}</span>
          </Link>
        </div>
        <RsvpForm rsvp={rsvp} className={styles.leadRsvp} />
      </div>
    </article>
  )
}

/** Nothing scheduled: the same frame as the lead, with build night's room and a way to hear first. */
function Empty() {
  return (
    <section className={styles.lead} aria-labelledby="no-events">
      <Cover src={BUILD_NIGHT_COVER.src} alt={BUILD_NIGHT_COVER.alt} credit={BUILD_NIGHT_COVER} />
      <div className={`${styles.leadBody} ${styles.emptyBody}`}>
        <h2 id="no-events" className={styles.emptyTitle}>
          {EVENTS_EMPTY.title}
        </h2>
        <p className={styles.leadText}>{EVENTS_EMPTY.text}</p>
        <div className={styles.actions}>
          <Link className={ui.primary} to={EVENTS_EMPTY.join.href}>
            {EVENTS_EMPTY.join.label}
          </Link>
          <Link className={ui.textLink} to={EVENTS_EMPTY.more.href}>
            {EVENTS_EMPTY.more.label}
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * A group's own night says whose it is, and that everyone else is welcome; an invite-only night
 * says who it's for. Nothing for the rest.
 */
function GroupLine({ event }: { event: ProtoEvent }) {
  if (event.inviteOnly) {
    return (
      <p className={styles.group} data-fog-clear>
        {INVITE_ONLY.text}
      </p>
    )
  }
  const group = KIND_GROUP[event.kind]
  if (!group) return null
  return (
    <p className={styles.group} data-fog-clear>
      {groupInvite(group)}
    </p>
  )
}

/** One later event: the day to scan by, what and where, and a quiet RSVP. */
function EventRow({ event }: { event: ProtoEvent }) {
  const rsvp = useRsvp(event)
  const { day, weekday } = dateParts(event.date)

  return (
    <li className={styles.event} data-hue={KIND_HUE[event.kind]}>
      <time className={styles.rowDate} dateTime={event.date} data-fog-clear>
        <span className={styles.rowDay}>{day}</span>
        <span className={styles.rowWeekday}>{weekday}</span>
      </time>

      {/* Its own photo, or the stock cover its page opens with (credited under the list). */}
      <div className={styles.thumb}>
        <img src={event.photo || coverThumb(stockCover(event).src)} alt="" loading="lazy" decoding="async" />
      </div>

      <div className={styles.body}>
        <h4 className={styles.title} data-fog-clear>
          {/* Stretched over the whole row, so a click anywhere opens the event's page. */}
          <Link className={styles.rowLink} to={eventPath(event)}>
            {event.title}
          </Link>
          <SampleTag show={event.placeholder} />
        </h4>
        <p className={styles.meta} data-fog-clear>
          {kindAddsInfo(event.kind, event.title) && <span className={styles.kind}>{event.kind}</span>}
          <span>{event.time}</span>
          <span className={styles.place}>{event.place}</span>
        </p>
        <GroupLine event={event} />
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
