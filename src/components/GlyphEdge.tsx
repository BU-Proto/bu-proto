import { useMemo, type CSSProperties } from 'react'
import { drainStrip, edgeStrip, type EdgeMode } from '../lib/glyphArt'
import styles from './GlyphEdge.module.css'

interface GlyphEdgeProps {
  /** The band's own color: the strip is solid on the band's side and frays away from it. */
  color: string
  /**
   * `drain` is for an edge against the live field: the field's wash drains into the band and
   * its characters thin out. `dissolve` and `steps` are for an edge between two solid grounds.
   */
  mode?: EdgeMode | 'drain'
  /** Which edge of the band it sits on. */
  side?: 'top' | 'bottom'
  rows?: number
  cell?: number
}

const DRAIN_COLS = 320

/**
 * The seam between two grounds, drawn in glyphs: put it inside a positioned band and it hangs
 * off the band's top (or bottom) edge, so the band breaks up into what's next to it instead of
 * ending in a straight line.
 */
export function GlyphEdge({ color, mode = 'dissolve', side = 'top', rows = 10, cell = 8 }: GlyphEdgeProps) {
  const url = useMemo(
    () =>
      mode === 'drain'
        ? drainStrip(color, rows, cell, side === 'top' ? 'bottom' : 'top', DRAIN_COLS)
        : edgeStrip(color, mode, rows, cell),
    [color, mode, rows, cell, side],
  )
  if (!url) return null
  const width = mode === 'drain' ? Math.round(DRAIN_COLS * cell * 0.62) : 180 * cell
  return (
    <span
      className={styles.edge}
      data-side={side}
      data-mode={mode}
      aria-hidden="true"
      style={{ '--strip': `url(${url})`, '--strip-h': `${rows * cell}px`, '--strip-w': `${width}px` } as CSSProperties}
    />
  )
}
