import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_TALLY } from '../content/wins'
import { tallyWins } from '../lib/wins'
import { NumberTicker } from './motion/NumberTicker'
import { SampleTag } from './SampleTag'
import ui from './ui.module.css'
import styles from './WinTally.module.css'

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

/**
 * The running record, set as one sentence with the numbers in ink: "12 wins at 9 hackathons, by
 * 31 builders." Counts up the first time it's seen. Renders nothing until there's a win to count.
 */
export function WinTally({ wins, showLink = false }: { wins: readonly Win[]; showLink?: boolean }) {
  const tally = tallyWins(wins)
  if (tally.wins === 0) return null

  return (
    <section className={styles.tally} aria-label={WIN_TALLY.label}>
      <p className={styles.line}>
        <span className={styles.figure}>
          <b>
            <NumberTicker value={tally.wins} />
          </b>{' '}
          {plural(tally.wins, 'win', 'wins')}
        </span>{' '}
        <span className={styles.figure}>
          at{' '}
          <b>
            <NumberTicker value={tally.hackathons} />
          </b>{' '}
          {plural(tally.hackathons, 'hackathon', 'hackathons')},
        </span>{' '}
        <span className={styles.figure}>
          by{' '}
          <b>
            <NumberTicker value={tally.builders} />
          </b>{' '}
          {plural(tally.builders, 'builder', 'builders')}.
        </span>
      </p>
      <p className={styles.note}>
        {tally.firsts > 0 && `${tally.firsts} of them first place. `}
        {WIN_TALLY.note}
        <SampleTag show={tally.sample} />
        {showLink && (
          <>
            {' '}
            <Link className={ui.textLink} to="/wins">
              {WIN_TALLY.link}
            </Link>
          </>
        )}
      </p>
    </section>
  )
}
