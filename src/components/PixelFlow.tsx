import { useRef } from 'react'
import { FLOW_PALETTE, flowFrame, type FlowVariant } from '../lib/pixelGrid'
import { usePixelCanvas } from './usePixelCanvas'
import styles from './Pixel.module.css'

const pitchFor = (width: number) => (width < 600 ? 6 : 10)

/**
 * A process drawn in pixels, left to right, for anywhere there's a sequence of steps. `helix`:
 * scattered pixels draw through a narrow waist into a double helix. `bands`: bands of colour
 * converge on a seam and fan out. Decoration only; the steps themselves carry the words.
 */
export function PixelFlow({ variant = 'helix', className }: { variant?: FlowVariant; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  usePixelCanvas(canvas, {
    palette: FLOW_PALETTE,
    pitch: pitchFor,
    fps: 24,
    still: 4,
    frame: (cells, cols, rows, time) => flowFrame(variant, cells, cols, rows, time),
  })
  return <canvas ref={canvas} className={`${styles.flow} ${className ?? ''}`} aria-hidden="true" />
}
