import { useState, type CSSProperties } from 'react'
import { STARTED_HERE, type MapPlace } from '../content/home'
import { BostonMap } from './BostonMap'
import { RevealWords } from './motion/RevealWords'
import styles from './StartedHereWall.module.css'

/**
 * Things that started in Boston, from every kind of field: a map of Boston and Cambridge with a
 * pin where each began, beside ruled rows with the name large, its field on a tag in its own
 * colour, and where and when it began. Pointing at a row lights its pin, and a pin its rows.
 */
export function StartedHereWall() {
  const [active, setActive] = useState<MapPlace | null>(null)
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
      <div className={styles.body}>
        <BostonMap active={active} onActive={setActive} />
        <ul className={styles.list}>
          {STARTED_HERE.items.map((item, index) => (
            <li
              key={item.name}
              className={styles.row}
              data-tone={item.tone}
              data-active={active === item.place || undefined}
              data-reveal="rise"
              style={{ '--d': `${(index % 5) * 60}ms` } as CSSProperties}
              onMouseEnter={() => setActive(item.place)}
              onMouseLeave={() => setActive(null)}
            >
              <span className={styles.name}>{item.name}</span>
              <span className={styles.field}>{item.field}</span>
              <span className={styles.origin}>{item.origin}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.coda} data-reveal="rise">
        {STARTED_HERE.coda}
      </p>
    </section>
  )
}
