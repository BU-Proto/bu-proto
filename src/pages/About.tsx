import { Link, useLoaderData } from 'react-router'
import type { BoardMember } from '../../shared/api'
import { MaskLines } from '../components/motion/MaskLines'
import motion from '../components/motion/motion.module.css'
import { useReveal } from '../components/motion/useReveal'
import { PixelFlow } from '../components/PixelFlow'
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
 * What Proto is, as one page: the statement, what it is with its tracks as a process, why on the
 * dark panel, the offers as a directory of the site (each one's name, what it is, and the page it
 * lives on), who runs it, and the ask.
 */
export function About() {
  const board = useLoaderData<BoardMember[] | null>()
  const open = openSeats(board)
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div ref={revealRef} className={motion.reveal}>
      <title>{`${ABOUT_INTRO.tab} · ${BRAND.full}`}</title>

      <div className={styles.top}>
        <header className={`${ui.wrap} ${ui.intro}`}>
          <h1 className={ui.introTitle}>
            <MaskLines text={ABOUT_INTRO.title} delay={100} />
          </h1>
          <p className={ui.introLede}>{ABOUT_INTRO.lede}</p>
        </header>
      </div>

      <section className={ui.ed} aria-labelledby="what">
        <div className={`${ui.wrap} ${ui.split}`}>
          <h2 id="what" className={ui.h2}>
            <MaskLines text={WHAT.title} />
          </h2>
          <div className={styles.copy} data-reveal>
            <p className={ui.body}>{WHAT.text}</p>
            <p className={ui.body}>{WHAT.tracksLead}</p>
          </div>
        </div>

        <div className={`${ui.wrap} ${styles.process}`} data-reveal>
          <PixelFlow />
          {/* A sequence, first-timer to founder, so an ordered list. */}
          <ol className={`${ui.steps} ${styles.tracks}`}>
            {TRACKS.map((track, index) => (
              <li key={track.name} className={ui.step}>
                <div className={ui.stepHead}>
                  <span className={ui.badge} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={ui.stepTitle}>{track.name}</span>
                </div>
                <p className={ui.stepText}>{track.who}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={ui.dark} aria-labelledby="why">
        <div className={`${ui.wrap} ${ui.split}`}>
          <h2 id="why" className={ui.darkTitle}>
            <MaskLines text={WHY.title} />
          </h2>
          <p className={styles.whyText} data-reveal>
            {WHY.text}
          </p>
        </div>
      </section>

      <section id={OFFER.id} className={`${ui.proc} ${styles.offer}`} aria-labelledby="offer-title">
        <div className={ui.wrap}>
          <div className={ui.split}>
            <h2 id="offer-title" className={ui.h2}>
              <MaskLines text={OFFER.title} />
            </h2>
            <p className={ui.body} data-reveal>
              {OFFER.lede}
            </p>
          </div>

          <ul className={styles.directory} data-reveal>
            {OFFER.items.map((item) => (
              <li
                key={item.name}
                className={styles.entry}
                data-soon={'soon' in item || undefined}
                data-beat={'hue' in item ? item.hue : undefined}
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
                <span className={styles.where}>
                  <span className={styles.whereLabel}>{item.where.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={ui.ed} aria-labelledby="who">
        <div className={`${ui.wrap} ${ui.split}`}>
          <h2 id="who" className={ui.h2}>
            <MaskLines text={WHO.title} />
          </h2>
          <div className={styles.copy} data-reveal>
            <p className={ui.body}>{WHO.text}</p>
            {open.length > 0 && (
              <div className={styles.seats}>
                <h3 className={styles.seatsLead}>{WHO.openLead}</h3>
                <ul className={styles.seatList}>
                  {open.map((seat) => (
                    <li key={seat.role} className={`${ui.tag} ${ui.tagNavy}`}>
                      {seat.role}
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
        </div>
      </section>

      <section className={ui.cta} aria-labelledby="join">
        <h2 id="join" className={ui.ctaTitle}>
          <MaskLines text={JOIN_CTA.title} />
        </h2>
        <p className={`${ui.body} ${styles.ctaLede}`}>{JOIN_CTA.lede}</p>
        <Link className={ui.btn} to={JOIN_CTA.cta.href}>
          {JOIN_CTA.cta.label}
        </Link>
      </section>
    </div>
  )
}
