import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_SHEET, WINS_EMPTY } from '../content/wins'
import { reducedMotion, useInView } from '../lib/useInView'
import { WinTile } from './WinTile'
import styles from './WinSheet.module.css'

/** Scroll speed, in px per second, at which the tiles are fully bent. */
const BEND_SPEED = 2700
/** How far a tile's outer edge spreads at full bend, as a share of its width, at the viewport's edge. */
const BEND_SPREAD = 0.05
/** How far a tile tips toward the viewer at full bend, at the viewport's edge. */
const BEND_TILT = 8
const BEND_EASE_MS = 90

/**
 * Bends the tiles while the page moves: the faster the scroll, the more each one's outer edge
 * spreads, most near the top and bottom of the viewport. It settles flat when the scroll stops.
 */
function useScrollBend() {
  const ref = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const grid = ref.current
    if (!grid || reducedMotion() || !window.matchMedia('(hover: hover) and (min-width: 813px)').matches) return
    const media = [...grid.querySelectorAll<HTMLElement>('[data-side]')]
    const state = { frame: 0, y: window.scrollY, at: 0, speed: 0 }

    const tick = (now: number) => {
      const elapsed = Math.max(now - state.at, 1)
      const speed = (Math.abs(window.scrollY - state.y) / elapsed) * 1000
      state.y = window.scrollY
      state.at = now
      state.speed += (speed - state.speed) * (1 - Math.exp(-elapsed / BEND_EASE_MS))
      const bend = Math.min(1, state.speed / BEND_SPEED)
      const middle = window.innerHeight / 2
      const settled = bend < 0.002

      for (const item of media) {
        if (settled) {
          item.style.removeProperty('--spread')
          item.style.removeProperty('--tilt')
          continue
        }
        const box = item.getBoundingClientRect()
        if (box.bottom < 0 || box.top > window.innerHeight) continue
        const reach = Math.max(-1, Math.min(1, (box.top + box.height / 2 - middle) / middle))
        item.style.setProperty('--spread', (1 + BEND_SPREAD * bend * reach * reach).toFixed(4))
        item.style.setProperty('--tilt', `${(BEND_TILT * bend * reach).toFixed(3)}deg`)
      }
      state.frame = settled ? 0 : requestAnimationFrame(tick)
    }

    const wake = () => {
      if (state.frame) return
      state.at = performance.now()
      state.frame = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', wake, { passive: true })
    return () => {
      window.removeEventListener('scroll', wake)
      cancelAnimationFrame(state.frame)
    }
  }, [])

  return ref
}

/** The heading, its characters tipping up out of the line, with the lede rising beside it. */
function Head({ id }: { id: string }) {
  const [ref, inView] = useInView<HTMLElement>('0px', 0, true)
  const seen = { count: 0 }
  return (
    <header ref={ref} className={styles.head} data-in={inView || undefined}>
      <h2 id={id} className={styles.title} aria-label={WIN_SHEET.title}>
        {WIN_SHEET.title.split(' ').map((word, wordIndex) => (
          <span key={wordIndex}>
            {wordIndex > 0 && ' '}
            <span className={styles.word} aria-hidden="true">
              {[...word].map((char, charIndex) => (
                <span key={charIndex} className={styles.char} style={{ '--i': seen.count++ } as CSSProperties}>
                  {char}
                </span>
              ))}
            </span>
          </span>
        ))}
      </h2>
      <p className={styles.lede}>
        <span className={styles.ledeLine}>{WIN_SHEET.lede}</span>
      </p>
    </header>
  )
}

/** The way through to every win. */
function AllWins() {
  const [ref, inView] = useInView<HTMLDivElement>('0px', 0, true)
  return (
    <div ref={ref} className={styles.pillRow} data-in={inView || undefined}>
      <div className={styles.pillRise}>
        <Link className={styles.pill} to="/wins">
          <span className={styles.pillDot} aria-hidden="true" />
          <span className={styles.pillLabel}>{WIN_SHEET.allWins}</span>
          <span className={styles.pillArrow} aria-hidden="true">
            {'>'}
          </span>
        </Link>
      </div>
    </div>
  )
}

/** Two columns of tiles, one on phones. */
export function WinGrid({ wins, details = false }: { wins: readonly Win[]; details?: boolean }) {
  const ref = useScrollBend()
  return (
    <ol ref={ref} className={styles.grid}>
      {wins.map((win, index) => (
        <WinTile
          key={win.id}
          win={win}
          side={index % 2 ? 'right' : 'left'}
          details={details}
          eager={details && index < 2}
        />
      ))}
    </ol>
  )
}

/** The landing's latest wins, on their own light sheet, with the way through to the rest. */
export function LatestWins({ wins, id }: { wins: readonly Win[]; id: string }) {
  return (
    <div className={styles.sheet}>
      <Head id={id} />
      {wins.length === 0 ? (
        <p className={styles.empty}>{WINS_EMPTY}</p>
      ) : (
        <>
          <WinGrid wins={wins} />
          <AllWins />
        </>
      )}
    </div>
  )
}

/** Every win on the same sheet, for /wins, where the page's own intro does the heading's job. */
export function WinSheet({ wins }: { wins: readonly Win[] }) {
  return (
    <div className={styles.sheet}>
      <WinGrid wins={wins} details />
    </div>
  )
}
