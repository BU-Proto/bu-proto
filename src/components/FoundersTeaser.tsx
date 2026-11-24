import { Link } from 'react-router'
import { FOUNDERS_TEASER } from '../content/founders'
import ui from './ui.module.css'
import styles from './FoundersTeaser.module.css'

/** Dots on three rings, the inner ring lit: a small group inside a bigger one. */
const RINGS = [
  { r: 38, count: 6, lit: true },
  { r: 74, count: 12, lit: false },
  { r: 110, count: 18, lit: false },
] as const

function CircleMark() {
  return (
    <svg className={styles.mark} viewBox="-130 -130 260 260" aria-hidden="true" focusable="false">
      {RINGS.map((ring) =>
        Array.from({ length: ring.count }, (_, i) => {
          const angle = (i / ring.count) * Math.PI * 2 - Math.PI / 2
          return (
            <circle
              key={`${ring.r}-${i}`}
              cx={Math.round(Math.cos(angle) * ring.r * 10) / 10}
              cy={Math.round(Math.sin(angle) * ring.r * 10) / 10}
              r={ring.lit ? 9 : 5.5}
              className={ring.lit ? styles.lit : styles.dim}
            />
          )
        }),
      )}
    </svg>
  )
}

/**
 * The home page's pointer to the Founders Circle, after the groups: the one invite-only part of
 * Proto, on a dark card with the Circle's amber, what it is, what members get and how to apply.
 */
export function FoundersTeaser() {
  return (
    <section className={styles.teaser} aria-labelledby="founders-circle">
      <div className={styles.card} data-reveal="rise">
        <div className={styles.words}>
          <p className={styles.badge}>{FOUNDERS_TEASER.badge}</p>
          <h2 id="founders-circle" className={styles.title}>
            {FOUNDERS_TEASER.title}
          </h2>
          <p className={styles.text}>{FOUNDERS_TEASER.text}</p>
          <ul className={styles.points}>
            {FOUNDERS_TEASER.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className={styles.actions}>
            <Link className={`${ui.primary} ${styles.apply}`} to={FOUNDERS_TEASER.cta.href}>
              {FOUNDERS_TEASER.cta.label}
            </Link>
            <Link className={ui.textLink} to={FOUNDERS_TEASER.more.href}>
              {FOUNDERS_TEASER.more.label}
            </Link>
          </div>
        </div>
        <CircleMark />
      </div>
    </section>
  )
}
