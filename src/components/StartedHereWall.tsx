import type { CSSProperties } from 'react'
import { STARTED_HERE } from '../content/home'
import { RevealWords } from './motion/RevealWords'
import styles from './StartedHereWall.module.css'

/**
 * Things that started in Boston, from every kind of field, as ruled rows: the name large, its
 * field on a tag in its own colour, where and when it began. The point is the range: business,
 * science, hardware and software, each begun by a few people here.
 */
export function StartedHereWall() {
  return (
    <section className={styles.wall} aria-labelledby="started-here" data-grid>
      <header className={styles.head}>
        <h2 id="started-here" className={styles.title} data-reveal="words">
          <RevealWords text={STARTED_HERE.title} />
        </h2>
        <p className={styles.lede} data-reveal="rise" style={{ '--d': '200ms' } as CSSProperties}>
          {STARTED_HERE.lede}
        </p>
      </header>
      <ul className={styles.list}>
        {STARTED_HERE.items.map((item, index) => (
          <li key={item.name} className={styles.row} data-tone={item.tone} data-reveal="rise" style={{ '--d': `${(index % 5) * 60}ms` } as CSSProperties}>
            <span className={styles.name}>{item.name}</span>
            <span className={styles.field}>{item.field}</span>
            <span className={styles.origin}>{item.origin}</span>
          </li>
        ))}
      </ul>
      <p className={styles.coda} data-reveal="rise">
        {STARTED_HERE.coda}
      </p>
    </section>
  )
}
