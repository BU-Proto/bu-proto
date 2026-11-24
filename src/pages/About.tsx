import type { CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { Role } from '../../shared/api'
import { RevealWords } from '../components/motion/RevealWords'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { CircleMark } from '../components/CircleMark'
import { Pictogram } from '../components/Pictogram'
import ui from '../components/ui.module.css'
import { TrackPicture } from '../components/WaysIn'
import { ABOUT_INTRO, OFFER, WHAT, WHO, WHY, type Offer } from '../content/about'
import { JOIN_CTA, TRACKS } from '../content/home'
import { BRAND } from '../content/site'
import { rolePath } from '../lib/paths'
import { openSeats } from '../lib/roles'
import styles from './About.module.css'

/**
 * What Proto is, as one page: the statement on the field, then on harbor what it is and why, the
 * offers as a wall of tiles (each with its drawing, name, one line and the page it lives on), who
 * runs it, and the ask. The tiles are the page's one big moment; the rest stays short.
 */
export function About() {
  // Without the roles (they couldn't load) there's no telling which seats are open, so none are listed.
  const roles = useLoaderData<Role[] | null>()
  const open = roles ? openSeats(roles) : []
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div className={`${ui.page} ${styles.page}`}>
      <title>{`${ABOUT_INTRO.tab} · ${BRAND.name}`}</title>

      <header className={styles.intro} data-ground-after="">
        <h1 className={styles.title} data-fog-clear>
          {ABOUT_INTRO.title}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {ABOUT_INTRO.lede}
        </p>
      </header>

      <section className={`${styles.row} ${styles.what}`} aria-labelledby="what">
        <h2 id="what" className={styles.rowTitle}>
          {WHAT.title}
        </h2>
        <div className={styles.rowBody}>
          <p className={styles.statement}>{WHAT.text}</p>
          <p className={styles.note}>{WHAT.tracksLead}</p>
          {/* A sequence, first-timer to founder, so an ordered list, each with its drawing. */}
          <ol className={styles.tracks}>
            {TRACKS.map((track) => (
              <li key={track.name} className={styles.track} data-hue={track.hue}>
                <TrackPicture name={track.picture} className={styles.glyph} />
                <span className={styles.trackName}>{track.name}</span>
                <span className={styles.trackWho}>{track.who}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.row} aria-labelledby="why">
        <h2 id="why" className={styles.rowTitle}>
          {WHY.title}
        </h2>
        <div className={styles.rowBody}>
          <p className={styles.statement}>{WHY.text}</p>
        </div>
      </section>

      {/* The one reveal on the page: the directory's title, word by word. */}
      <div ref={revealRef} className={motion.reveal}>
        <section id={OFFER.id} className={styles.offer} aria-labelledby="offer-title">
          <header className={styles.offerHead}>
            <h2 id="offer-title" className={styles.title} data-reveal="words">
              <RevealWords text={OFFER.title} />
            </h2>
            <p className={styles.offerLede}>{OFFER.lede}</p>
          </header>

          <ul className={styles.tiles}>
            {(OFFER.items as readonly Offer[]).map((item, index) => (
              <li
                key={item.name}
                className={styles.tile}
                data-tone={item.tone}
                data-soon={item.soon ? '' : undefined}
                data-circle={item.circle ? '' : undefined}
                data-reveal="rise"
                style={{ '--d': `${(index % 4) * 70}ms` } as CSSProperties}
              >
                <span className={styles.tilePicture}>
                  {item.picture === 'circle' ? <CircleMark /> : <Pictogram name={item.picture} />}
                </span>
                {(item.soon || item.circle) && <span className={styles.tileFlag}>{item.soon ?? item.circle}</span>}
                <h3 className={styles.tileName}>
                  <Link className={styles.stretch} to={item.where.href}>
                    {item.name}
                  </Link>
                </h3>
                <p className={styles.tileText}>{item.text}</p>
                <span className={styles.tileWhere} aria-hidden="true">
                  {item.where.label} →
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.row} aria-labelledby="who">
        <h2 id="who" className={styles.rowTitle}>
          {WHO.title}
        </h2>
        <div className={styles.rowBody}>
          <p className={styles.statement}>{WHO.text}</p>
          {open.length > 0 && (
            <div className={styles.seats}>
              <h3 className={styles.seatsLead}>{WHO.openLead}</h3>
              <ul className={styles.seatList}>
                {open.map((seat) => (
                  <li key={seat.id}>
                    <Link className={ui.textLink} to={rolePath(seat)}>
                      {seat.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className={styles.links}>
            <Link className={ui.textLink} to={WHO.board.href}>
              {WHO.board.label}
            </Link>
            {open.length > 0 && (
              <Link className={ui.textLink} to={WHO.apply.href}>
                {WHO.apply.label}
              </Link>
            )}
          </p>
        </div>
      </section>

      <section className={styles.join} aria-labelledby="join">
        <h2 id="join" className={styles.title}>
          {JOIN_CTA.title}
        </h2>
        <p className={styles.lede}>{JOIN_CTA.lede}</p>
        <Link className={`${ui.primary} ${styles.joinButton}`} to={JOIN_CTA.cta.href}>
          {JOIN_CTA.cta.label}
        </Link>
      </section>
    </div>
  )
}
