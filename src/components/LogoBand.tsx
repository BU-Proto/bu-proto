import { Link } from 'react-router'
import { LOGO_BAND, LOGO_WALLS, type Logo } from '../content/trackRecord'
import { Marquee } from './motion/Marquee'
import ui from './ui.module.css'
import styles from './LogoBand.module.css'

/** Copies per half of the loop, so a band of two or three names still runs edge to edge. */
const MIN_ITEMS = 8

/**
 * One name in a band: its logo when there's a file for it, its name as a wordmark until then.
 * `eager` loads the file with the page instead of when it nears the screen. A band whose logos
 * arrive one by one changes width as it runs, and its two looping copies drift out of step.
 */
export function Mark({ logo, eager = false }: { logo: Logo; eager?: boolean }) {
  const mark = logo.src ? (
    <img
      className={styles.logo}
      src={logo.src}
      alt={logo.name}
      width={logo.size?.[0]}
      height={logo.size?.[1]}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  ) : (
    <span className={styles.wordmark} data-fog-clear>
      {logo.name}
    </span>
  )
  return logo.href ? (
    <a className={styles.item} href={logo.href} target="_blank" rel="noreferrer">
      {mark}
    </a>
  ) : (
    <span className={styles.item}>{mark}</span>
  )
}

/**
 * Partners and sponsors scrolling across the full width, the other way from the home page's
 * notes band. Real, verified names only (see content/trackRecord.ts); renders nothing if there
 * are none.
 */
export function LogoBand({ showLink = true }: { showLink?: boolean }) {
  const logos = LOGO_WALLS.filter((wall) => LOGO_BAND.walls.includes(wall.id)).flatMap((wall) => wall.logos)
  if (logos.length === 0) return null

  return (
    <section className={styles.band} aria-label={LOGO_BAND.label}>
      <div className={styles.head}>
        <p className={styles.title} data-fog-clear>
          {LOGO_BAND.title}
        </p>
        {showLink && (
          <Link className={ui.textLink} to={LOGO_BAND.link.href} data-fog-clear>
            {LOGO_BAND.link.label}
          </Link>
        )}
      </div>
      <Marquee label={LOGO_BAND.label} duration={36} reverse repeat={Math.ceil(MIN_ITEMS / logos.length)}>
        {logos.map((logo) => (
          <Mark key={logo.name} logo={logo} />
        ))}
      </Marquee>
    </section>
  )
}
