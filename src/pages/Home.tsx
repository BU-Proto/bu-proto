import { useMemo, type CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import { newestWins } from '../components/accolade'
import { GlyphEdge } from '../components/GlyphEdge'
import { Hero } from '../components/Hero'
import { LogoBand } from '../components/LogoBand'
import { AsciiFigure } from '../components/motion/AsciiFigure'
import { ScrubWords } from '../components/motion/ScrubWords'
import { SampleTag } from '../components/SampleTag'
import { ScheduleCard } from '../components/ScheduleCard'
import ui from '../components/ui.module.css'
import { WinLog } from '../components/WinLog'
import { WinTally } from '../components/WinTally'
import {
  FUND_NOTE,
  HOME_EMPTY,
  JOIN_CTA,
  NEXT_UP,
  RHYTHM,
  RHYTHM_INTRO,
  SEMESTER,
  TRACKS,
  TRACKS_INTRO,
  WINS_TITLE,
} from '../content/home'
import { BRAND, SCHEDULE } from '../content/site'
import { WINS_EMPTY } from '../content/wins'
import type { HomeData } from '../lib/content'
import { dateParts, daysUntil, formatDay } from '../lib/dates'
import { kindAddsInfo } from '../lib/events'
import { glyphTexture, rhythmColumn, type FigureShape } from '../lib/glyphArt'
import { GROUND } from '../lib/pageGround'
import styles from './Home.module.css'

/** The trail glyph each track already carries, drawn as a figure. */
const FIGURES: Record<string, FigureShape> = { '○': 'ring', '>': 'chevron', _: 'bar' }

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

function weekArt(week: number): string {
  const beat = BEATS[beatIndex(week)]
  return rhythmColumn(beat?.height ?? 0, beat?.weight ?? 0, SCORE_ROWS, COLUMN_WIDTH, week).join('\n')
}

/** A small piece of each beat's column, for the key; year two gets a few loose dots. */
const SWATCHES = RHYTHM.map((_, row) => {
  const beat = BEATS[row]
  return rhythmColumn(beat ? 3 : 1, beat?.weight ?? 0.1, 3, 5, row + 40).join('\n')
})

/**
 * The landing. The hero keeps the field; below it the field drains into one long harbor ground,
 * which takes on a frozen texture of the field partway down and fills back up with the live field
 * for the ask. Each section has one job: the ways in, the rhythm and its next beat, the record.
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
  const nextDate = nextEvent && dateParts(nextEvent.date)
  const latest = newestWins(wins, 3)
  const texture = useMemo(() => glyphTexture(GROUND.texture), [])

  return (
    <>
      <title>{`${BRAND.full} · The home base for building things at BU`}</title>
      <Hero />

      {/* Harbor: the field drains into it, and the three ways in stand on it. */}
      <div className={`${styles.bleed} ${styles.ink} ${styles.afterHero}`}>
        <GlyphEdge color={GROUND.harbor} mode="drain" rows={44} cell={10} />
        <div className={styles.column}>
          <section className={styles.tracks} aria-labelledby="tracks">
            <header className={styles.sectionHead}>
              <h2 id="tracks" className={styles.title}>
                {TRACKS_INTRO.title}
              </h2>
              <p className={styles.lede}>{TRACKS_INTRO.lede}</p>
            </header>

            <ol className={styles.trackList}>
              {TRACKS.map((track, index) => (
                <li key={track.name} className={styles.track} style={{ '--step': index } as CSSProperties}>
                  <AsciiFigure
                    shape={FIGURES[track.glyph] ?? 'ring'}
                    className={styles.figure}
                    rows={24}
                    delay={index * 160}
                  />
                  <div className={styles.trackCopy}>
                    <h3 className={styles.trackName}>{track.name}</h3>
                    <p className={styles.who}>{track.who}</p>
                  </div>
                  <ul className={styles.offers}>
                    {track.offers.map((offer) => (
                      <li key={offer}>{offer}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Harbor still, now with the field frozen into it: the rhythm and what's next on it, then
          the record. The field comes back by degrees: plain harbor, its texture, then the field. */}
      <div
        className={`${styles.bleed} ${styles.ink} ${styles.inkTextured}`}
        style={{ '--texture': texture ? `url(${texture})` : 'none' } as CSSProperties}
      >
        <section className={`${styles.column} ${styles.rhythm}`} aria-labelledby="rhythm">
          <header className={styles.sectionHead}>
            <h2 id="rhythm" className={styles.title}>
              {RHYTHM_INTRO.title}
            </h2>
            <p className={styles.lede}>{RHYTHM_INTRO.lede}</p>
          </header>

          <figure className={styles.score}>
            <div className={styles.weeks} aria-hidden="true">
              {WEEKS.map((week) => (
                <pre key={week} className={styles.week} data-beat={beatOf(week)}>
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

          <ol className={styles.key}>
            {RHYTHM.map((beat, row) => (
              <li key={beat.what} className={styles.beat} data-later={beat.later || undefined}>
                <pre className={styles.swatch} data-beat={BEATS[row]?.name ?? 'later'} aria-hidden="true">
                  {SWATCHES[row]}
                </pre>
                <p className={styles.when}>{beat.later ? SEMESTER.later : beat.when}</p>
                <h3 className={styles.beatWhat}>{beat.what}</h3>
                <p className={styles.beatDetail}>
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

          {/* The rhythm's next real beat, from the calendar. */}
          <div className={styles.next} aria-labelledby="next-event" role="region">
            <div className={styles.nextHead}>
              <h3 id="next-event" className={styles.subTitle}>
                {NEXT_UP.title}
              </h3>
              <Link className={ui.textLink} to="/events">
                {NEXT_UP.allEvents}
              </Link>
            </div>

            <div className={styles.nextGrid}>
              {nextEvent && nextDate ? (
                <article className={styles.event}>
                  <p className={styles.date}>
                    <span className={styles.dateDay}>{nextDate.day}</span>
                    <span className={styles.dateMonth}>
                      {nextDate.monthLong}
                      <br />
                      {nextDate.weekdayLong}
                    </span>
                  </p>
                  <div className={styles.eventCopy}>
                    <h4 className={styles.eventTitle}>
                      {/* Stretched over the date and the copy. */}
                      <Link className={styles.stretch} to={`/events/${nextEvent.id}`}>
                        {nextEvent.title}
                      </Link>
                      <SampleTag show={nextEvent.placeholder} />
                    </h4>
                    <p className={styles.eventMeta}>
                      {kindAddsInfo(nextEvent.kind, nextEvent.title) && (
                        <span className={styles.kind}>{nextEvent.kind}</span>
                      )}
                      <span>{nextEvent.time}</span>
                      <span className={styles.place}>{nextEvent.place}</span>
                    </p>
                    {nextEvent.text && <p className={styles.eventText}>{nextEvent.text}</p>}
                  </div>
                </article>
              ) : (
                <p className={`${styles.eventText} ${styles.eventEmpty}`}>{HOME_EMPTY.next}</p>
              )}

              {/* The room and times aren't booked yet: a sample locally, left off the deployed site. */}
              {(import.meta.env.DEV || !SCHEDULE.placeholder) && (
                <ScheduleCard
                  className={styles.schedule}
                  location={SCHEDULE.location}
                  slots={SCHEDULE.slots}
                  placeholder={SCHEDULE.placeholder}
                />
              )}
            </div>

            <div className={styles.deadlines}>
              <h4 className={styles.deadlinesTitle}>{NEXT_UP.applyBy}</h4>
              {deadlines.length === 0 ? (
                <p className={styles.eventText}>{HOME_EMPTY.deadlines}</p>
              ) : (
                <ol className={styles.deadlineList}>
                  {deadlines.map((hackathon) => (
                    <li key={hackathon.id} className={styles.deadline}>
                      <span className={styles.countdown}>
                        {daysUntil(hackathon.applyBy)}
                        <small>{daysUntil(hackathon.applyBy) === 1 ? 'day' : 'days'}</small>
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
                      <span className={styles.deadlineDate}>{formatDay(hackathon.applyBy)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <Link className={ui.textLink} to="/hackathons">
                {NEXT_UP.allHackathons}
              </Link>
            </div>
          </div>
        </section>

        {/* The record: the running tally, then the newest wins under it. */}
        <section className={`${styles.column} ${styles.wins}`} aria-labelledby="latest-wins">
          <WinTally wins={wins} />
          <div className={styles.nextHead}>
            <h2 id="latest-wins" className={styles.subTitle}>
              {WINS_TITLE}
            </h2>
            <Link className={ui.textLink} to="/wins">
              All wins
            </Link>
          </div>
          {latest.length === 0 ? <p className={styles.lede}>{WINS_EMPTY}</p> : <WinLog wins={latest} />}
        </section>

        <LogoBand />
        {/* Harbor fills back up with the field for the last word. */}
        <GlyphEdge color={GROUND.harbor} mode="drain" side="bottom" rows={44} cell={10} />
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
