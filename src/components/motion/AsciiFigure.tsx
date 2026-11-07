import { useEffect, useMemo, useState } from 'react'
import { asciiFigure, asciiFigureAt, FINE_RAMP, hash, type FigureShape } from '../../lib/glyphArt'
import { reducedMotion, useInView } from '../../lib/useInView'
import styles from './motion.module.css'

/** Live figures step at this rate: a character swap reads as a tick, so it needn't be fast. */
const FRAME_MS = 1000 / 14

/** The figure part way to resolved: unsettled cells show a faint, shifting glyph instead. */
function partial(lines: readonly string[], progress: number, frame: number): string {
  return lines
    .map((line, j) => {
      let out = ''
      for (let i = 0; i < line.length; i++) {
        // Cells settle from the left, with a ragged front, like the field drying into a shape.
        const settleAt = (i / line.length) * 0.6 + hash(i, j) * 0.4
        // A cell that ends up empty stays empty, so the figure's outline holds while it develops.
        const blank = line[i] === ' '
        out += blank || progress >= settleAt ? line[i] : hash(i + frame, j) < 0.3 ? FINE_RAMP[1 + ((i + j + frame) % 6)] : ' '
      }
      return out
    })
    .join('\n')
}

interface AsciiFigureProps {
  shape: FigureShape
  rows?: number
  /** Milliseconds to wait after the figure comes into view. */
  delay?: number
  /** Keep moving once developed, while on screen. Still under reduced motion. */
  live?: boolean
  className?: string
}

/**
 * One of the trail's glyphs drawn big in the field's ramp. The first time it's seen it develops
 * out of loose glyphs, left to right. Screen readers skip it: it repeats the heading beside it.
 */
export function AsciiFigure({ shape, rows = 22, delay = 0, live = false, className }: AsciiFigureProps) {
  const lines = useMemo(() => asciiFigure(shape, rows), [shape, rows])
  const final = useMemo(() => lines.join('\n'), [lines])
  const [ref, inView] = useInView<HTMLPreElement>('0px 0px -20% 0px')
  const [shown, setShown] = useState(() => (typeof window === 'undefined' || reducedMotion() ? final : partial(lines, 0, 0)))
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView || reducedMotion()) return
    const frame = { id: 0 }
    const duration = 1100
    const start = performance.now() + delay
    const tick = (now: number) => {
      const progress = Math.max(0, (now - start) / duration)
      setShown(progress >= 1 ? final : partial(lines, progress, Math.floor(now / 70)))
      if (progress < 1) frame.id = requestAnimationFrame(tick)
      else setSettled(true)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [inView, lines, final, delay])

  // Once it's developed, one text node is rewritten in place, and only while it can be seen.
  useEffect(() => {
    const node = ref.current
    const text = node?.firstChild
    if (!live || !settled || !(text instanceof Text) || !node) return
    const clock = { id: 0, due: 0, onScreen: false }
    const tick = (now: number) => {
      clock.id = requestAnimationFrame(tick)
      if (now < clock.due) return
      clock.due = now + FRAME_MS
      text.data = asciiFigureAt(shape, now / 1000, rows)
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
      clock.onScreen = entry.isIntersecting
      sync()
    })
    screen.observe(node)
    document.addEventListener('visibilitychange', sync)
    return () => {
      cancelAnimationFrame(clock.id)
      screen.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [live, settled, shape, rows, ref])

  return (
    <pre ref={ref} className={`${styles.figure} ${className ?? ''}`} aria-hidden="true">
      {shown}
    </pre>
  )
}
