import { useRef } from 'react'
import { HEAT_PALETTE, skylineFrame } from '../lib/pixelGrid'
import { usePixelCanvas } from './usePixelCanvas'

/** The low skyline of glyphs along the foot of a page. Its columns change height slowly. */
export function PixelSkyline({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  usePixelCanvas(canvas, {
    palette: HEAT_PALETTE,
    pitch: 14,
    fps: 6,
    still: 4,
    frame: (cells, cols, rows, time) => skylineFrame(cells, cols, rows, time),
  })
  return <canvas ref={canvas} className={className} aria-hidden="true" data-trail-art />
}
