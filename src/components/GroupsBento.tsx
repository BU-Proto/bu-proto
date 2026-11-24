import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { GROUP_TILES, GROUPS_INTRO, type GroupTile } from '../content/home'
import { RevealWords } from './motion/RevealWords'
import styles from './GroupsBento.module.css'

/** Each group's simple drawing, in the ink of its tile. */
function Picture({ name }: { name: GroupTile['picture'] }) {
  const common = { className: styles.picture, viewBox: '0 0 120 120', 'aria-hidden': true, focusable: false } as const
  if (name === 'people') {
    const nodes = [
      [20, 28],
      [96, 20],
      [62, 66],
      [22, 100],
      [100, 96],
    ]
    const lines = [
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [0, 1],
      [3, 4],
    ]
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
        {lines.map(([from, to]) => (
          <line key={`${from}-${to}`} x1={nodes[from][0]} y1={nodes[from][1]} x2={nodes[to][0]} y2={nodes[to][1]} />
        ))}
        {nodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={8} fill="currentColor" />
        ))}
      </svg>
    )
  }
  if (name === 'prompt') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 32l34 28-34 28" />
        <path d="M62 92h42" />
      </svg>
    )
  }
  if (name === 'steps') {
    return (
      <svg {...common} fill="currentColor">
        <rect x="10" y="74" width="28" height="36" />
        <rect x="46" y="46" width="28" height="64" />
        <rect x="82" y="14" width="28" height="96" />
      </svg>
    )
  }
  return (
    <svg {...common} fill="currentColor" fillRule="evenodd">
      <path d="M60 10l43.3 25v50L60 110 16.7 85V35z M60 40a20 20 0 1 0 0.01 0z" />
    </svg>
  )
}

/**
 * Proto's groups as a bento of light tiles: everyone's nights, then CS, then the groups still to
 * come. Each tile is its own colour with ink of the same hue, a name, a line, its pages and a
 * drawing, after the section tiles on brand.dropbox.com.
 */
export function GroupsBento() {
  return (
    <section className={styles.groups} aria-labelledby="groups">
      <header className={styles.head}>
        <h2 id="groups" className={styles.title} data-reveal="words">
          <RevealWords text={GROUPS_INTRO.title} />
        </h2>
        <p className={styles.lede} data-reveal="rise" style={{ '--d': '200ms' } as CSSProperties}>
          {GROUPS_INTRO.lede}
        </p>
      </header>
      <ul className={styles.grid}>
        {GROUP_TILES.map((tile, index) => (
          <li
            key={tile.name}
            className={styles.tile}
            data-tone={tile.tone}
            data-size={index === 0 ? 'big' : index === 1 ? 'wide' : 'small'}
            data-reveal="rise"
            style={{ '--d': `${index * 90}ms` } as CSSProperties}
          >
            <div className={styles.top}>
              <h3 className={styles.name}>{tile.name}</h3>
              {tile.later && <span className={styles.later}>{GROUPS_INTRO.later}</span>}
            </div>
            <p className={styles.text}>{tile.text}</p>
            {tile.links.length > 0 && (
              <ul className={styles.links}>
                {tile.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href}>
                      {link.label}
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Picture name={tile.picture} />
          </li>
        ))}
      </ul>
    </section>
  )
}
