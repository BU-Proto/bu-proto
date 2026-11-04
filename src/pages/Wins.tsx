import type { CSSProperties } from 'react'
import { useLoaderData } from 'react-router'
import type { Win } from '../../shared/api'
import { PageIntro } from '../components/PageIntro'
import { SampleTag } from '../components/SampleTag'
import ui from '../components/ui.module.css'
import { WINS_EMPTY, WINS_INTRO } from '../content/wins'
import styles from './Wins.module.css'

const TILTS = [-1.2, 0.8, -0.4, 1.1, -0.9, 0.5]

/** One win: photo, placement ribbon, project, team and the Devpost link. `rank` tilts the card. */
export function WinCard({ win, rank }: { win: Win; rank: number }) {
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
        <span className={styles.ribbon} data-fog-clear="box">
          {win.placement}
        </span>
      </div>

      <div className={styles.body}>
        <p className={styles.event} data-fog-clear>
          {win.event} <SampleTag show={win.placeholder} />
        </p>
        <h3 className={styles.project} data-fog-clear>
          {win.project}
        </h3>
        {win.blurb && (
          <p className={styles.blurb} data-fog-clear>
            {win.blurb}
          </p>
        )}
        {win.team.length > 0 && (
          <p className={styles.team} data-fog-clear>
            <span className={styles.teamLabel}>team</span> {win.team.join(', ')}
          </p>
        )}
        {win.devpost ? (
          <a className={ui.textLink} href={win.devpost} target="_blank" rel="noreferrer" data-fog-clear>
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
