import type { CSSProperties } from 'react'
import { WELCOME } from '../content/home'
import { RevealWords } from './motion/RevealWords'
import styles from './Welcome.module.css'

/**
 * Who Proto is for, right under the top: six plain statements on colour tiles, so anyone at any
 * stage, from any side, finds themselves in one. Then the one line on what it takes to come.
 */
export function Welcome() {
  return (
    <section className={styles.welcome} aria-labelledby="welcome" data-grid>
      <h2 id="welcome" className={styles.title} data-reveal="words">
        <RevealWords text={WELCOME.title} />
      </h2>
      <ul className={styles.grid}>
        {WELCOME.items.map((item, index) => (
          <li key={item.text} className={styles.tile} data-tone={item.tone} data-reveal="rise" style={{ '--d': `${index * 70}ms` } as CSSProperties}>
            {item.text}
          </li>
        ))}
      </ul>
      <p className={styles.coda} data-reveal="rise">
        {WELCOME.coda}
      </p>
    </section>
  )
}
