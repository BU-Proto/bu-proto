import { HERO_COPY } from '../content/home'
import { RevealWords } from './motion/RevealWords'
import styles from './Hero.module.css'

/** Where the marks stand along the foot of the frame, as shares of its width. */
const MARKS = [0, 1 / 3, 2 / 3, 1] as const

/**
 * The home hero, one screen: what Proto is, set small above a wide rounded frame, and a line of
 * marks under it. The frame is a window. Everything round it is harbor, and through it shows the
 * live field, which stays fixed to the screen, so the frame slides over the light as the page moves.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.tagline} data-reveal="words">
        <RevealWords text={HERO_COPY.headline} />
      </h1>
      <div className={styles.frame} />
      <div className={styles.foot} aria-hidden="true">
        {MARKS.map((at) => (
          <span key={at} className={styles.mark} style={{ left: `${at * 100}%` }} />
        ))}
        <span className={styles.scroll}>{HERO_COPY.scroll}</span>
      </div>
    </section>
  )
}
