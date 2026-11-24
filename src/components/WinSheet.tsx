import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_SHEET, WINS_EMPTY } from '../content/wins'
import { reducedMotion } from '../lib/useInView'
import { RevealWords } from './motion/RevealWords'
import lui from './landing.module.css'
import { WinTile } from './WinTile'
import { mountWinStage } from './winStage'
import styles from './WinSheet.module.css'

/** Staggers the parts of a block as it settles in (see motion/useReveal). */
const after = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/** The heading, its words rising into place, with the lede settling in at the far side of its row. */
function Head({ id }: { id: string }) {
  return (
    <header className={styles.head}>
      <h2 id={id} className={styles.title} data-reveal="words">
        <RevealWords text={WIN_SHEET.title} />
      </h2>
      <p className={styles.lede} data-reveal="rise" style={after(220)}>
        {WIN_SHEET.lede}
      </p>
    </header>
  )
}

/** Two columns of tiles, one on phones. */
export function WinGrid({ wins, details = false }: { wins: readonly Win[]; details?: boolean }) {
  return (
    <ol className={styles.grid}>
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

/**
 * The sheet, its covers drawn in WebGL behind the words. Only for a mouse: a touch scroll runs
 * ahead of the page's frames, so a drawn cover would trail its own words. It has no fill of its
 * own: it's the landing's harbor, the navy covers standing on it.
 */
function Sheet({ wins, children }: { wins: readonly Win[]; children: ReactNode }) {
  const sheet = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLCanvasElement>(null)
  const tiles = wins.map((win) => win.id).join()

  useEffect(() => {
    if (!sheet.current || !stage.current || reducedMotion()) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    return mountWinStage(sheet.current, stage.current)
  }, [tiles])

  return (
    <div ref={sheet} className={styles.sheet} data-hue="rose">
      {wins.length > 0 && <canvas key={tiles} ref={stage} className={styles.stage} aria-hidden="true" />}
      {children}
    </div>
  )
}

/**
 * The landing's latest wins: the newest few at the full width of the page, two to a row, and the
 * way to the rest under them.
 */
export function LatestWins({ wins, id }: { wins: readonly Win[]; id: string }) {
  return (
    <Sheet wins={wins}>
      <Head id={id} />
      {wins.length === 0 ? (
        <p className={styles.empty}>{WINS_EMPTY}</p>
      ) : (
        <>
          <WinGrid wins={wins} />
          <p className={styles.allRow} data-reveal="rise">
            <Link className={lui.cta} to="/wins">
              {WIN_SHEET.allWins}
            </Link>
          </p>
        </>
      )}
    </Sheet>
  )
}

/** Every win on the same sheet, for /wins, where the page's own intro does the heading's job. */
export function WinSheet({ wins }: { wins: readonly Win[] }) {
  return (
    <Sheet wins={wins}>
      <WinGrid wins={wins} details />
    </Sheet>
  )
}
