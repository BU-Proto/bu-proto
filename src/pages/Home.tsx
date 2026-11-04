import { Link } from 'react-router'
import { Hero } from '../components/Hero'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { EVENTS } from '../content/events'
import { HACKATHONS } from '../content/hackathons'
import { JOIN_CTA, RHYTHM, RHYTHM_INTRO, TRACKS, TRACKS_INTRO } from '../content/home'
import { BRAND } from '../content/site'
import { WINS } from '../content/wins'
import { dateParts, daysUntil, formatDay } from '../lib/dates'
import { WinCard } from './Wins'
import styles from './Home.module.css'

export function Home() {
  const nextEvent = EVENTS.filter((event) => daysUntil(event.date) >= 0).sort((a, b) =>
    a.date.localeCompare(b.date),
  )[0]
  const deadlines = HACKATHONS.filter((hackathon) => daysUntil(hackathon.applyBy) >= 0)
    .sort((a, b) => a.applyBy.localeCompare(b.applyBy))
    .slice(0, 3)

  return (
    <>
      <title>{`${BRAND.full} · Your home base for making things`}</title>
      <Hero />

      <div className={ui.page}>
        <section aria-labelledby="tracks">
          <div className={ui.sectionHead}>
            <h2 id="tracks" className={ui.sectionTitle} data-fog-clear>
              {TRACKS_INTRO.title}
            </h2>
            <p className={ui.sectionLede} data-fog-clear>
              {TRACKS_INTRO.lede}
            </p>
          </div>
          <ol className={styles.tracks}>
            {TRACKS.map((track, index) => (
              <li key={track.name} className={`${ui.panel} ${styles.track}`}>
                <span className={styles.glyph} aria-hidden="true">
                  {track.glyph}
                </span>
                <p className={ui.eyebrow} data-fog-clear>
                  {String(index + 1).padStart(2, '0')} / track
                </p>
                <h3 className={styles.trackName} data-fog-clear>
                  {track.name}
                </h3>
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
              </li>
            ))}
          </ol>
        </section>

        <section className={ui.panel} aria-labelledby="rhythm">
          <div className={ui.sectionHead}>
            <h2 id="rhythm" className={ui.sectionTitle} data-fog-clear>
              {RHYTHM_INTRO.title}
            </h2>
            <p className={ui.sectionLede} data-fog-clear>
              {RHYTHM_INTRO.lede}
            </p>
          </div>
          <ol className={styles.rhythm}>
            {RHYTHM.map((beat) => (
              <li key={beat.what} className={styles.beat} data-later={beat.later || undefined}>
                <span className={styles.tick} aria-hidden="true" />
                <p className={ui.eyebrow} data-fog-clear>
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

        <div className={styles.split}>
          <section className={`${ui.panel} ${styles.next}`} aria-labelledby="next-event">
            <h2 id="next-event" className={ui.eyebrow} data-fog-clear>
              Next up
            </h2>
            {nextEvent ? (
              <div className={styles.nextBody}>
                <div className={styles.tile} data-fog-clear="box">
                  <span>{dateParts(nextEvent.date).month}</span>
                  <b>{dateParts(nextEvent.date).day}</b>
                  <span>{dateParts(nextEvent.date).weekday}</span>
                </div>
                <div className={styles.nextCopy}>
                  <p className={styles.kind} data-fog-clear>
                    {nextEvent.kind} <SampleTag show={nextEvent.placeholder} />
                  </p>
                  <h3 className={styles.nextTitle} data-fog-clear>
                    {nextEvent.title}
                  </h3>
                  <p className={styles.nextMeta} data-fog-clear>
                    {nextEvent.time} · {nextEvent.place}
                  </p>
                  <p className={styles.nextText} data-fog-clear>
                    {nextEvent.text}
                  </p>
                  <Link className={ui.textLink} to="/events" data-fog-clear>
                    All events <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <p data-fog-clear>Nothing on the calendar yet. Check back soon.</p>
            )}
          </section>

          <section className={`${ui.panelDeep} ${styles.deadlines}`} aria-labelledby="deadlines">
            <h2 id="deadlines" className={ui.eyebrow} data-fog-clear>
              Apply by
            </h2>
            <ol className={styles.deadlineList}>
              {deadlines.map((hackathon) => (
                <li key={hackathon.name} className={styles.deadline}>
                  <span className={styles.countdown} data-fog-clear>
                    T-{daysUntil(hackathon.applyBy)}d
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
            <Link className={ui.textLink} to="/hackathons" data-fog-clear>
              Every hackathon <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>

        <section aria-labelledby="latest-wins">
          <div className={ui.sectionHead}>
            <h2 id="latest-wins" className={ui.sectionTitle} data-fog-clear>
              Latest wins
            </h2>
            <Link className={ui.textLink} to="/wins" data-fog-clear>
              All wins <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ul className={styles.wins}>
            {WINS.slice(0, 3).map((win, index) => (
              <WinCard key={win.project} win={win} rank={index} />
            ))}
          </ul>
        </section>

        <section className={`${ui.panel} ${styles.join}`} aria-labelledby="join-cta">
          <h2 id="join-cta" className={styles.joinTitle} data-fog-clear>
            {JOIN_CTA.title}
          </h2>
          <p className={styles.joinLede} data-fog-clear>
            {JOIN_CTA.lede}
          </p>
          <Link className={ui.primary} to={JOIN_CTA.cta.href} data-fog-clear="box">
            {JOIN_CTA.cta.label} <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </>
  )
}
