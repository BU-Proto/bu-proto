import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { JOURNEY } from '../content/home'
import { JOURNEY_PALETTE, journeyFrame, journeyGlyph } from '../lib/pixelGrid'
import { onFrame } from '../lib/smoothScroll'
import { useMediaQuery } from '../lib/useMediaQuery'
import { reducedMotion } from '../lib/useInView'
import { GlyphRibbon } from './GlyphRibbon'
import { RevealWords } from './motion/RevealWords'
import { usePixelCanvas } from './usePixelCanvas'
import lui from './landing.module.css'
import styles from './JourneyReel.module.css'

/** The art's cell grows with the frame, so the grown picture isn't a thin scatter in a wide box. */
const pitchFor = (width: number) => (width < 600 ? 8 : Math.max(11, Math.round(width / 118)))

/** Marks along the top and foot of the grown frame, as shares of its width. */
const MARKS = [0, 0.25, 0.5, 0.75, 1] as const

/** Where the frame starts to grow: its runway's top at this share of the screen's height. */
const GROW_FROM = 0.74
/** The grow only runs where the picture sits beside the words; below this the page is one column. */
const WIDE = '(min-width: 861px)'

/**
 * The ribbon's two courses. Beside the picture it's laid out on the section, 1000 wide: in from
 * the left edge above the title, steeply down through it, across the small picture, round its
 * near corner and out under the words. In one column, where the words run the full width, it's
 * laid out on the title alone, 1000 to the title's row: down through both lines, round under
 * them and back up, so it crosses the letters and never reaches the copy below.
 */
const RIBBON = { box: [1000, 1000], thickness: 24 } as const
const RIBBON_PATH = {
  beside: 'M -40 56 C 130 50, 292 120, 332 300 C 368 450, 300 610, 150 650 C 20 685, -10 560, 60 500 C 150 420, 330 520, 470 620 C 560 680, 700 650, 760 560',
  column: 'M 120 -90 C 150 60, 250 262, 470 252 C 700 242, 800 60, 840 -90',
} as const
/** One column: a narrow screen, or the still layout, which stacks the same way. */
const COLUMN = '(max-width: 860px), (prefers-reduced-motion: reduce)'

/** How far into the move the frame starts to widen: by then it's below the words. */
const WIDEN_FROM = 0.32

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => value * value * (3 - 2 * value)

/**
 * Moves the frame between its two places as the page scrolls. It's laid out full width in its
 * runway, where it ends up; until then it's drawn small in the slot beside the words, and it
 * comes down first and widens after, so it never crosses them.
 */
function useGrow() {
  const slot = useRef<HTMLDivElement>(null)
  const runway = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parts = { slot: slot.current, runway: runway.current, pin: pin.current, frame: frame.current }
    if (!parts.slot || !parts.runway || !parts.pin || !parts.frame || reducedMotion()) return
    const { slot: slotEl, runway: runwayEl, pin: pinEl, frame: frameEl } = parts
    const wide = window.matchMedia(WIDE)
    const state = { stop: null as (() => void) | null, shape: 0, near: false }

    const rest = () => {
      frameEl.style.transform = ''
      pinEl.style.removeProperty('--grow')
      slotEl.style.height = ''
    }

    const update = () => {
      const home = pinEl.getBoundingClientRect()
      if (home.width === 0) return
      // The slot takes the frame's shape, so the small picture is the large one, scaled.
      const shape = home.height / home.width
      if (Math.abs(shape - state.shape) > 0.001) {
        state.shape = shape
        slotEl.style.height = `${slotEl.clientWidth * shape}px`
      }
      const small = slotEl.getBoundingClientRect()
      const from = window.innerHeight * GROW_FROM
      // Where the frame holds: the pin's own sticky offset, under the top bar.
      const to = parseFloat(getComputedStyle(pinEl).top) || 0
      const raw = clamp01((from - runwayEl.getBoundingClientRect().top) / Math.max(1, from - to))
      // Down at a pace the page's own scroll always outruns, so the frame never sinks on screen;
      // wider only once it has cleared the words beside it.
      const down = 0.5 * raw + 0.5 * smooth(raw)
      const wider = smooth(clamp01((raw - WIDEN_FROM) / (1 - WIDEN_FROM)))
      const scale = small.width / home.width
      const x = (small.left - home.left) * (1 - wider)
      const y = (small.top - home.top) * (1 - down)
      frameEl.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(scale + (1 - scale) * wider).toFixed(4)})`
      pinEl.style.setProperty('--grow', wider.toFixed(3))
    }

    // Only while the section is near the screen, and only where the two places exist.
    const sync = (near: boolean) => {
      const run = near && wide.matches
      if (run && !state.stop) state.stop = onFrame(update)
      if (!run && state.stop) {
        state.stop()
        state.stop = null
      }
      if (!wide.matches) rest()
      else update()
    }
    const watch = new IntersectionObserver(
      ([entry]) => {
        state.near = entry?.isIntersecting ?? false
        sync(state.near)
      },
      { rootMargin: '60% 0px' },
    )
    watch.observe(runwayEl.parentElement ?? runwayEl)
    const onWidth = () => sync(state.near)
    wide.addEventListener('change', onWidth)

    return () => {
      watch.disconnect()
      wide.removeEventListener('change', onWidth)
      state.stop?.()
      rest()
    }
  }, [])

  return { slot, runway, pin, frame }
}

/**
 * How a person's time at Proto goes. The title set very large, the words beside a small picture
 * of the journey, and then the picture itself: it grows out of its place by the words to the full
 * width of the page and holds there, the four steps written along its foot.
 */
export function JourneyReel() {
  const canvas = useRef<HTMLCanvasElement>(null)
  usePixelCanvas(canvas, { palette: JOURNEY_PALETTE, pitch: pitchFor, fps: 24, still: 6, fontScale: 1, glyph: journeyGlyph, frame: journeyFrame })
  const { slot, runway, pin, frame } = useGrow()
  const column = useMediaQuery(COLUMN)

  return (
    <section className={styles.section} aria-labelledby="journey">
      {!column && <GlyphRibbon className={styles.ribbon} hue="iris" path={RIBBON_PATH.beside} {...RIBBON} />}
      <div className={styles.head}>
        {column && <GlyphRibbon className={styles.ribbon} hue="iris" path={RIBBON_PATH.column} {...RIBBON} />}
        <h2 id="journey" className={styles.title}>
          {JOURNEY.title.split('\n').map((line, index) => (
            <span key={line} className={styles.line} data-reveal="words" style={{ '--d': `${index * 160}ms` } as CSSProperties}>
              <RevealWords text={line} />
            </span>
          ))}
        </h2>
      </div>

      <div className={styles.row}>
        <div ref={slot} className={styles.slot} aria-hidden="true" />
        <div className={styles.words}>
          <p className={styles.lede} data-reveal="rise">
            {JOURNEY.lede}
          </p>
          <p className={styles.action} data-reveal="rise" style={{ '--d': '120ms' } as CSSProperties}>
            <Link className={lui.cta} to={JOURNEY.cta.href}>
              {JOURNEY.cta.label}
            </Link>
          </p>
        </div>
      </div>

      <div ref={runway} className={styles.runway}>
        <div ref={pin} className={styles.pin}>
          <div className={styles.marks} aria-hidden="true">
            {MARKS.map((at) => (
              <span key={at} className={styles.mark} style={{ left: `${at * 100}%` }} />
            ))}
          </div>
          <div ref={frame} className={styles.frame}>
            <canvas ref={canvas} className={styles.art} aria-hidden="true" />
            <ol className={styles.steps}>
              {JOURNEY.steps.map((step, index) => (
                <li key={step.name} className={styles.step}>
                  <div className={styles.stepHead}>
                    <span className={lui.badge}>{String(index + 1).padStart(2, '0')}</span>
                    <h3 className={styles.stepName}>{step.name}</h3>
                  </div>
                  <p className={styles.stepText}>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className={`${styles.marks} ${styles.marksFoot}`} aria-hidden="true">
            {MARKS.map((at) => (
              <span key={at} className={styles.mark} style={{ left: `${at * 100}%` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
