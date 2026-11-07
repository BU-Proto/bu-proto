import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TRACKS, TRACKS_INTRO } from '../content/home'
import type { FigureShape } from '../lib/glyphArt'
import { reducedMotion, useInView } from '../lib/useInView'
import { AsciiFigure } from './motion/AsciiFigure'
import styles from './WaysIn.module.css'

/** Each way's own glyph, drawn big in the field's ramp. */
const FIGURES: Record<string, FigureShape> = { '○': 'ring', '>': 'chevron', _: 'bar' }

/** Which way the page has reached: the panels open in turn as the section crosses the screen. */
function wayFromScroll(section: HTMLElement): number {
  const box = section.getBoundingClientRect()
  const through = (window.innerHeight - box.top) / (window.innerHeight + box.height)
  const reached = (through - 0.3) / 0.4
  return Math.min(TRACKS.length - 1, Math.max(0, Math.floor(reached * TRACKS.length)))
}

/**
 * The three ways in: three panels of colour, side by side. The way the page has reached opens
 * wider, and so does the one under the pointer, with each glyph drifting slowly inside its panel.
 * All the words are always there; opening a panel only gives it more room. On phones the panels stack.
 */
export function WaysIn() {
  const [ref, inView] = useInView<HTMLElement>('0px 0px -15% 0px')
  const section = useRef<HTMLElement | null>(null)
  const [reached, setReached] = useState(0)
  const [pointed, setPointed] = useState<number | null>(null)
  const open = pointed ?? reached

  useEffect(() => {
    if (reducedMotion()) return
    const update = () => {
      if (section.current) setReached(wayFromScroll(section.current))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <section
      ref={(node) => {
        ref.current = node
        section.current = node
      }}
      className={styles.ways}
      data-in={inView || undefined}
      aria-labelledby="tracks"
    >
      <header className={styles.head}>
        <h2 id="tracks" className={styles.title}>
          {TRACKS_INTRO.title}
        </h2>
        <p className={styles.lede}>{TRACKS_INTRO.lede}</p>
      </header>

      <ol className={styles.list}>
        {TRACKS.map((track, index) => (
          <li
            key={track.name}
            className={styles.way}
            data-open={index === open || undefined}
            style={{ '--i': index } as CSSProperties}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') setPointed(index)
            }}
            onPointerLeave={() => setPointed(null)}
          >
            <div className={styles.words}>
              <h3 className={styles.name}>{track.name}</h3>
              <p className={styles.who}>{track.who}</p>
              <ul className={styles.offers}>
                {track.offers.map((offer) => (
                  <li key={offer}>{offer}</li>
                ))}
              </ul>
            </div>
            <div className={styles.figure}>
              <AsciiFigure shape={FIGURES[track.glyph] ?? 'ring'} live />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
