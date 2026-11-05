import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Win } from '../../shared/api'
import { WIN_SHEET, WINS_EMPTY } from '../content/wins'
import { reducedMotion, useInView } from '../lib/useInView'
import { WinTile } from './WinTile'
import { mountWinStage } from './winStage'
import styles from './WinSheet.module.css'

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
 * The light sheet, its covers drawn in WebGL behind the words. Only for a mouse: a touch scroll runs
 * ahead of the page's frames, so a drawn cover would trail its own words.
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
    <div ref={sheet} className={styles.sheet} data-field-cover>
      {wins.length > 0 && <canvas key={tiles} ref={stage} className={styles.stage} aria-hidden="true" />}
      {children}
    </div>
  )
}

/** The landing's latest wins, on their own light sheet, with the way through to the rest. */
export function LatestWins({ wins, id }: { wins: readonly Win[]; id: string }) {
  return (
    <Sheet wins={wins}>
      <Head id={id} />
      {wins.length === 0 ? (
        <p className={styles.empty}>{WINS_EMPTY}</p>
      ) : (
        <>
          <WinGrid wins={wins} />
          <AllWins />
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
