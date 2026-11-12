import { useEffect, useMemo, useState } from 'react'
import { asciiFigure, FINE_RAMP, hash, type FigureShape } from '../../lib/glyphArt'
import { reducedMotion, useInView } from '../../lib/useInView'
import styles from './motion.module.css'

/** The figure part way to resolved: unsettled cells show a faint, shifting glyph instead. */
function partial(lines: readonly string[], progress: number, frame: number): string {
  return lines
    .map((line, j) => {
      let out = ''
      for (let i = 0; i < line.length; i++) {
        // Cells settle from the left, with a ragged front, like the field drying into a shape.
        const settleAt = (i / line.length) * 0.6 + hash(i, j) * 0.4
        out += progress >= settleAt ? line[i] : hash(i + frame, j) < 0.3 ? FINE_RAMP[1 + ((i + j + frame) % 6)] : ' '
      }
      return out
    })
    .join('\n')
}

interface AsciiFigureProps {
  /** One of the trail's glyphs, or `lines` for art drawn elsewhere (see asciiDrawing). */
  shape?: FigureShape
  lines?: readonly string[]
  rows?: number
  /** Milliseconds to wait after the figure comes into view. */
  delay?: number
  className?: string
}

/**
 * One of the trail's glyphs drawn big in the field's ramp. The first time it's seen it develops
 * out of loose glyphs, left to right. Screen readers skip it: it repeats the heading beside it.
 */
export function AsciiFigure({ shape, lines: given, rows = 22, delay = 0, className }: AsciiFigureProps) {
  const lines = useMemo(() => given ?? (shape ? asciiFigure(shape, rows) : []), [given, shape, rows])
  const final = useMemo(() => lines.join('\n'), [lines])
  const [ref, inView] = useInView<HTMLPreElement>('0px 0px -20% 0px')
  const [shown, setShown] = useState(() => (typeof window === 'undefined' || reducedMotion() ? final : partial(lines, 0, 0)))

  useEffect(() => {
    if (!inView || reducedMotion()) return
    const frame = { id: 0 }
    const duration = 1100
    const start = performance.now() + delay
    const tick = (now: number) => {
      const progress = Math.max(0, (now - start) / duration)
      setShown(progress >= 1 ? final : partial(lines, progress, Math.floor(now / 70)))
      if (progress < 1) frame.id = requestAnimationFrame(tick)
    }
    frame.id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.id)
  }, [inView, lines, final, delay])

  return (
    <pre ref={ref} className={`${styles.figure} ${className ?? ''}`} aria-hidden="true">
      {shown}
    </pre>
  )
}
