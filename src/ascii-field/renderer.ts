import { CanvasFieldRenderer } from './canvasRenderer'
import { FOG_GLYPHS, MONO_STACK, type FieldSettings } from './settings'
import { WebGLFieldRenderer } from './webglRenderer'

/** The character grid laid over the viewport. */
export interface FieldGeometry {
  /** Viewport, CSS px. */
  width: number
  height: number
  dpr: number
  /** Drawing buffer, device px. */
  pixelWidth: number
  pixelHeight: number
  cols: number
  rows: number
  /** Cell size in whole device px, so every glyph lands on the pixel grid and stays crisp. */
  cellPxW: number
  cellPxH: number
  /** The same cell size in CSS px. */
  cellW: number
  cellH: number
  /** Width of one fluted-glass rib, CSS px. */
  ribPeriod: number
}

/**
 * How far the wind has carried the characters, on the fluid's grid: for each node, two floats
 * (CSS px) from a point on screen back to the home of the character drifting over it.
 */
export interface WarpField {
  data: Float32Array
  cols: number
  rows: number
  /** Fluid nodes per CSS px. */
  scaleX: number
  scaleY: number
}

/**
 * What a renderer draws for one frame. `cells` holds 4 bytes per cell, row by row: background
 * glyph (index into the ramp, 0 = blank) for renderers that don't pick glyphs themselves, or for
 * those that do, how much of the drift the cell gets (0–255, less behind text); then the glyph's
 * opacity (0–255, dimmed under the trail), trail glyph (1–3 for ○ > _, 0 = none, which replaces
 * the background glyph) and its opacity.
 */
export interface FieldFrame {
  /** Seconds, for the ambient sway; 0 draws the still pose. */
  time: number
  cells: Uint8Array
  /** False when `cells` is byte-for-byte what the last frame sent. */
  cellsChanged: boolean
  settings: FieldSettings
  /** Present when the characters should be drawn where the wind has carried them. */
  warp: WarpField | null
}

export interface FieldRenderer {
  readonly kind: 'webgl2' | 'canvas2d'
  /** Whether this renderer can slide the glyphs with the wind (`FieldFrame.warp`). */
  readonly canWarp: boolean
  /** Whether this renderer picks each cell's background glyph itself (else `cells` byte 0). */
  readonly picksGlyphs: boolean
  setGeometry(geometry: FieldGeometry, atlas: GlyphAtlas): void
  setAtlas(atlas: GlyphAtlas): void
  draw(frame: FieldFrame): void
  destroy(): void
}

/** White glyphs on transparent, one per slot: the ramp first, then ○ > _. */
export interface GlyphAtlas {
  readonly canvas: HTMLCanvasElement
  /** Slot pitch in device px; each slot holds one cell, inset by `pad` on every side. */
  readonly slotW: number
  readonly slotH: number
  readonly pad: number
  /** Slot of the first trail glyph. */
  readonly trailBase: number
}

const ATLAS_PAD = 2

/** Draw every glyph the field uses into `canvas`, each clipped to one cell of `geometry`. */
export function drawGlyphAtlas(
  canvas: HTMLCanvasElement,
  ramp: string,
  geometry: FieldGeometry,
  cellSize: number,
): GlyphAtlas {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')
  const glyphs = [...ramp, ...FOG_GLYPHS]
  const { cellPxW, cellPxH, dpr } = geometry
  const pad = ATLAS_PAD
  const slotW = cellPxW + pad * 2
  const slotH = cellPxH + pad * 2
  canvas.width = slotW * glyphs.length
  canvas.height = slotH
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  glyphs.forEach((glyph, slot) => {
    let size = cellSize * dpr
    ctx.font = `500 ${size}px ${MONO_STACK}`
    // The trail's glyphs are fitted inside their cell so neighbours never touch.
    if (slot >= ramp.length) {
      const glyphWidth = ctx.measureText(glyph).width
      if (glyphWidth > cellPxW * 0.96) {
        size *= (cellPxW * 0.96) / glyphWidth
        ctx.font = `500 ${size}px ${MONO_STACK}`
      }
    }
    const x = slot * slotW + pad
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, pad, cellPxW, cellPxH)
    ctx.clip()
    ctx.fillText(glyph, x + cellPxW / 2, pad + cellPxH / 2 + 0.5 * dpr)
    ctx.restore()
  })
  return { canvas, slotW, slotH, pad, trailBase: ramp.length }
}

/**
 * Draw with WebGL2 where it's available: the GPU paints every pixel each frame, so the whole
 * field can stay in motion at full frame rate. Otherwise fall back to Canvas 2D.
 * `onRestored` runs when a lost WebGL context comes back, so a still frame can be redrawn.
 */
export function createFieldRenderer(canvas: HTMLCanvasElement, onRestored: () => void): FieldRenderer {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  })
  if (gl) {
    try {
      return new WebGLFieldRenderer(canvas, gl, onRestored)
    } catch (error) {
      console.warn('[ascii-field] WebGL2 setup failed; drawing with Canvas 2D instead.', error)
    }
  }
  const ctx = gl ? null : canvas.getContext('2d')
  if (ctx) return new CanvasFieldRenderer(canvas, ctx)
  // The canvas is held by a WebGL context that couldn't be set up: draw on a twin laid over it.
  const twin = canvas.cloneNode(false) as HTMLCanvasElement
  const twinCtx = twin.getContext('2d')
  if (!twinCtx) throw new Error('Canvas 2D is not supported in this browser')
  canvas.after(twin)
  canvas.style.visibility = 'hidden'
  return new CanvasFieldRenderer(twin, twinCtx, () => {
    twin.remove()
    canvas.style.visibility = ''
  })
}
