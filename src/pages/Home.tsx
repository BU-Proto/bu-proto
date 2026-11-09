import { useEffect, useMemo, type CSSProperties, type RefObject } from 'react'
import { Link, useLoaderData, useOutletContext } from 'react-router'
import type { ProtoEvent } from '../../shared/api'
import { newestWins } from '../components/accolade'
import { GlyphEdge } from '../components/GlyphEdge'
import { AsciiJourney } from '../components/AsciiJourney'
import { EventLedger } from '../components/EventLedger'
import { Hero } from '../components/Hero'
import { ScrubWords } from '../components/motion/ScrubWords'
import { LogoBand } from '../components/LogoBand'
import { RevealWords } from '../components/motion/RevealWords'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { RsvpButton, RsvpForm } from '../components/Rsvp'
import { SampleTag } from '../components/SampleTag'
import lui from '../components/landing.module.css'
import ui from '../components/ui.module.css'
import { WinOrbit } from '../components/WinOrbit'
import { LatestWins } from '../components/WinSheet'
import { WaysIn } from '../components/WaysIn'
import { WinTally } from '../components/WinTally'
import type { LayoutOutlet } from '../components/Layout'
import {
  FUND_NOTE,
  HOME_EMPTY,
  JOIN_CTA,
  NEXT_UP,
  RHYTHM,
  RHYTHM_INTRO,
  SEMESTER,
} from '../content/home'
import { KIND_HUE, NEXT_EVENT } from '../content/events'
import { BRAND } from '../content/site'
import { WINS_EMPTY } from '../content/wins'
import { WHY } from '../content/about'
import type { HomeData } from '../lib/content'
import { dateParts, daysUntil, formatDay } from '../lib/dates'
import { kindAddsInfo } from '../lib/events'
import { useWheelEasing } from '../lib/smoothScroll'
import { useRsvp } from '../lib/useRsvp'
import { glyphTexture, rhythmColumn } from '../lib/glyphArt'
import { GROUND } from '../lib/pageGround'
import styles from './Home.module.css'

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

function beatIndex(week: number): number {
  let index = -1
  RHYTHM.forEach((beat, row) => {
    if (!beat.later && row < BEATS.length && beat.weeks.includes(week)) index = Math.max(index, row)
  })
  return index
}

const beatOf = (week: number) => BEATS[beatIndex(week)]?.name
const hueOf = (week: number) => RHYTHM[beatIndex(week)]?.hue

function weekArt(week: number): string {
  const beat = BEATS[beatIndex(week)]
  return rhythmColumn(beat?.height ?? 0, beat?.weight ?? 0, SCORE_ROWS, COLUMN_WIDTH, week).join('\n')
}

/** The opening lead: the first sentence in full ink, the rest in the softer second voice. */
const LEAD_BREAK = WHY.text.indexOf('. ') + 1
const LEAD = { open: WHY.text.slice(0, LEAD_BREAK), rest: WHY.text.slice(LEAD_BREAK + 1) }

/** Step numbers as main shows them: 01, 02. */
const stepNumber = (index: number) => String(index + 1).padStart(2, '0')

/** Staggers the parts of a block as it settles in. */
const after = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** The next event: the date set large, then what, when and where, one line, and the RSVP. */
function NextEvent({ event }: { event: ProtoEvent }) {
  const rsvp = useRsvp(event)
  const { day, monthLong, weekdayLong } = dateParts(event.date)
  return (
    <article className={styles.event} data-hue={KIND_HUE[event.kind]}>
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
        <Link to={`/events/${event.id}`}>{event.title}</Link>
        <SampleTag show={event.placeholder} />
      </h4>
      {/* Kind, time and place, set apart by space and tone rather than separators. */}
      <p className={styles.eventMeta} data-reveal="rise" style={after(140)}>
        {kindAddsInfo(event.kind, event.title) && <span className={styles.kind}>{event.kind}</span>}
        <span>{event.time}</span>
        <span className={styles.place}>{event.place}</span>
      </p>
      {event.text && (
        <p className={styles.eventText} data-reveal="rise" style={after(200)}>
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
      <p className={styles.eventText} data-reveal="rise" style={after(80)}>
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
 * The landing. The hero keeps the field; below it the field drains into one long harbor ground,
 * which takes on a frozen texture of the field partway down and fills back up with the live field
 * for the ask. Each section has one job: the ways in, the rhythm and its next beat, the record.
 */
/**
 * The field rises back up for the ask in a shape of its own: dawn, light coming up from the foot
 * of the page. It changes over halfway down the harbor stretch between the hero and the ask, where
 * the field is out of sight, so neither the hero nor the ask ever sees it switch.
 */
function useClosingShape(harborRef: RefObject<HTMLElement | null>) {
  const { setFieldShape } = useOutletContext<LayoutOutlet>()
  useEffect(() => {
    const state: { frame: number; closing: boolean | null } = { frame: 0, closing: null }
    const check = () => {
      state.frame = 0
      const harbor = harborRef.current
      if (!harbor) return
      const box = harbor.getBoundingClientRect()
      const next = box.top + box.height / 2 < window.innerHeight / 2
      if (next === state.closing) return
      state.closing = next
      setFieldShape(next ? 'dawn' : null)
    }
    const schedule = () => {
      if (!state.frame) state.frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(state.frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      setFieldShape(null)
    }
  }, [harborRef, setFieldShape])
}

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
  const texture = useMemo(() => glyphTexture(GROUND.texture), [])
  const textureMask = useMemo(() => glyphTexture(GROUND.textureMask), [])
  const revealRef = useReveal<HTMLDivElement>()
  useWheelEasing()
  useClosingShape(revealRef)

  return (
    <>
      <title>{`${BRAND.full} · The home base for building things at BU`}</title>
      <Hero />

      {/* Everything below the hero settles in as it comes up the screen (see motion/useReveal). */}
      <div ref={revealRef} className={motion.reveal}>
      {/* Harbor: the field drains into it, and the three ways in stand on it. */}
      <div className={`${styles.bleed} ${styles.ink} ${styles.afterHero}`}>
        <GlyphEdge color={GROUND.harbor} mode="drain" rows={44} cell={10} />
        {/* The opening lead, as on main: what Proto is for, in two voices. */}
        <div className={lui.tight}>
          <div className={lui.wrap}>
            <p className={lui.lead} data-reveal="rise">
              {LEAD.open} <em>{LEAD.rest}</em>
            </p>
          </div>
        </div>
        {/* Main's order: the three ways in, how a semester goes, then what's on. */}
        <WaysIn />
        <AsciiJourney />
        <EventLedger events={events} />
      </div>

      {/* Harbor still, now with the field frozen into it: the rhythm and what's next on it, then
          the record. The field comes back by degrees: plain harbor, its texture, then the field. */}
      <div
        className={`${styles.bleed} ${styles.ink} ${styles.inkTextured}`}
        style={
          {
            '--texture': texture ? `url(${texture})` : 'none',
            '--texture-mask': textureMask ? `url(${textureMask})` : 'none',
          } as CSSProperties
        }
      >
        <section className={`${styles.column} ${styles.rhythm}`} aria-labelledby="rhythm">
          <header className={lui.split}>
            <h2 id="rhythm" className={styles.title} data-reveal="words">
              <RevealWords text={RHYTHM_INTRO.title} />
            </h2>
            <p className={lui.body} data-reveal="rise" style={after(220)}>
              {RHYTHM_INTRO.lede}
            </p>
          </header>

          <figure className={styles.score}>
            <div className={styles.weeks} aria-hidden="true">
              {WEEKS.map((week) => (
                // The semester fills in week by week as the score comes into view.
                <pre
                  key={week}
                  className={styles.week}
                  data-beat={beatOf(week)}
                  data-hue={hueOf(week)}
                  data-reveal="column"
                  style={after((week - 1) * 45)}
                >
                  {weekArt(week)}
                </pre>
              ))}
            </div>
            <div className={styles.axis} aria-hidden="true">
              {WEEKS.map((week) => (
                <span key={week}>{week}</span>
              ))}
            </div>
            <figcaption className={styles.caption}>{SEMESTER.caption}</figcaption>
          </figure>

          {/* Four-up steps, as on main: the number and the beat, when it is, then what happens. */}
          <ol className={lui.steps}>
            {RHYTHM.map((beat, row) => (
              <li
                key={beat.what}
                className={`${lui.step} ${styles.beat}`}
                data-hue={beat.hue}
                data-later={beat.later || undefined}
                data-reveal="rise"
                style={after(row * 90)}
              >
                <div className={lui.stepHead}>
                  <span className={lui.badge} aria-hidden="true">
                    {stepNumber(row)}
                  </span>
                  <h3 className={lui.stepTitle}>{beat.what}</h3>
                </div>
                <p className={styles.when}>{beat.later ? SEMESTER.later : beat.when}</p>
                <p className={lui.stepText}>
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
              </li>
            ))}
          </ol>

          {/* The rhythm's next real beat from the calendar, beside the next deadlines to go with it. */}
          <div className={styles.next}>
            <section className={styles.nextEvent} aria-labelledby="next-event">
              <div className={styles.nextHead} data-reveal="rise">
                <h3 id="next-event" className={styles.subTitle}>
                  {NEXT_UP.title}
                </h3>
                <Link className={ui.textLink} to="/events">
                  {NEXT_UP.allEvents}
                </Link>
              </div>
              {nextEvent ? <NextEvent event={nextEvent} /> : <NoEvent />}
            </section>

            <section className={styles.applyBy} data-hue="iris" aria-labelledby="apply-by">
              <div className={styles.nextHead} data-reveal="rise">
                <h3 id="apply-by" className={styles.subTitle}>
                  {NEXT_UP.applyBy}
                </h3>
                <Link className={ui.textLink} to="/hackathons">
                  {NEXT_UP.allHackathons}
                </Link>
              </div>
              {deadlines.length === 0 ? (
                <p className={styles.quiet} data-reveal="rise">
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
        </section>

        {/* The record, as on main: the running tally, the wins in orbit, then the newest as cards. */}
        <section className={styles.wins} data-hue="rose" aria-labelledby="latest-wins">
          <div className={styles.tally}>
            <div className={lui.wrap}>
              <WinTally wins={wins} />
            </div>
          </div>
          {latest.length === 0 ? (
            <div className={styles.tally}>
              <p className={`${lui.wrap} ${lui.body}`}>{WINS_EMPTY}</p>
            </div>
          ) : (
            <>
              <WinOrbit wins={latest} />
              <LatestWins wins={latest.slice(0, 3)} id="latest-wins" />
            </>
          )}
        </section>

        <LogoBand />
        {/* Harbor fills back up with the field for the last word. */}
        <GlyphEdge color={GROUND.harbor} mode="drain" side="bottom" rows={44} cell={10} />
      </div>
      </div>

      <div className={styles.column}>
        {/* The ask, back on the field, lit word by word as it rises up the screen. */}
        <section className={styles.join} aria-labelledby="join-cta">
          <h2 id="join-cta" className={styles.joinTitle} data-fog-clear>
            <ScrubWords text={JOIN_CTA.title} />
          </h2>
          <p className={styles.joinLede} data-fog-clear>
            {JOIN_CTA.lede}
          </p>
          <Link className={`${ui.primary} ${styles.joinButton}`} to={JOIN_CTA.cta.href} data-fog-clear="box">
            {JOIN_CTA.cta.label}
          </Link>
        </section>
      </div>
    </>
  )
}
