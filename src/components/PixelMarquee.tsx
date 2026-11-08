import { useEffect, useRef } from 'react'
import { HEAT_PALETTE, marqueeFrame, type TextMask } from '../lib/pixelGrid'
import { usePixelCanvas } from './usePixelCanvas'
import styles from './Pixel.module.css'

const pitchFor = (width: number) => (width < 700 ? 5 : 8)

/** Empty columns between one pass of the text and the next. */
const SPACING = 28

/** Draws the text on a scratch canvas and reads back which cells it covers. */
function rasterise(text: string, rows: number): TextMask | null {
  const scratch = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!scratch) return null
  // Host Grotesk's capitals stand about 0.7 of the font size.
  const size = Math.round(rows / 0.72)
  const font = `500 ${size}px 'Host Grotesk', sans-serif`
  const line = text.toUpperCase()
  scratch.font = font
  const width = Math.ceil(scratch.measureText(line).width)
  if (width === 0) return null
  const cols = width + SPACING
  scratch.canvas.width = cols
  scratch.canvas.height = rows
  // Resizing resets the context, so the font is set again.
  scratch.font = font
  scratch.textBaseline = 'alphabetic'
  scratch.fillStyle = '#000'
  scratch.fillText(line, 0, rows - 1)
  const alpha = scratch.getImageData(0, 0, cols, rows).data
  const on = new Uint8Array(cols * rows)
  for (let i = 0; i < on.length; i++) on[i] = alpha[i * 4 + 3]! > 110 ? 1 : 0
  return { cols, rows, on }
}

/**
 * Huge letters made of coloured pixels, scrolling slowly across the screen. It's hidden from
 * screen readers, so the same words need to be on the page as text. Still under reduced motion.
 */
export function PixelMarquee({ text, speed = 18, className }: { text: string; speed?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const mask = useRef<TextMask | null>(null)
  const redraw = usePixelCanvas(canvas, {
    palette: HEAT_PALETTE,
    pitch: pitchFor,
    fps: 12,
    still: 2,
    frame: (cells, cols, rows, time) => {
      if (mask.current?.rows !== rows) mask.current = rasterise(text, rows)
      if (mask.current) marqueeFrame(mask.current, cells, cols, rows, time, speed)
    },
  })

  // The first raster may have used a fallback font; draw it again once ours has arrived.
  useEffect(() => {
    mask.current = null
    const mounted = { live: true }
    document.fonts?.load(`500 120px 'Host Grotesk'`).then(() => {
      if (!mounted.live) return
      mask.current = null
      redraw.current()
    })
    return () => {
      mounted.live = false
    }
  }, [text, redraw])

  return <canvas ref={canvas} className={`${styles.marquee} ${className ?? ''}`} aria-hidden="true" data-trail-art />
}
