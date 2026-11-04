import type { CSSProperties } from 'react'
import { Link, useLoaderData } from 'react-router'
import type { Win } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { WINS_EMPTY, WINS_INTRO } from '../content/wins'
import styles from './Wins.module.css'

const TILTS = [-1.2, 0.8, -0.4, 1.1, -0.9, 0.5]

/** "Built by Maya, Jordan and Priya", or the first two and a count once the team gets long. */
function teamLine(team: Win['team']): string {
  const names = (team ?? []).map((person) => person.name).filter(Boolean)
  if (names.length === 0) return ''
  const shown = names.length > 3 ? [...names.slice(0, 2), `${names.length - 2} more`] : names
  return `Built by ${new Intl.ListFormat('en', { type: 'conjunction' }).format(shown)}`
}

/**
 * One win: photo, then the placement set large as the card's headline, project, team and Devpost.
 * The project name's link stretches over the whole card; Devpost sits above it so it still works.
 * `rank` tilts the card.
 */
export function WinCard({ win, rank }: { win: Win; rank: number }) {
  const team = teamLine(win.team)
  return (
    <li className={styles.card} style={{ '--tilt': `${TILTS[rank % TILTS.length]}deg` } as CSSProperties}>
      <div className={styles.photo}>
        {win.photo ? (
          <img src={win.photo} alt={`${win.project} at ${win.event}`} loading="lazy" />
        ) : (
          <span className={styles.noPhoto} aria-hidden="true">
            {'○ > _ ○ > _'}
            <br />
            {'> _ ○ > _ ○'}
            <br />
            {'_ ○ > _ ○ >'}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.placement} data-fog-clear>
          {win.placement}
        </p>
        <h3 className={styles.project} data-fog-clear>
          <Link className={styles.cardLink} to={`/wins/${win.id}`}>
            {win.project}
          </Link>
          <SampleTag show={win.placeholder} />
        </h3>
        <p className={styles.event} data-fog-clear>
          {win.event}
        </p>
        {win.blurb && (
          <p className={styles.blurb} data-fog-clear>
            {win.blurb}
          </p>
        )}
        {team && (
          <p className={styles.team} data-fog-clear>
            {team}
          </p>
        )}
        {win.devpost ? (
          <a className={`${ui.textLink} ${styles.link}`} href={win.devpost} target="_blank" rel="noreferrer" data-fog-clear>
            Devpost <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className={styles.noLink} data-fog-clear>
            Devpost link coming
          </span>
        )}
      </div>
    </li>
  )
}

export function Wins() {
  const wins = useLoaderData<Win[]>()

  return (
    <div className={ui.page}>
      <PageIntro intro={WINS_INTRO} />
      {wins.length === 0 ? (
        <p className={ui.panel} data-fog-clear>
          {WINS_EMPTY}
        </p>
      ) : (
        <ul className={styles.grid}>
          {wins.map((win, index) => (
            <WinCard key={win.id} win={win} rank={index} />
          ))}
        </ul>
      )}
    </div>
  )
}
