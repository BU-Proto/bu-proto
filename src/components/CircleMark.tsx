import styles from './CircleMark.module.css'

/** Dots on three rings, the inner ring lit: a small group inside a bigger one. */
const RINGS = [
  { r: 38, count: 6, lit: true },
  { r: 74, count: 12, lit: false },
  { r: 110, count: 18, lit: false },
] as const

/** The Founders Circle's mark. It turns once a minute unless the visitor has asked for less motion. */
export function CircleMark({ className }: { className?: string }) {
  return (
    <svg className={`${styles.mark}${className ? ` ${className}` : ''}`} viewBox="-130 -130 260 260" aria-hidden="true" focusable="false">
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
