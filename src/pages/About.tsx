import { Link, useLoaderData } from 'react-router'
import type { BoardMember } from '../../shared/api'
import { RevealWords } from '../components/motion/RevealWords'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import ui from '../components/ui.module.css'
import { ABOUT_INTRO, OFFER, WHAT, WHO, WHY } from '../content/about'
import { OPEN_SEATS } from '../content/board'
import { JOIN_CTA, TRACKS } from '../content/home'
import { BRAND } from '../content/site'
import styles from './About.module.css'

/**
 * The seats nobody has taken, by the board page's rule: a member whose role names a seat fills
 * it. Without the board (it couldn't load) there's no telling, so none are listed.
 */
function openSeats(board: BoardMember[] | null) {
  if (!board) return []
  return OPEN_SEATS.filter(
    (seat) => !board.some((member) => member.role.toLowerCase().includes(seat.role.toLowerCase().replace(/^the /, ''))),
  )
}

/**
 * What Proto is, as one page: the statement on the field, then on harbor what it is and why, the
 * offers as a directory of the site (each one's name, what it is, and the page it lives on), who
 * runs it, and the ask. The directory is the page's one big moment; the rest stays quiet.
 */
export function About() {
  const board = useLoaderData<BoardMember[] | null>()
  const open = openSeats(board)
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div className={`${ui.page} ${styles.page}`}>
      <title>{`${ABOUT_INTRO.tab} · ${BRAND.full}`}</title>

      <header className={styles.intro}>
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
          {/* A sequence, first-timer to founder, so an ordered list, each with its trail glyph. */}
          <ol className={styles.tracks}>
            {TRACKS.map((track) => (
              <li key={track.name} className={styles.track} data-hue={track.hue}>
                <span className={styles.glyph} aria-hidden="true">
                  {track.glyph}
                </span>
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

          <ul className={styles.directory}>
            {OFFER.items.map((item) => (
              <li
                key={item.name}
                className={styles.entry}
                data-soon={'soon' in item || undefined}
                data-hue={'hue' in item ? item.hue : undefined}
              >
                <h3 className={styles.entryName}>
                  <Link className={styles.stretch} to={item.where.href}>
                    {item.name}
                  </Link>
                </h3>
                <p className={styles.entryText}>
                  {'soon' in item && <span className={styles.soon}>{item.soon} </span>}
                  {item.text}
                </p>
                <span className={styles.where}>{item.where.label}</span>
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
                  <li key={seat.role}>{seat.role}</li>
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
