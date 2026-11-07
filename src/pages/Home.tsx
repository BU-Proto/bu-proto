import type { CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { newestWins } from '../components/accolade'
import { AsciiJourney } from '../components/AsciiJourney'
import { EventLedger } from '../components/EventLedger'
import { Hero } from '../components/Hero'
import { JoinFrame } from '../components/JoinFrame'
import { KindTag } from '../components/KindTag'
import { LogoBand } from '../components/LogoBand'
import { MaskLines } from '../components/motion/MaskLines'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { WaysIn } from '../components/WaysIn'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import { SampleTag } from '../components/SampleTag'
import { ScheduleCard } from '../components/ScheduleCard'
import ui from '../components/ui.module.css'
import { WinOrbit } from '../components/WinOrbit'
import { LatestWins } from '../components/WinSheet'
import { WinTally } from '../components/WinTally'
import { WHY } from '../content/about'
import {
  FUND_NOTE,
  HOME_EMPTY,
  NEXT_UP,
  RHYTHM,
  RHYTHM_INTRO,
  SEMESTER,
} from '../content/home'
import { NEXT_EVENT } from '../content/events'
import { BRAND, SCHEDULE } from '../content/site'
import type { HomeData } from '../lib/content'
import { dateParts, daysUntil, formatDay } from '../lib/dates'
import { kindAddsInfo } from '../lib/events'
import { useRsvp } from '../lib/useRsvp'
import { rhythmColumn } from '../lib/glyphArt'
import styles from './Home.module.css'

/** The opening lead: the first sentence in ink, the rest in the muted second voice. */
const LEAD_BREAK = WHY.text.indexOf('. ') + 1
const LEAD = { open: WHY.text.slice(0, LEAD_BREAK), rest: WHY.text.slice(LEAD_BREAK + 1) }

const WEEKS = Array.from({ length: SEMESTER.weeks }, (_, index) => index + 1)

/**
 * How each beat is drawn in the score, by its row in RHYTHM: the bigger the night, the taller and
 * denser its column. A week shows its biggest beat. Year two has no column: it isn't on yet.
 */
const BEATS = [
  { name: 'hack', height: 4, weight: 0.4 },
  { name: 'trip', height: 8, weight: 0.66 },
  { name: 'demo', height: 13, weight: 0.94 },
] as const
const TRIP_ROW = 1
const SCORE_ROWS = 14
const COLUMN_WIDTH = 8

/** One score cell in the svg's units; a unit of it is left as the white gap between cells. */
const CELL = 10

/** Each beat's tag in the key, in the colour of its column. */
const BEAT_TAGS = [ui.tagBlue, ui.tagGold, ui.tagRed, ui.tagNavy]

function beatIndex(week: number): number {
  let index = -1
  RHYTHM.forEach((beat, row) => {
    if (!beat.later && row < BEATS.length && beat.weeks.includes(week)) index = Math.max(index, row)
  })
  return index
}

const beatOf = (week: number) => BEATS[beatIndex(week)]?.name

/** A week's column as one path: every mark rhythmColumn lays down becomes a square cell. */
function weekPath(week: number): string {
  const beat = BEATS[beatIndex(week)]
  const size = CELL - 1
  return rhythmColumn(beat?.height ?? 0, beat?.weight ?? 0, SCORE_ROWS, COLUMN_WIDTH, week)
    .flatMap((line, row) =>
      [...line].map((mark, column) =>
        mark === ' ' ? '' : `M${column * CELL} ${row * CELL}h${size}v${size}h-${size}z`,
      ),
    )
    .join('')
}

/** Step numbers as the badges show them: 01, 02. */
const stepNumber = (index: number) => String(index + 1).padStart(2, '0')

/** Staggers the parts of a block as it settles in. */
const after = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** The next event: the date set large, then what, when and where, one line, and the RSVP. */
function NextEvent({ event }: { event: ProtoEvent }) {
  const rsvp = useRsvp(event)
  const { day, monthLong, weekdayLong } = dateParts(event.date)
  return (
    <article className={styles.event}>
      <p className={styles.date} data-reveal="rise">
        <span className={styles.dateDay}>{day}</span>
        <span className={styles.dateRest}>
          {monthLong}
          <br />
          {weekdayLong}
          <br />
          <span className={styles.soon}>{NEXT_EVENT.when(daysUntil(event.date))}</span>
        </span>
      </p>
      <h4 className={styles.eventTitle} data-reveal="rise" style={after(80)}>
        <Link className={ui.textLink} to={`/events/${event.id}`}>
          {event.title}
        </Link>
        <SampleTag show={event.placeholder} />
      </h4>
      {/* Kind, time and place, in one line of labels. */}
      <p className={styles.eventMeta} data-reveal="rise" style={after(140)}>
        {kindAddsInfo(event.kind, event.title) && <KindTag kind={event.kind} />}
        <span>{event.time}</span>
        <span>{event.place}</span>
      </p>
      {event.text && (
        <p className={`${ui.body} ${styles.eventText}`} data-reveal="rise" style={after(200)}>
          {event.text}
        </p>
      )}
      <div className={styles.actions} data-reveal="rise" style={after(260)}>
        <RsvpButton rsvp={rsvp} prominent />
        <Link className={ui.textLink} to={`/events/${event.id}`}>
          {NEXT_EVENT.details}
          <span className={ui.srOnly}> about {event.title}</span>
        </Link>
      </div>
      <RsvpForm rsvp={rsvp} className={styles.rsvpForm} />
    </article>
  )
}

/** Nothing booked yet, which is most of the time between semesters: say so, and how to hear first. */
function NoEvent() {
  return (
    <div className={styles.event}>
      <p className={styles.emptyTitle} data-reveal="rise">
        {HOME_EMPTY.next.title}
      </p>
      <p className={`${ui.body} ${styles.eventText}`} data-reveal="rise" style={after(80)}>
        {HOME_EMPTY.next.text}
      </p>
      <p className={styles.actions} data-reveal="rise" style={after(160)}>
        <Link className={ui.textLink} to={HOME_EMPTY.next.link.href}>
          {HOME_EMPTY.next.link.label}
        </Link>
      </p>
    </div>
  )
}

/**
 * The landing, on black: the hero, an opening lead, then one job per section. The ways in, the journey,
 * the events, the rhythm and its next beat, the record, the names we build with, the ask.
 */
export function Home() {
  const { events, hackathons, wins } = useLoaderData<HomeData>()
  const nextEvent = events
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  const deadlines = hackathons
    .filter((hackathon) => daysUntil(hackathon.applyBy) >= 0)
    .sort((a, b) => a.applyBy.localeCompare(b.applyBy))
    .slice(0, 3)
  const latest = newestWins(wins, 12)
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <>
      <title>{`${BRAND.full} · The home base for building things at BU`}</title>
      <Hero />

      {/* Everything below the hero settles in as it comes up the screen (see motion/useReveal). */}
      <div ref={revealRef} className={`${motion.reveal} ${styles.afterHero}`} data-field-cover>
        <div className={ui.tight}>
          <div className={ui.wrap}>
            <p className={ui.lead}>
              <MaskLines text={LEAD.open} />
              <em>
                <MaskLines text={LEAD.rest} delay={220} />
              </em>
            </p>
          </div>
        </div>

        <WaysIn />

        <AsciiJourney />

        <EventLedger events={events} />

        <section className={ui.proc} aria-labelledby="rhythm">
          <div className={ui.wrap}>
            <header className={ui.split}>
              <h2 id="rhythm" className={ui.h2}>
                <MaskLines text={RHYTHM_INTRO.title} />
              </h2>
              <p className={ui.body} data-reveal="rise" style={after(220)}>
                {RHYTHM_INTRO.lede}
              </p>
            </header>

            <figure className={styles.score}>
              <div className={styles.weeks} aria-hidden="true">
                {WEEKS.map((week) => (
                  // The semester fills in week by week as the score comes into view.
                  <svg
                    key={week}
                    className={styles.week}
                    viewBox={`0 0 ${COLUMN_WIDTH * CELL} ${SCORE_ROWS * CELL}`}
                    data-beat={beatOf(week)}
                    data-reveal="rise"
                    style={after((week - 1) * 45)}
                  >
                    <path d={weekPath(week)} />
                  </svg>
                ))}
              </div>
              <div className={styles.axis} aria-hidden="true">
                {WEEKS.map((week) => (
                  <span key={week}>{week}</span>
                ))}
              </div>
              <figcaption className={ui.kicker}>{SEMESTER.caption}</figcaption>
            </figure>

            <ol className={ui.steps}>
              {RHYTHM.map((beat, row) => (
                <li key={beat.what} className={ui.step}>
                  <div data-reveal="rise" style={after(row * 90)}>
                    <div className={ui.stepHead}>
                      <span className={ui.badge} aria-hidden="true">
                        {stepNumber(row)}
                      </span>
                      <h3 className={ui.stepTitle}>{beat.what}</h3>
                    </div>
                    <p className={styles.when}>
                      <span className={`${ui.tag} ${BEAT_TAGS[row]}`}>{beat.later ? SEMESTER.later : beat.when}</span>
                    </p>
                    <p className={ui.stepText}>
                      {beat.detail}
                      {row === TRIP_ROW && (
                        <>
                          {' '}
                          {FUND_NOTE.text}{' '}
                          <Link className={ui.textLink} to={FUND_NOTE.link.href}>
                            {FUND_NOTE.link.label}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* The rhythm's next real beat from the calendar, beside the next deadlines to go with it. */}
            <div className={styles.next}>
              <section className={styles.nextEvent} aria-labelledby="next-event">
                <div className={styles.nextHead} data-reveal="rise">
                  <h3 id="next-event" className={ui.h2}>
                    {NEXT_UP.title}
                  </h3>
                  <Link className={ui.textLink} to="/events">
                    {NEXT_UP.allEvents}
                  </Link>
                </div>
                {nextEvent ? <NextEvent event={nextEvent} /> : <NoEvent />}
                {/* The room and times aren't booked yet: a sample locally, left off the deployed site. */}
                {(import.meta.env.DEV || !SCHEDULE.placeholder) && (
                  <ScheduleCard
                    className={styles.schedule}
                    location={SCHEDULE.location}
                    slots={SCHEDULE.slots}
                    placeholder={SCHEDULE.placeholder}
                  />
                )}
              </section>

              <section className={styles.applyBy} aria-labelledby="apply-by">
                <div className={styles.nextHead} data-reveal="rise">
                  <h3 id="apply-by" className={ui.h2}>
                    {NEXT_UP.applyBy}
                  </h3>
                  <Link className={ui.textLink} to="/hackathons">
                    {NEXT_UP.allHackathons}
                  </Link>
                </div>
                {deadlines.length === 0 ? (
                  <p className={ui.small} data-reveal="rise">
                    {HOME_EMPTY.deadlines}
                  </p>
                ) : (
                  <ol className={styles.deadlineList}>
                    {deadlines.map((hackathon, index) => {
                      const days = daysUntil(hackathon.applyBy)
                      return (
                        <li
                          key={hackathon.id}
                          className={styles.deadline}
                          data-reveal="rise"
                          style={{ '--d': `${index * 90}ms` } as CSSProperties}
                        >
                          <span className={styles.countdown}>
                            {days}
                            <small>{days === 1 ? 'day' : 'days'}</small>
                          </span>
                          <span className={styles.deadlineName}>
                            {/* Hackathons have no page of their own: straight to its site, else the list. */}
                            {hackathon.href ? (
                              <a className={styles.stretch} href={hackathon.href} target="_blank" rel="noopener noreferrer">
                                {hackathon.name}
                              </a>
                            ) : (
                              <Link className={styles.stretch} to="/hackathons">
                                {hackathon.name}
                              </Link>
                            )}
                            <SampleTag show={hackathon.placeholder} />
                          </span>
                          <span className={styles.deadlineDate}>
                            {NEXT_UP.closes} {formatDay(hackathon.applyBy)}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </section>
            </div>
          </div>
        </section>

        {/* The record: the running tally, then the newest wins on their own light sheet. */}
        <section className={styles.wins} aria-labelledby="latest-wins">
          <div className={styles.tally}>
            <div className={ui.wrap}>
              <WinTally wins={wins} />
            </div>
          </div>
          <WinOrbit wins={latest} />
          <LatestWins wins={latest} id="latest-wins" />
        </section>

        <LogoBand />

        <JoinFrame />
      </div>
    </>
  )
}
