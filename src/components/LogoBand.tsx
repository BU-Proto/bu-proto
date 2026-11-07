import { Link } from 'react-router'
import type { CSSProperties } from 'react'
import { LOGO_BAND, LOGO_WALLS, type Logo } from '../content/trackRecord'
import { MaskLines } from './motion/MaskLines'
import ui from './ui.module.css'
import styles from './LogoBand.module.css'

const ROWS = 3
/** Enough names to split between the rows instead of showing them all in each. */
const ENOUGH_TO_SPLIT = 9
/** Logos per half of a row's loop, so a short list still runs edge to edge. */
const MIN_SLOTS = 10

/** One set of logos per row: split up when there are plenty, or all of them, starting further along. */
function rowsOf(logos: readonly Logo[]): Logo[][] {
  return Array.from({ length: ROWS }, (_, row) => {
    if (logos.length >= ENOUGH_TO_SPLIT) return logos.filter((_, index) => index % ROWS === row)
    return [...logos.slice(row % logos.length), ...logos.slice(0, row % logos.length)]
  })
}

/** One brand in one voice: its file painted in the page's ink, or its name until there's a file. */
function Mark({ logo, hidden }: { logo: Logo; hidden: boolean }) {
  const mark = logo.src ? (
    <span
      className={styles.logo}
      role="img"
      aria-label={logo.name}
      style={{ '--logo': `url("${logo.src}")` } as CSSProperties}
    />
  ) : (
    <span className={styles.wordmark}>{logo.name}</span>
  )
  return logo.href ? (
    <a className={styles.item} href={logo.href} target="_blank" rel="noreferrer" tabIndex={hidden ? -1 : undefined}>
      {mark}
    </a>
  ) : (
    <span className={styles.item}>{mark}</span>
  )
}

/**
 * Partners and sponsors: three rows of logos, each in the same square slot and the same ink,
 * drifting left at their own speeds. Real, verified names only (see content/trackRecord.ts);
 * renders nothing if there are none. Each row plays twice over for a seamless loop, and only the
 * first row's first pass is for screen readers and the keyboard. Under reduced motion it's that
 * one row, still.
 */
export function LogoBand({ showLink = true }: { showLink?: boolean }) {
  const logos = LOGO_WALLS.filter((wall) => LOGO_BAND.walls.includes(wall.id)).flatMap((wall) => wall.logos)
  if (logos.length === 0) return null

  return (
    <section className={styles.band} aria-label={LOGO_BAND.label}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          <MaskLines text={LOGO_BAND.title} />
        </h2>
        <p className={styles.lede} data-reveal="rise">
          {LOGO_BAND.lede}
        </p>
      </div>

      <div className={styles.rows}>
        {rowsOf(logos).map((row, rowIndex) => {
          const slots = Array.from({ length: Math.ceil(MIN_SLOTS / row.length) }, () => row).flat()
          return (
            <div
              key={rowIndex}
              className={styles.row}
              data-fast={rowIndex === 1 || undefined}
              aria-hidden={rowIndex > 0 || undefined}
              style={{ '--count': slots.length } as CSSProperties}
            >
              <div className={styles.track}>
                {[false, true].map((copy) =>
                  slots.map((logo, index) => (
                    <Mark key={`${copy}-${index}`} logo={logo} hidden={copy || rowIndex > 0 || index >= row.length} />
                  )),
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showLink && (
        <p className={styles.more}>
          <Link className={ui.textLink} to={LOGO_BAND.link.href}>
            {LOGO_BAND.link.label}
          </Link>
        </p>
      )}
    </section>
  )
}
