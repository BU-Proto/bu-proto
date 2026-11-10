import type { Win } from '../../shared/api'
import { WON_AT, type WonAtSchool } from '../content/wins'
import { Mark } from './LogoBand'
import { Marquee } from './motion/Marquee'
import styles from './LogoBand.module.css'

/** Copies per half of a row's loop, so a row of two or three schools still runs edge to edge. */
const MIN_ITEMS = 8

/** Seconds each logo takes to cross its own width and gap: a row's loop is this times its logos. */
const SECONDS_PER_LOGO = 5

/** Below this many schools one row is plenty. */
const TWO_ROWS_FROM = 4

/**
 * The schools whose hackathons we've won at, scrolling across the full width in two rows that
 * pass each other, the top one leftward and the one under it rightward. Counted from the wins
 * themselves: a school appears only if a real, published win was at one of its hackathons.
 * Renders nothing until there is one.
 */
export function WonAtBand({ wins }: { wins: readonly Win[] }) {
  const real = wins.filter((win) => win.published && !win.placeholder)
  const schools = WON_AT.schools.filter((school) => real.some((win) => school.events.test(win.event)))
  if (schools.length === 0) return null

  const half = schools.length >= TWO_ROWS_FROM ? Math.ceil(schools.length / 2) : schools.length
  const rows = [schools.slice(0, half), schools.slice(half)].filter((row) => row.length > 0)

  return (
    <section className={styles.band} aria-label={WON_AT.label}>
      <div className={styles.head}>
        <p className={styles.title} data-fog-clear>
          {WON_AT.title}
        </p>
      </div>
      <div className={styles.rows}>
        {rows.map((row, index) => (
          <Row key={row[0]!.name} schools={row} reverse={index % 2 === 1} label={WON_AT.rowLabel(index + 1, rows.length)} />
        ))}
      </div>
    </section>
  )
}

function Row({ schools, reverse, label }: { schools: readonly WonAtSchool[]; reverse: boolean; label: string }) {
  const repeat = Math.ceil(MIN_ITEMS / schools.length)
  return (
    <Marquee label={label} duration={schools.length * repeat * SECONDS_PER_LOGO} reverse={reverse} repeat={repeat}>
      {schools.map((school) => (
        <Mark key={school.name} logo={school} eager />
      ))}
    </Marquee>
  )
}
