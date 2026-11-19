import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { JOURNEY } from '../content/home'
import { JOURNEY_PALETTE, journeyFrame, journeyGlyph } from '../lib/pixelGrid'
import { onFrame } from '../lib/smoothScroll'
import { useMediaQuery } from '../lib/useMediaQuery'
import { reducedMotion } from '../lib/useInView'
import { createReelMorph, paintPicture, paintStill } from '../lib/reelMorph'
import { RevealWords } from './motion/RevealWords'
import { TubeRibbon } from './TubeRibbon'
import { usePixelCanvas } from './usePixelCanvas'
import lui from './landing.module.css'
import styles from './JourneyReel.module.css'

/** The art's cell grows with the frame, so the grown picture isn't a thin scatter in a wide box. */
const pitchFor = (width: number) => (width < 600 ? 8 : Math.max(11, Math.round(width / 118)))

/** Marks along the top and foot of the grown frame, as shares of its width. */
const MARKS = [0, 0.25, 0.5, 0.75, 1] as const

/** The grow only runs where the picture sits beside the words; below this the page is one column. */
const WIDE = '(min-width: 861px)'

/**
 * The ribbon's two courses, as on lusion.co. Beside the picture it's laid out on the section, 1000
 * wide: in from the left edge at the title's top, down through the title and straight down behind
 * the small card, then one clean loop: under the card's foot, up its left side and back over its
 * top edge, crossing itself just above the card, then behind the button and on down and to the
 * right, where it waves out past the edge over the grown frame. The parts behind the card show
 * while it grows away, so the loop has to read as a loop on its own, as Lusion's does. In one column,
 * where the words run the full width, it's laid out on the title alone, 1000 to the title's row:
 * down through both lines, round under them and back up.
 */
const RIBBON = { box: [1000, 1000], thickness: 26 } as const
const RIBBON_PATH = {
  beside:
    'M -40 122 C 100 128, 250 200, 296 320 C 312 380, 317 430, 317 520 C 317 600, 300 690, 220 712 C 150 730, 60 712, 34 660 C 10 610, 18 530, 70 490 C 120 452, 240 444, 340 446 C 420 448, 470 458, 510 476 C 545 492, 565 515, 590 540 C 630 580, 670 620, 709 640 C 740 660, 770 700, 810 696 C 850 692, 870 668, 910 668 C 960 668, 1000 700, 1010 760 C 1018 810, 1012 860, 1012 920',
  column: 'M 120 -90 C 150 60, 250 262, 470 252 C 700 242, 800 60, 840 -90',
} as const
/** One column: a narrow screen, or the still layout, which stacks the same way. */
const COLUMN = '(max-width: 860px), (prefers-reduced-motion: reduce)'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Grows the frame out of its small place by the words as the page scrolls, the way Lusion's home
 * reel does (see reelMorph): the frame itself waits, hidden, in its runway, and a WebGL grid draws
 * it on its way, small at first and printed in one blue, then running out to the frame's place a
 * point at a time. The move is laid on the scroll, from the
 * moment the small card reaches the middle of the screen (it holds there from then on) to the
 * moment the frame settles under the top bar. Once it lands, the real frame shows again.
 */
function useGrow() {
  const slot = useRef<HTMLDivElement>(null)
  const runway = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const parts = { slot: slot.current, runway: runway.current, pin: pin.current, frame: frame.current, surface: surface.current }
    if (!parts.slot || !parts.runway || !parts.pin || !parts.frame || !parts.surface || reducedMotion()) return
    const { slot: slotEl, runway: runwayEl, pin: pinEl, frame: frameEl, surface: surfaceEl } = parts
    const morph = createReelMorph(surfaceEl)
    if (!morph) return
    const art = frameEl.querySelector('canvas')
    const still = document.createElement('canvas')
    const picture = document.createElement('canvas')
    const wide = window.matchMedia(WIDE)
    const state = {
      stop: null as (() => void) | null,
      shape: 0,
      near: false,
      painted: null as { box: DOMRect; art: DOMRect | null } | null,
    }

    const land = (landed: boolean) => {
      if (landed) delete pinEl.dataset.morphing
      else pinEl.dataset.morphing = ''
    }
    const rest = () => {
      land(true)
      morph.clear()
      slotEl.style.height = ''
    }
    const paint = () => {
      state.painted = paintStill(frameEl, still, art) ?? null
    }

    const update = () => {
      const home = pinEl.getBoundingClientRect()
      if (home.width === 0) return
      // The slot takes the frame's shape, so the small card is the frame in miniature.
      const shape = home.height / home.width
      if (Math.abs(shape - state.shape) > 0.001) {
        state.shape = shape
        slotEl.style.height = `${slotEl.clientWidth * shape}px`
        paint()
      }
      if (!state.painted) paint()
      const small = slotEl.getBoundingClientRect()
      const middle = (window.innerHeight - small.height) / 2
      // Scroll left until the card reaches the middle of the screen, and until the frame settles.
      const toMiddle = small.top - middle
      const toSettle = runwayEl.getBoundingClientRect().top - (parseFloat(getComputedStyle(pinEl).top) || 0)
      const ratio = toSettle - toMiddle > 1 ? clamp01(-toMiddle / (toSettle - toMiddle)) : toSettle <= 0 ? 1 : 0
      if (ratio >= 1) {
        land(true)
        morph.clear()
        return
      }
      land(false)
      const from = { x: small.left, y: Math.max(small.top, middle), w: small.width, h: small.height }
      const to = { x: home.left, y: home.top, w: home.width, h: home.height }
      const painted = state.painted
      if (!painted) return
      paintPicture(picture, still, art, painted.box, painted.art)
      morph.draw(from, to, ratio, picture, parseFloat(getComputedStyle(frameEl).borderTopLeftRadius) || 0)
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
    // The words are painted into the grid's picture, so paint again when the frame or its fonts change.
    const sizes = new ResizeObserver(() => {
      state.painted = null
    })
    sizes.observe(frameEl)
    void document.fonts.ready.then(() => {
      state.painted = null
    })

    return () => {
      watch.disconnect()
      sizes.disconnect()
      wide.removeEventListener('change', onWidth)
      state.stop?.()
      rest()
    }
  }, [])

  return { slot, runway, pin, frame, surface }
}

/**
 * How a person's time at Proto goes, laid out as Lusion's home is. The title set very large, the
 * words beside a small picture of the journey, and a blue ribbon drawn through it all as the page
 * scrolls. Then the picture itself: it grows out of its place by the words to the full width of
 * the page and holds there, the four steps written along its foot.
 */
export function JourneyReel() {
  const canvas = useRef<HTMLCanvasElement>(null)
  usePixelCanvas(canvas, { palette: JOURNEY_PALETTE, pitch: pitchFor, fps: 24, still: 6, fontScale: 1, glyph: journeyGlyph, frame: journeyFrame })
  const { slot, runway, pin, frame, surface } = useGrow()
  const column = useMediaQuery(COLUMN)

  return (
    <section className={styles.section} aria-labelledby="journey">
      {!column && <TubeRibbon className={styles.ribbon} path={RIBBON_PATH.beside} {...RIBBON} />}
      {!column && <canvas ref={surface} className={styles.morph} aria-hidden="true" />}
      <div className={styles.head}>
        {column && <TubeRibbon className={styles.ribbon} path={RIBBON_PATH.column} {...RIBBON} />}
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
            <Link className={`${lui.cta} ${styles.cta}`} to={JOURNEY.cta.href}>
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
