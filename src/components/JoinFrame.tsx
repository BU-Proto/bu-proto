import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Link } from 'react-router'
import { JOIN_CTA } from '../content/home'
import { createEdgeLight } from '../lib/edgeLight'
import { FINE_RAMP, hash } from '../lib/glyphArt'
import { reducedMotion, useInView } from '../lib/useInView'
import { ScrubWords } from './motion/ScrubWords'
import ui from './ui.module.css'
import styles from './JoinFrame.module.css'

/** How much of a screen short of full the frame's light starts to come up. */
const POWER_RANGE = 0.5
/** Rows in the ring's grid. Its opening is wide enough to hold the button. */
const HALO_ROWS = 24
/** Glyph cells are about 0.6 as wide as they are tall, so the grid has more columns than rows. */
const CELL_ASPECT = 0.6

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * The ring around the button, in the field's fine ramp: a slim band, dense in the stroke with a
 * glow that thins out fast, and the field's fluted-glass ribs running down through it. Off the band
 * it's empty cell by cell, so no glyph is cut in half at the opening and the outside stays round.
 */
function haloLines(rows: number): string[] {
  const cols = Math.round(rows / CELL_ASPECT)
  const top = FINE_RAMP.length - 1
  const lines: string[] = []
  for (let j = 0; j < rows; j++) {
    let line = ''
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * 2 - 1
      const y = ((j + 0.5) / rows) * 2 - 1
      const r = Math.hypot(x, y)
      if (r < 0.6 || r > 0.98) {
        line += ' '
        continue
      }
      const d = Math.abs(r - 0.76) - 0.08
      const body = d < 0 ? 0.8 + clamp01(-d / 0.1) * 0.2 : Math.max(0, 0.55 - d * 3.4)
      const rib = 0.86 + 0.14 * Math.cos(i * 1.15)
      const grain = (hash(i, j) - 0.5) * 0.22
      line += FINE_RAMP[Math.round(clamp01(body * rib + (body > 0.02 ? grain : 0)) * top)]
    }
    lines.push(line)
  }
  return lines
}

/** The ring part way to resolved: unsettled cells show a faint, shifting glyph instead. */
function partial(lines: readonly string[], progress: number, frame: number): string {
  return lines
    .map((line, j) => {
      let out = ''
      for (let i = 0; i < line.length; i++) {
        // Cells settle from the left, with a ragged front, like the field drying into a shape.
        const settleAt = (i / line.length) * 0.6 + hash(i, j) * 0.4
        // A cell that ends up empty stays empty, so the ring's outline holds while it develops.
        const blank = line[i] === ' '
        out += blank || progress >= settleAt ? line[i] : hash(i + frame, j) < 0.3 ? FINE_RAMP[1 + ((i + j + frame) % 6)] : ' '
      }
      return out
    })
    .join('\n')
}

/** The ring, developing out of loose glyphs the first time it's seen. Screen readers skip it. */
function Halo() {
  const lines = useMemo(() => haloLines(HALO_ROWS), [])
  const final = useMemo(() => lines.join('\n'), [lines])
  const [ref, inView] = useInView<HTMLPreElement>('0px 0px -20% 0px')
  const [shown, setShown] = useState(() => (typeof window === 'undefined' || reducedMotion() ? final : partial(lines, 0, 0)))

  useEffect(() => {
    if (!inView || reducedMotion()) return
    const frame = { id: 0 }
    const duration = 1100
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.max(0, (now - start) / duration)
      setShown(progress >= 1 ? final : partial(lines, progress, Math.floor(now / 70)))
      if (progress < 1) frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [inView, lines, final])

  return (
    <pre ref={ref} className={styles.figure} aria-hidden="true">
      {shown}
    </pre>
  )
}

/** The screen's own edge, lit, while the frame fills it. Without WebGL2 there's no edge, only the ground behind. */
function EdgeCanvas({ frame }: { frame: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const surface = canvas.current
    const box = frame.current
    if (!surface || !box) return
    const light = createEdgeLight(surface, () => setFailed(true))
    if (!light) {
      setFailed(true)
      return
    }
    const still = reducedMotion()
    const state = { id: 0, onScreen: false, visible: !document.hidden, greeted: false }
    const button = box.querySelector<HTMLElement>('[data-pulse]')
    const sendPulse = () => {
      if (still || !button) return
      const from = button.getBoundingClientRect()
      const to = surface.getBoundingClientRect()
      light.pulse(from.left + from.width / 2 - to.left, from.top + from.height / 2 - to.top)
    }

    const power = () => {
      if (still) return 1
      const rect = box.getBoundingClientRect()
      const off = Math.max(0, rect.top, window.innerHeight - rect.bottom) / window.innerHeight
      const t = Math.max(0, 1 - off / POWER_RANGE)
      return t * t * (3 - 2 * t)
    }
    const draw = (now: number) => {
      const lit = power()
      // The frame greets you with one ring the first time it fills the screen.
      if (!state.greeted && lit > 0.8) {
        state.greeted = true
        sendPulse()
      }
      light.frame(now, lit)
    }
    const tick = (now: number) => {
      state.id = requestAnimationFrame(tick)
      draw(now)
    }
    const sync = () => {
      const run = !still && state.onScreen && state.visible
      if (run && !state.id) state.id = requestAnimationFrame(tick)
      else if (!run && state.id) {
        cancelAnimationFrame(state.id)
        state.id = 0
      }
    }

    const sizes = new ResizeObserver(() => {
      light.resize(surface.clientWidth, surface.clientHeight)
      draw(performance.now())
    })
    sizes.observe(surface)
    const screen = new IntersectionObserver(([entry]) => {
      state.onScreen = entry.isIntersecting
      sync()
    })
    screen.observe(box)
    const onVisibility = () => {
      state.visible = !document.hidden
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)
    button?.addEventListener('pointerenter', sendPulse)

    return () => {
      cancelAnimationFrame(state.id)
      sizes.disconnect()
      screen.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      button?.removeEventListener('pointerenter', sendPulse)
      light.destroy()
    }
  }, [frame])

  if (failed) return null
  return <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
}

/**
 * The landing's last screen: the ask, set like a title card, with the button in a ring of glyphs
 * and the screen's edge lit in the field's colours while it fills the view. Full bleed and clear:
 * whatever ground its parent has (on the landing, the field rising as dawn) shows through. It
 * carries the heading `#join-cta`, so the section around it can be labelled by it.
 */
export function JoinFrame({ edgeLight = true }: { edgeLight?: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  return (
    <div ref={frame} className={styles.frame}>
      {edgeLight && <EdgeCanvas frame={frame} />}
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id="join-cta" className={styles.title} data-fog-clear>
            <ScrubWords text={JOIN_CTA.title} />
            <span className={styles.star} aria-hidden="true">
              *
            </span>
          </h2>
          <p className={styles.tag} data-fog-clear>
            {JOIN_CTA.tag}
          </p>
        </header>

        <div className={styles.stage}>
          <div className={styles.hint} data-reveal="rise" style={{ '--d': '120ms' } as CSSProperties}>
            <span className={styles.hintGlyph} aria-hidden="true">
              {'>_'}
            </span>
            <p className={styles.hintLine} data-fog-clear>
              {JOIN_CTA.hint}
            </p>
          </div>

          <div className={styles.ring}>
            <Halo />
            <Link className={`${ui.primary} ${styles.cta}`} to={JOIN_CTA.cta.href} data-pulse="" data-fog-clear="box">
              {JOIN_CTA.cta.label}
            </Link>
          </div>

          <p className={styles.aside} data-fog-clear data-reveal="rise" style={{ '--d': '200ms' } as CSSProperties}>
            {JOIN_CTA.aside.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>

        <p className={styles.lede} data-fog-clear>
          {JOIN_CTA.lede}
        </p>

        <p className={styles.note} data-fog-clear>
          {JOIN_CTA.footnote.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
    </div>
  )
}
