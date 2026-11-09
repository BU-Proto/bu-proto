import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TRACKS, TRACKS_INTRO } from '../content/home'
import { asciiFigureAt, developing } from '../lib/figureMotion'
import type { FigureShape } from '../lib/glyphArt'
import { reducedMotion, useInView } from '../lib/useInView'
import styles from './WaysIn.module.css'

/** Each way's own glyph, drawn big in the field's ramp. */
const FIGURES: Record<string, FigureShape> = { '○': 'ring', '>': 'chevron', _: 'bar' }

/** The figure steps at this rate: a character swap reads as a tick, so it needn't be fast. */
const FRAME_MS = 1000 / 14
const DEVELOP_MS = 1100

/**
 * A way's glyph, alive. The first time it's seen it develops out of loose glyphs, left to right,
 * then keeps moving while it's on screen. One text node is rewritten in place, so React never
 * re-renders for it. Still under reduced motion. Screen readers skip it: it repeats the name.
 */
function WayFigure({ shape }: { shape: FigureShape }) {
  const [ref, inView] = useInView<HTMLPreElement>('0px 0px -20% 0px')
  const [first] = useState(() =>
    typeof window === 'undefined' || reducedMotion() ? asciiFigureAt(shape, 0) : developing(asciiFigureAt(shape, 0), 0, 0),
  )

  useEffect(() => {
    const node = ref.current
    const text = node?.firstChild
    if (!inView || !node || !(text instanceof Text) || reducedMotion()) return
    const clock = { id: 0, due: 0, start: 0, onScreen: true }
    const tick = (now: number) => {
      clock.id = requestAnimationFrame(tick)
      if (now < clock.due) return
      clock.due = now + FRAME_MS
      if (!clock.start) clock.start = now
      const figure = asciiFigureAt(shape, now / 1000)
      const progress = (now - clock.start) / DEVELOP_MS
      text.data = progress >= 1 ? figure : developing(figure, progress, Math.floor(now / 70))
    }
    const sync = () => {
      const run = clock.onScreen && !document.hidden
      if (run && !clock.id) clock.id = requestAnimationFrame(tick)
      else if (!run && clock.id) {
        cancelAnimationFrame(clock.id)
        clock.id = 0
      }
    }
    const screen = new IntersectionObserver(([entry]) => {
      clock.onScreen = entry?.isIntersecting ?? false
      sync()
    })
    screen.observe(node)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      cancelAnimationFrame(clock.id)
      screen.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [inView, shape, ref])

  return (
    <pre ref={ref} className={styles.art} aria-hidden="true">
      {first}
    </pre>
  )
}

/** Which way the page has reached: the panels open in turn as the section crosses the screen. */
function wayFromScroll(section: HTMLElement): number {
  const box = section.getBoundingClientRect()
  const through = (window.innerHeight - box.top) / (window.innerHeight + box.height)
  const reached = (through - 0.3) / 0.4
  return Math.min(TRACKS.length - 1, Math.max(0, Math.floor(reached * TRACKS.length)))
}

/**
 * The three ways in: three navy panels side by side, each with a pool of its size's light at its
 * foot. The way the page has reached opens wider, and so does the one under the pointer, with each
 * glyph alive at the bottom of its panel. All the words are always there; opening a panel only
 * gives it more room. On phones the panels stack.
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
            data-hue={track.hue}
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
              <WayFigure shape={FIGURES[track.glyph] ?? 'ring'} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
