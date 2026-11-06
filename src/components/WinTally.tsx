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
 * The running record, set as one sentence with the numbers large: "12 wins at 9 hackathons, by
 * 31 builders." Counts up the first time it's seen. Renders nothing until there's a win to count.
 * Each count is in the colour of what it counts: wins the peak's rose, hackathons the trips' iris,
 * builders the everyday sky of hack night.
 */
export function WinTally({ wins, showLink = false }: { wins: readonly Win[]; showLink?: boolean }) {
  const tally = tallyWins(wins)
  if (tally.wins === 0) return null

  return (
    <section className={styles.tally} aria-label={WIN_TALLY.label}>
      <p className={styles.line} data-fog-clear>
        <span className={styles.figure}>
          <b data-hue="rose">
            <NumberTicker value={tally.wins} />
          </b>{' '}
          {plural(tally.wins, 'win', 'wins')}
        </span>{' '}
        <span className={styles.figure}>
          at{' '}
          <b data-hue="iris">
            <NumberTicker value={tally.hackathons} />
          </b>{' '}
          {plural(tally.hackathons, 'hackathon', 'hackathons')},
        </span>{' '}
        <span className={styles.figure}>
          by{' '}
          <b data-hue="sky">
            <NumberTicker value={tally.builders} />
          </b>{' '}
          {plural(tally.builders, 'builder', 'builders')}.
        </span>
      </p>
      <p className={styles.note} data-fog-clear>
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
