import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_SHOWCASE } from '../content/wins'
import { dateParts } from '../lib/dates'
import { accoladeOf, teamParts } from './accolade'
import { BuMark } from './BuMark'
import { SampleTag } from './SampleTag'
import styles from './WinLog.module.css'

/**
 * The landing's latest wins, as a log: when, the cover shown whole at a small size, then the
 * prize, where, the project and who built it. A row per win, ruled apart, newest at the top.
 * Covers are Devpost screenshots, so they're never blown up or set behind text.
 */
export function WinLog({ wins }: { wins: readonly Win[] }) {
  return (
    <ol className={styles.log}>
      {wins.map((win, index) => {
        const { prize, rank, note, hackathon } = accoladeOf(win)
        const when = win.date ? dateParts(win.date) : null
        const team = teamParts(win.team, 4)
        return (
          // Each row settles in as it comes up the screen, when inside a reveal wrapper.
          <li
            key={win.id}
            className={styles.entry}
            data-reveal="rise"
            style={{ '--d': `${index * 70}ms` } as CSSProperties}
          >
            {/* The row is one link for the pointer; screen readers and the tab order get the name. */}
            <Link className={styles.overlay} to={`/wins/${win.id}`} tabIndex={-1} aria-hidden="true" />
            <p className={styles.when}>
              {when && (
                <time dateTime={win.date}>
                  {when.month} {when.day}
                  <span className={styles.year}>{win.date.slice(0, 4)}</span>
                </time>
              )}
            </p>
            <div className={styles.cover}>
              {win.photo ? (
                <img src={win.photo} alt="" loading="lazy" decoding="async" />
              ) : (
                <span className={styles.noPhoto} aria-hidden="true">
                  {'○ > _'}
                </span>
              )}
            </div>
            <div className={styles.copy}>
              <h3 className={styles.prize}>
                {rank && `${rank}, `}
                {prize}
              </h3>
              <p className={styles.where}>
                {note && <span className={styles.note}>{note}, </span>}
                {WIN_SHOWCASE.at} {hackathon}
              </p>
              <p className={styles.project}>
                <Link className={styles.name} to={`/wins/${win.id}`}>
                  {win.project}
                </Link>
                <SampleTag show={win.placeholder} />
              </p>
              {win.blurb && <p className={styles.blurb}>{win.blurb}</p>}
              {team.length > 0 && (
                <p className={styles.team}>
                  {WIN_SHOWCASE.builtBy}{' '}
                  {team.map((part, i) =>
                    part.kind === 'name' ? (
                      <span key={i} className={styles.member}>
                        {part.text}
                        {part.bu && <BuMark />}
                      </span>
                    ) : (
                      part.text
                    ),
                  )}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
