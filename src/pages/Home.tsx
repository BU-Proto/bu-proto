import { useMemo, type CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import { showcaseOrder } from '../components/accolade'
import { AccoladeFeature, AccoladePlates } from '../components/Accolades'
import { GlyphEdge } from '../components/GlyphEdge'
import { Hero } from '../components/Hero'
import { LogoBand } from '../components/LogoBand'
import { AsciiFigure } from '../components/motion/AsciiFigure'
import { Marquee } from '../components/motion/Marquee'
import { NumberTicker } from '../components/motion/NumberTicker'
import { ScrubWords } from '../components/motion/ScrubWords'
import { SampleTag } from '../components/SampleTag'
import { ScheduleCard } from '../components/ScheduleCard'
import ui from '../components/ui.module.css'
import { WinTally } from '../components/WinTally'
import { EVENT_COVERS } from '../content/covers'
import {
  HOME_EMPTY,
  JOIN_CTA,
  MARQUEE,
  NEXT_UP,
  NOTES,
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
import { glyphTexture, type FigureShape } from '../lib/glyphArt'
import { GROUND } from '../lib/pageGround'
import styles from './Home.module.css'

const SEPARATORS = ['○', '>', '_']

/** The trail glyph each track already carries, drawn as a figure. */
const FIGURES: Record<string, FigureShape> = { '○': 'ring', '>': 'chevron', _: 'bar' }

const WEEKS = Array.from({ length: SEMESTER.weeks }, (_, index) => index + 1)

/**
 * The landing. The hero keeps the field; below it the page walks through its own grounds, each
 * seam drawn rather than boxed: harbor that the field drains into, a paper score, a mint strip, a
 * photo of campus, harbor again, and the field once more for the ask.
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
  const fundNote = NOTES.find((note) => note.link)
  const nextDate = nextEvent && dateParts(nextEvent.date)
  const { featured, rest } = showcaseOrder(wins)
  const topWins = [...featured, ...rest].slice(0, 3)
  // The next event's own photo if it has one; otherwise the campus photo for its kind, credited.
  const stock = EVENT_COVERS[nextEvent?.kind ?? 'Hack night'] ?? EVENT_COVERS['Hack night']
  const texture = useMemo(() => glyphTexture(GROUND.texture), [])
  const photo = nextEvent?.photo ? { src: nextEvent.photo, alt: '', credit: null } : { src: stock.src, alt: '', credit: stock }

  return (
    <>
      <title>{`${BRAND.full} · The home base for building things at BU`}</title>
      <Hero />

      {/* Harbor: the field drains into it. The record, then the three ways in. */}
      <div className={`${styles.bleed} ${styles.ink} ${styles.afterHero}`}>
        <GlyphEdge color={GROUND.harbor} mode="drain" rows={44} cell={10} />
        <div className={styles.column}>
          <div className={styles.tally}>
            <WinTally wins={wins} showLink />
          </div>

          <section className={styles.tracks} aria-labelledby="tracks">
            <header className={styles.tracksHead}>
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

      {/* Paper: the rhythm, set as a score across a semester. */}
      <div className={`${styles.bleed} ${styles.paper}`}>
        <GlyphEdge color={GROUND.paper} mode="steps" rows={4} cell={7} />
        <section className={`${styles.column} ${styles.rhythm}`} aria-labelledby="rhythm">
          <header className={styles.rhythmHead}>
            <h2 id="rhythm" className={styles.title}>
              {RHYTHM_INTRO.title}
            </h2>
            <p className={styles.lede}>{RHYTHM_INTRO.lede}</p>
          </header>

          <figure className={styles.score}>
            <div className={styles.axis} aria-hidden="true">
              <span className={styles.axisLabel}>{SEMESTER.weekLabel}</span>
              <span className={styles.axisWeeks}>
                {WEEKS.map((week) => (
                  <span key={week}>{week}</span>
                ))}
              </span>
            </div>
            <ol className={styles.lines}>
              {RHYTHM.map((beat, row) => (
                <li key={beat.what} className={styles.line} data-row={row} data-later={beat.later || undefined}>
                  <div className={styles.lineLabel}>
                    <p className={styles.when}>{beat.when}</p>
                    <h3 className={styles.beatWhat}>{beat.what}</h3>
                    <p className={styles.beatDetail}>{beat.detail}</p>
                  </div>
                  <div className={styles.lineTrack} aria-hidden="true">
                    {beat.later ? (
                      <span className={styles.later}>{SEMESTER.later}</span>
                    ) : (
                      WEEKS.map((week) => (
                        <span key={week} className={styles.cell} data-on={beat.weeks.includes(week) || undefined} />
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <figcaption className={styles.caption}>{SEMESTER.caption}</figcaption>
          </figure>
        </section>
      </div>

      {/* Mint: a hard cut, the accent's one loud moment on the page. */}
      <div className={`${styles.bleed} ${styles.mint}`}>
        <Marquee label="What Proto does" duration={48}>
          {MARQUEE.map((item, index) => (
            <span key={item} className={styles.bandItem}>
              <span>{item}</span>
              <span className={styles.bandGlyph} aria-hidden="true">
                {SEPARATORS[index % SEPARATORS.length]}
              </span>
            </span>
          ))}
        </Marquee>
        {fundNote?.link && (
          <p className={styles.bandNote}>
            {fundNote.text}.{' '}
            <Link className={ui.textLink} to={fundNote.link.href}>
              {fundNote.link.label}
            </Link>
          </p>
        )}
      </div>

      {/* Campus: the next thing on the calendar, over a photo of where it happens. */}
      <section className={`${styles.bleed} ${styles.ink} ${styles.photoBand}`} aria-labelledby="next-event">
        <div className={styles.photo} aria-hidden="true">
          <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
        </div>
        <div className={`${styles.column} ${styles.next}`}>
          <h2 id="next-event" className={styles.title}>
            {NEXT_UP.title}
          </h2>

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
                  <h3 className={styles.eventTitle}>
                    {/* Stretched over the date and the copy; "All events" sits above it. */}
                    <Link className={styles.stretch} to={`/events/${nextEvent.id}`}>
                      {nextEvent.title}
                    </Link>
                    <SampleTag show={nextEvent.placeholder} />
                  </h3>
                  <p className={styles.eventMeta}>
                    {kindAddsInfo(nextEvent.kind, nextEvent.title) && (
                      <span className={styles.kind}>{nextEvent.kind}</span>
                    )}
                    <span>{nextEvent.time}</span>
                    <span className={styles.place}>{nextEvent.place}</span>
                  </p>
                  {nextEvent.text && <p className={styles.eventText}>{nextEvent.text}</p>}
                  <Link className={`${ui.textLink} ${styles.aboveStretch}`} to="/events">
                    {NEXT_UP.allEvents}
                  </Link>
                </div>
              </article>
            ) : (
              <div className={`${styles.eventCopy} ${styles.eventEmpty}`}>
                <p className={styles.eventText}>{HOME_EMPTY.next}</p>
                <Link className={ui.textLink} to="/events">
                  {NEXT_UP.allEvents}
                </Link>
              </div>
            )}

            <ScheduleCard
              className={styles.schedule}
              location={SCHEDULE.location}
              slots={SCHEDULE.slots}
              placeholder={SCHEDULE.placeholder}
            />
          </div>

          <div className={styles.deadlines}>
            <h3 className={styles.deadlinesTitle}>{NEXT_UP.applyBy}</h3>
            {deadlines.length === 0 ? (
              <p className={styles.eventText}>{HOME_EMPTY.deadlines}</p>
            ) : (
              <ol className={styles.deadlineList}>
                {deadlines.map((hackathon) => (
                  <li key={hackathon.id} className={styles.deadline}>
                    <span className={styles.countdown}>
                      <NumberTicker value={daysUntil(hackathon.applyBy)} />
                      <small>days</small>
                    </span>
                    <span className={styles.deadlineName}>
                      <Link className={styles.stretch} to={`/hackathons/${hackathon.id}`}>
                        {hackathon.name}
                      </Link>
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
        {photo.credit && (
          <p className={styles.credit}>
            Photo by {photo.credit.author},{' '}
            <a href={photo.credit.source} target="_blank" rel="noopener noreferrer">
              {photo.credit.license} via Wikimedia Commons
            </a>
          </p>
        )}
      </section>

      {/* Ink again, with a frozen texture of the field: the wins and who we build with. */}
      <div
        className={`${styles.bleed} ${styles.ink} ${styles.inkTextured}`}
        style={{ '--texture': texture ? `url(${texture})` : 'none' } as CSSProperties}
      >
        <section className={`${styles.column} ${styles.wins}`} aria-labelledby="latest-wins">
          <header className={styles.winsHead}>
            <h2 id="latest-wins" className={styles.title}>
              {WINS_TITLE}
            </h2>
            <Link className={ui.textLink} to="/wins">
              All wins
            </Link>
          </header>
          {topWins.length === 0 ? (
            <p className={styles.lede}>{WINS_EMPTY}</p>
          ) : (
            <>
              <AccoladeFeature win={topWins[0]} level={3} />
              {topWins.length > 1 && <AccoladePlates wins={topWins.slice(1)} />}
            </>
          )}
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
