import { Link } from 'react-router'
import { HERO_COPY } from '../content/home'
import { HeroBloom } from './HeroBloom'
import ui from './ui.module.css'
import styles from './Hero.module.css'

/**
 * The home hero: the old bloom burning on the dark ground, turning to blocks in its own light, with
 * what Proto is and the way in set in a centred column low on the screen.
 */
export function Hero() {
  const { headline, lede, primaryCta } = HERO_COPY

  return (
    <section className={styles.hero}>
      <HeroBloom />
      <div className={styles.copy}>
        <h1 className={styles.headline} data-fog-clear>
          {headline}
        </h1>
        <p className={styles.lede} data-fog-clear>
          {lede}
        </p>
        <Link className={`${ui.primary} ${styles.join}`} to={primaryCta.href}>
          {primaryCta.label}
        </Link>
      </div>
    </section>
  )
}
