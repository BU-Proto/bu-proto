import { useRef } from 'react'
import { Link } from 'react-router'
import { HERO_COPY } from '../content/home'
import { HeroRings } from './HeroRings'
import ui from './ui.module.css'
import styles from './Hero.module.css'

/**
 * The home hero: rings of block-shade type in the bloom's colours, turning round a centre on the
 * black, with what Proto is and the way in set in a centred column low on the screen, where the rings
 * make room for them.
 */
export function Hero() {
  const { headline, lede, primaryCta } = HERO_COPY
  const hero = useRef<HTMLElement>(null)

  return (
    <section ref={hero} className={styles.hero}>
      <HeroRings hero={hero} />
      <div className={styles.copy}>
        <h1 className={styles.headline} data-fog-clear data-ring-clear>
          {headline}
        </h1>
        <p className={styles.lede} data-fog-clear data-ring-clear>
          {lede}
        </p>
        <Link className={`${ui.primary} ${styles.join}`} to={primaryCta.href} data-ring-clear>
          {primaryCta.label}
        </Link>
      </div>
    </section>
  )
}
