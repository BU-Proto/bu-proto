import { useMemo, type CSSProperties } from 'react'
import { edgeStrip, type EdgeMode } from '../lib/glyphArt'
import styles from './GlyphEdge.module.css'

interface GlyphEdgeProps {
  /** The band's own color: the strip is solid on the band's side and frays away from it. */
  color: string
  mode?: EdgeMode
  /** Which edge of the band it sits on. */
  side?: 'top' | 'bottom'
  rows?: number
  cell?: number
}

/**
 * The seam between two grounds, drawn in glyphs: put it inside a positioned band and it hangs
 * off the band's top (or bottom) edge, so the band breaks up into what's next to it instead of
 * ending in a straight line.
 */
export function GlyphEdge({ color, mode = 'dissolve', side = 'top', rows = 10, cell = 8 }: GlyphEdgeProps) {
  const url = useMemo(() => edgeStrip(color, mode, rows, cell), [color, mode, rows, cell])
  if (!url) return null
  return (
    <span
      className={styles.edge}
      data-side={side}
      aria-hidden="true"
      style={{ '--strip': `url(${url})`, '--strip-h': `${rows * cell}px`, '--strip-w': `${180 * cell}px` } as CSSProperties}
    />
  )
}
