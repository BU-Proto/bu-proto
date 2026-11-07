import { useEffect, useRef, type RefObject } from 'react'
import { reducedMotion } from '../lib/useInView'

/** The dense end of the field's ramp: a cell is a character, so these read as ASCII art. */
const GLYPHS = '%#@*+xo=>'
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace'

interface PixelCanvasOptions {
  /** Colours by cell value. Value 0 is a blank cell. All must be solid colours. */
  palette: readonly string[]
  /** Distance from one cell to the next in CSS pixels, or a function of the canvas's width. */
  pitch: number | ((width: number) => number)
  /** Model steps per second. Low on purpose: the pixels should tick, not glide. */
  fps?: number
  /** The moment shown as a single still frame under reduced motion, in seconds. */
  still?: number
  /** Type size as a share of the cell. Past 1 a neighbouring cell's redraw shaves the edges off. */
  fontScale?: number
  /** The character for a cell, when a model wants its own. It has to be stable for that cell. */
  glyph?: (x: number, y: number, cols: number, rows: number) => string
  /** Fills `cells` (row by row) with palette indexes for this moment. */
  frame: (cells: Uint8Array, cols: number, rows: number, time: number, delta: number) => void
}

/**
 * Keeps a canvas drawn from a grid of coloured characters. Only cells that changed since the last step
 * are repainted, and nothing runs while the canvas is off screen or the tab is hidden. Under
 * reduced motion it draws one frame. Returns a function that redraws right away, for a model whose
 * data changed (a font arriving, say).
 */
export function usePixelCanvas(canvasRef: RefObject<HTMLCanvasElement | null>, options: PixelCanvasOptions) {
  const latest = useRef(options)
  const redraw = useRef<() => void>(() => undefined)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const still = reducedMotion()
    const grid = { cols: 0, rows: 0, pitch: 1, dpr: 1, cells: new Uint8Array(0), shown: new Uint8Array(0) }
    const clock = { id: 0, last: 0, time: 0, due: 0, onScreen: false }

    const measure = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const { pitch } = latest.current
      grid.pitch = typeof pitch === 'function' ? pitch(width) : pitch
      grid.dpr = Math.min(2, window.devicePixelRatio || 1)
      // Setting the size clears the canvas, so what's shown starts blank too.
      canvas.width = Math.round(width * grid.dpr)
      canvas.height = Math.round(height * grid.dpr)
      grid.cols = Math.ceil(width / grid.pitch)
      grid.rows = Math.floor(height / grid.pitch)
      grid.cells = new Uint8Array(grid.cols * grid.rows)
      grid.shown = new Uint8Array(grid.cols * grid.rows)
    }

    const paint = () => {
      const { cols, rows, pitch, dpr, cells, shown } = grid
      const { palette, glyph, fontScale = 1.15 } = latest.current
      const step = pitch * dpr
      let colour = -1
      context.font = `${Math.round(step * fontScale)}px ${MONO}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const value = cells[i]!
          if (value === shown[i]) continue
          shown[i] = value
          const left = Math.round(x * pitch * dpr)
          const top = Math.round(y * pitch * dpr)
          context.clearRect(left, top, Math.ceil(step), Math.ceil(step))
          if (value === 0) continue
          if (value !== colour) {
            colour = value
            context.fillStyle = palette[value]!
          }
          context.fillText(glyph ? glyph(x, y, cols, rows) : GLYPHS[(x * 7 + y * 13) % GLYPHS.length]!, left + step / 2, top + step / 2)
        }
      }
    }

    const step = (delta: number) => {
      if (grid.cols === 0 || grid.rows === 0) return
      latest.current.frame(grid.cells, grid.cols, grid.rows, clock.time, delta)
      paint()
    }

    const drawNow = () => {
      if (still) clock.time = latest.current.still ?? 0
      step(0)
    }

    const loop = (now: number) => {
      clock.id = requestAnimationFrame(loop)
      // A long gap (a stalled tab) counts as one short step, so nothing jumps.
      clock.time += Math.min(0.1, (now - (clock.last || now)) / 1000)
      clock.last = now
      if (now < clock.due) return
      const interval = 1000 / (latest.current.fps ?? 14)
      clock.due = Math.max(clock.due + interval, now)
      step(interval / 1000)
    }

    const sync = () => {
      const run = clock.onScreen && !document.hidden && !still
      if (run && !clock.id) {
        clock.last = 0
        clock.id = requestAnimationFrame(loop)
      } else if (!run && clock.id) {
        cancelAnimationFrame(clock.id)
        clock.id = 0
      }
    }

    measure()
    drawNow()
    redraw.current = drawNow

    const resize = new ResizeObserver(() => {
      if (canvas.clientWidth === 0) return
      if (Math.round(canvas.clientWidth * grid.dpr) === canvas.width && Math.round(canvas.clientHeight * grid.dpr) === canvas.height) return
      measure()
      drawNow()
    })
    resize.observe(canvas)
    const visible = new IntersectionObserver(([entry]) => {
      clock.onScreen = entry?.isIntersecting ?? false
      sync()
    })
    visible.observe(canvas)
    document.addEventListener('visibilitychange', sync)

    return () => {
      cancelAnimationFrame(clock.id)
      resize.disconnect()
      visible.disconnect()
      document.removeEventListener('visibilitychange', sync)
      redraw.current = () => undefined
    }
  }, [canvasRef])

  return redraw
}
