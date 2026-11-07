import { HERO_COPY } from '../content/home'
import { HeroBloom } from './HeroBloom'
import styles from './Hero.module.css'

/**
 * The home hero: the old bloom burning on the dark ground, turning to type in its own light. The page's
 * heading stays for screen readers and search.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <HeroBloom />
      <h1 className={styles.heading}>{HERO_COPY.headline}</h1>
    </section>
  )
}
