import { Link, useLoaderData } from 'react-router'
import { Hero } from '../components/Hero'
import { NoteIcon } from '../components/icons'
import { SampleTag } from '../components/SampleTag'
import { ScheduleCard } from '../components/ScheduleCard'
import ui from '../components/ui.module.css'
import { HOME_EMPTY, JOIN_CTA, NOTES, RHYTHM, RHYTHM_INTRO, TRACKS, TRACKS_INTRO } from '../content/home'
import { BRAND, SCHEDULE } from '../content/site'
import { WINS_EMPTY } from '../content/wins'
import type { HomeData } from '../lib/content'
import { dateParts, daysUntil, formatDay } from '../lib/dates'
import { WinCard } from './Wins'
import styles from './Home.module.css'

export function Home() {
  const { events, hackathons, wins } = useLoaderData<HomeData>()
  const nextEvent = events
    .filter((event) => daysUntil(event.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  const deadlines = hackathons
    .filter((hackathon) => daysUntil(hackathon.applyBy) >= 0)
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

        <ul className={`${ui.panel} ${styles.notes}`}>
          {NOTES.map((note) => (
            <li key={note.text} className={styles.note}>
              <NoteIcon name={note.icon} className={styles.noteIcon} />
              <span data-fog-clear>{note.text}</span>
              {note.link && (
                <Link className={ui.textLink} to={note.link.href} data-fog-clear>
                  {note.link.label} <span aria-hidden="true">→</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

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
                  {nextEvent.text && (
                    <p className={styles.nextText} data-fog-clear>
                      {nextEvent.text}
                    </p>
                  )}
                  <Link className={ui.textLink} to="/events" data-fog-clear>
                    All events <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.nextCopy}>
                <p className={styles.nextMeta} data-fog-clear>
                  {HOME_EMPTY.next}
                </p>
                <Link className={ui.textLink} to="/events" data-fog-clear>
                  All events <span aria-hidden="true">→</span>
                </Link>
              </div>
            )}
          </section>

          <ScheduleCard
            className={styles.schedule}
            location={SCHEDULE.location}
            slots={SCHEDULE.slots}
            placeholder={SCHEDULE.placeholder}
          />

          <section className={`${ui.panelDeep} ${styles.deadlines}`} aria-labelledby="deadlines">
            <h2 id="deadlines" className={ui.eyebrow} data-fog-clear>
              Apply by
            </h2>
            {deadlines.length === 0 ? (
              <p className={styles.nextMeta} data-fog-clear>
                {HOME_EMPTY.deadlines}
              </p>
            ) : (
              <ol className={styles.deadlineList}>
                {deadlines.map((hackathon) => (
                  <li key={hackathon.id} className={styles.deadline}>
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
            )}
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
          {wins.length === 0 ? (
            <p className={ui.panel} data-fog-clear>
              {WINS_EMPTY}
            </p>
          ) : (
            <ul className={styles.wins}>
              {wins.slice(0, 3).map((win, index) => (
                <WinCard key={win.id} win={win} rank={index} />
              ))}
            </ul>
          )}
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
