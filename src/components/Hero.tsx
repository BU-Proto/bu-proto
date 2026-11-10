import { useRef } from 'react'
import { HERO_COPY } from '../content/home'
import { HeroRings } from './HeroRings'
import { HeroSeam } from './HeroSeam'
import styles from './Hero.module.css'

/**
 * The home hero: rings of block-shade type in the bloom's colours filling the screen, turning round
 * Proto's name at its centre, where the rings make room for it. The way in is Join in the top bar.
 * Below the hero's foot the light breaks off into the page along a seam of text cells.
 */
export function Hero() {
  const { headline } = HERO_COPY
  const hero = useRef<HTMLElement>(null)

  return (
    <section ref={hero} className={styles.hero}>
      <HeroRings hero={hero} />
      <HeroSeam hero={hero} />
      <h1 className={styles.headline} data-fog-clear data-ring-clear>
        {headline}
      </h1>
    </section>
  )
}
