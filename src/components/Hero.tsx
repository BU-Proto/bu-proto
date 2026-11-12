import { HERO_COPY } from '../content/home'
import styles from './Hero.module.css'

/**
 * The home hero: the field's light fills the screen, with what Proto is set in a centred column low
 * on it. The way in is in the top bar; the opening lead below says the rest.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <h1 className={styles.headline} data-fog-clear>
          {HERO_COPY.headline}
        </h1>
      </div>
    </section>
  )
}
