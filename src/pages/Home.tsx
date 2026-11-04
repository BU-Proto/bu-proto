import { Link, useLoaderData } from 'react-router'
import { Hero } from '../components/Hero'
import { LogoBand } from '../components/LogoBand'
import { Decrypt } from '../components/motion/Decrypt'
import { Marquee } from '../components/motion/Marquee'
import { NumberTicker } from '../components/motion/NumberTicker'
import { ScrubWords } from '../components/motion/ScrubWords'
import { SampleTag } from '../components/SampleTag'
import { ScheduleCard } from '../components/ScheduleCard'
import ui from '../components/ui.module.css'
import {
  HOME_EMPTY,
  JOIN_CTA,
  MARQUEE,
  NEXT_UP,
  NOTES,
  RHYTHM,
  RHYTHM_INTRO,
  TRACKS,
  TRACKS_INTRO,
  WINS_TITLE,
} from '../content/home'
import { BRAND, SCHEDULE } from '../content/site'
import { WINS_EMPTY } from '../content/wins'
import type { HomeData } from '../lib/content'
import { dateParts, daysUntil, formatDay } from '../lib/dates'
import { WinCard } from './Wins'
import styles from './Home.module.css'

const SEPARATORS = ['○', '>', '_']

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

  return (
    <>
      <title>{`${BRAND.full} · Your home base for making things`}</title>
      <Hero />

      <div className={styles.flow}>
        {/* Three ways in: editorial rows, each led by one of the trail's own glyphs. */}
        <section className={styles.tracks} aria-labelledby="tracks">
          <header className={styles.head}>
            <h2 id="tracks" className={styles.title} data-fog-clear>
              <Decrypt text={TRACKS_INTRO.title} />
            </h2>
            <p className={styles.lede} data-fog-clear>
              {TRACKS_INTRO.lede}
            </p>
          </header>

          <ol className={styles.trackList}>
            {TRACKS.map((track) => (
              <li key={track.name} className={styles.track}>
                <span className={styles.glyph} data-glyph={track.glyph} aria-hidden="true">
                  {track.glyph}
                </span>
                <h3 className={styles.trackName} data-fog-clear>
                  <Decrypt text={track.name} duration={800} />
                </h3>
                <div className={styles.trackBody}>
                  <p className={styles.who} data-fog-clear>
                    {track.who}
                  </p>
                  <ul className={styles.offers}>
                    {track.offers.map((offer) => (
                      <li key={offer} data-fog-clear>
                        {offer}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* The rhythm: a sticky heading, and a rail that fills as the beats go by. */}
        <section className={styles.rhythm} aria-labelledby="rhythm">
          <header className={styles.rhythmHead}>
            <h2 id="rhythm" className={styles.title} data-fog-clear>
              <Decrypt text={RHYTHM_INTRO.title} />
            </h2>
            <p className={styles.lede} data-fog-clear>
              {RHYTHM_INTRO.lede}
            </p>
          </header>

          <ol className={styles.beats}>
            <span className={styles.rail} aria-hidden="true" />
            {RHYTHM.map((beat) => (
              <li key={beat.what} className={styles.beat} data-later={beat.later || undefined}>
                <span className={styles.dot} aria-hidden="true" />
                <p className={styles.when} data-fog-clear>
                  {beat.when}
                </p>
                <h3 className={styles.beatWhat} data-fog-clear>
                  {beat.what}
                </h3>
                <p className={styles.beatDetail} data-fog-clear>
                  {beat.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Full bleed: the one place the page breaks out of its column. */}
      <div className={styles.band}>
        <Marquee label="What Proto does" duration={48}>
          {MARQUEE.map((item, index) => (
            <span key={item} className={styles.bandItem}>
              <span data-fog-clear>{item}</span>
              <span className={styles.bandGlyph} aria-hidden="true">
                {SEPARATORS[index % SEPARATORS.length]}
              </span>
            </span>
          ))}
        </Marquee>
        {fundNote?.link && (
          <p className={styles.bandNote} data-fog-clear>
            {fundNote.text}.{' '}
            <Link className={ui.textLink} to={fundNote.link.href}>
              {fundNote.link.label}
            </Link>
          </p>
        )}
      </div>

      <div className={styles.flow}>
        {/* What's next: a huge date, the event, hack night, and the countdowns. */}
        <section className={styles.next} aria-labelledby="next-event">
          <h2 id="next-event" className={styles.title} data-fog-clear>
            <Decrypt text={NEXT_UP.title} />
          </h2>

          <div className={styles.nextGrid}>
            {nextEvent ? (
              <article className={styles.event}>
                <p className={styles.date} data-fog-clear>
                  <span className={styles.dateDay}>{dateParts(nextEvent.date).day}</span>
                  <span className={styles.dateMonth}>
                    {dateParts(nextEvent.date).month} · {dateParts(nextEvent.date).weekday}
                  </span>
                </p>
                <div className={styles.eventCopy}>
                  <p className={styles.kind} data-fog-clear>
                    {nextEvent.kind} <SampleTag show={nextEvent.placeholder} />
                  </p>
                  <h3 className={styles.eventTitle} data-fog-clear>
                    {nextEvent.title}
                  </h3>
                  <p className={styles.eventMeta} data-fog-clear>
                    {nextEvent.time}, {nextEvent.place}
                  </p>
                  {nextEvent.text && (
                    <p className={styles.eventText} data-fog-clear>
                      {nextEvent.text}
                    </p>
                  )}
                  <Link className={ui.textLink} to="/events" data-fog-clear>
                    {NEXT_UP.allEvents}
                  </Link>
                </div>
              </article>
            ) : (
              <div className={styles.eventCopy}>
                <p className={styles.eventMeta} data-fog-clear>
                  {HOME_EMPTY.next}
                </p>
                <Link className={ui.textLink} to="/events" data-fog-clear>
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

            <div className={styles.deadlines}>
              <h3 className={styles.deadlinesTitle} data-fog-clear>
                {NEXT_UP.applyBy}
              </h3>
              {deadlines.length === 0 ? (
                <p className={styles.eventMeta} data-fog-clear>
                  {HOME_EMPTY.deadlines}
                </p>
              ) : (
                <ol className={styles.deadlineList}>
                  {deadlines.map((hackathon) => (
                    <li key={hackathon.id} className={styles.deadline}>
                      <span className={styles.countdown} data-fog-clear>
                        <NumberTicker value={daysUntil(hackathon.applyBy)} />
                        <small>days</small>
                      </span>
                      <span className={styles.deadlineName} data-fog-clear>
                        {hackathon.name} <SampleTag show={hackathon.placeholder} />
                      </span>
                      <span className={styles.deadlineDate} data-fog-clear>
                        {formatDay(hackathon.applyBy)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <Link className={ui.textLink} to="/hackathons" data-fog-clear>
                {NEXT_UP.allHackathons}
              </Link>
            </div>
          </div>
        </section>

        {/* Wins, hung unevenly like photos on a wall. */}
        <section className={styles.wins} aria-labelledby="latest-wins">
          <header className={styles.winsHead}>
            <h2 id="latest-wins" className={styles.title} data-fog-clear>
              <Decrypt text={WINS_TITLE} />
            </h2>
            <Link className={ui.textLink} to="/wins" data-fog-clear>
              All wins
            </Link>
          </header>
          {wins.length === 0 ? (
            <p className={styles.lede} data-fog-clear>
              {WINS_EMPTY}
            </p>
          ) : (
            <ul className={styles.winGrid}>
              {wins.slice(0, 3).map((win, index) => (
                <WinCard key={win.id} win={win} rank={index} />
              ))}
            </ul>
          )}
        </section>

      </div>

      {/* Partners and sponsors, scrolling the other way. */}
      <LogoBand />

      <div className={styles.flow}>
        {/* The ask, lit word by word as it rises up the screen. */}
        <section className={styles.join} aria-labelledby="join-cta">
          <h2 id="join-cta" className={styles.joinTitle} data-fog-clear>
            <ScrubWords text={JOIN_CTA.title} />
          </h2>
          <p className={styles.joinLede} data-fog-clear>
            {JOIN_CTA.lede}
          </p>
          <Link
            className={`${ui.primary} ${styles.joinButton}`}
            to={JOIN_CTA.cta.href}
            data-fog-clear="box"
          >
            {JOIN_CTA.cta.label} <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </>
  )
}
