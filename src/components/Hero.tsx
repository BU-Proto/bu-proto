import { Link } from 'react-router'
import { HERO_COPY } from '../content/home'
import ui from './ui.module.css'
import styles from './Hero.module.css'

/**
 * The home hero: the field's light fills the screen, with what Proto is and the way in set in a
 * centred column low on it, as main lays it out.
 */
export function Hero() {
  const { headline, lede, primaryCta } = HERO_COPY

  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <h1 className={styles.headline} data-fog-clear>
          {headline}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {lede}
        </p>
        <Link className={`${ui.primary} ${styles.primary}`} to={primaryCta.href} data-fog-clear="box">
          {primaryCta.label}
        </Link>
      </div>
    </section>
  )
}
