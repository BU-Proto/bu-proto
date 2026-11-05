import { Link } from 'react-router'
import { HERO_COPY } from '../content/home'
import ui from './ui.module.css'
import styles from './Hero.module.css'

/**
 * The home hero: who Proto is and the two ways in, set low over the field in the same column and
 * type as the sections below, so the page reads as one piece from the first screen.
 */
export function Hero() {
  const { headline, lede, primaryCta, secondaryCta } = HERO_COPY

  return (
    <section className={styles.hero}>
      <h1 className={styles.headline} data-fog-clear>
        {headline}
      </h1>
      <p className={styles.lede} data-fog-clear>
        {lede}
      </p>
      <div className={styles.ctas}>
        <Link className={`${ui.primary} ${styles.primary}`} to={primaryCta.href} data-fog-clear="box">
          {primaryCta.label}
        </Link>
        <Link className={ui.textLink} to={secondaryCta.href} data-fog-clear>
          {secondaryCta.label}
        </Link>
      </div>
    </section>
  )
}
