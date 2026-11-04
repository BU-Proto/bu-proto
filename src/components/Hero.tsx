import { Link } from 'react-router'
import { HERO_COPY } from '../content/home'
import styles from './Hero.module.css'

/** The home hero: just the headline and the two calls to action over the field, one screen tall. */
export function Hero() {
  const { headline, lede, primaryCta, secondaryCta } = HERO_COPY

  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <h1 className={styles.headline} data-fog-clear>
          {headline[0]}
          <br />
          {headline[1]}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {lede}
        </p>
      </div>

      <div className={styles.ctas}>
        <Link className={styles.primary} to={primaryCta.href} data-fog-clear="box">
          {primaryCta.label} <span aria-hidden="true">→</span>
        </Link>
        <Link className={styles.secondary} to={secondaryCta.href} data-fog-clear>
          {secondaryCta.label}
        </Link>
      </div>
    </section>
  )
}
