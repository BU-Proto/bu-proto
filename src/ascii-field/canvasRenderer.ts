import { swayPhases, swayU, swayV, tintLift } from './ambient'
import { sampleGradient } from './gradient'
import type { FieldFrame, FieldGeometry, FieldRenderer, GlyphAtlas } from './renderer'
import { FIELD, TRAIL_COLORS, type TrailColor } from './settings'

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')
  return ctx
}

/**
 * Fallback for browsers without WebGL2: draws each cell's glyph from the atlas, tints the glyphs
 * with a per-cell color image, slides the gradient wash underneath, then adds the trail's glyphs.
 * Same picture as the WebGL renderer except that the glyphs don't slide with the wind, at a
 * higher CPU cost.
 */
export class CanvasFieldRenderer implements FieldRenderer {
  readonly kind = 'canvas2d'
  /** Glyphs stay on the grid here; sliding them per pixel needs the GPU. */
  readonly canWarp = false
  readonly picksGlyphs = false
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly onDestroy: (() => void) | undefined
  /** One pixel per cell: the gradient wash, and the glyph tint. */
  private readonly colorCanvas = document.createElement('canvas')
  private readonly colorCtx = context2d(this.colorCanvas)
  private readonly tintCanvas = document.createElement('canvas')
  private readonly tintCtx = context2d(this.tintCanvas)
  /** The atlas's trail glyphs in the trail color. */
  private readonly trailCanvas = document.createElement('canvas')
  private readonly trailCtx = context2d(this.trailCanvas)
  private readonly rgb = new Float32Array(3)
  private colorImage: ImageData | null = null
  private tintImage: ImageData | null = null
  private geometry: FieldGeometry | null = null
  private atlas: GlyphAtlas | null = null
  private trailColor: TrailColor | null = null

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, onDestroy?: () => void) {
    this.canvas = canvas
    this.ctx = ctx
    this.onDestroy = onDestroy
  }

  setGeometry(geometry: FieldGeometry, atlas: GlyphAtlas): void {
    this.geometry = geometry
    const { canvas } = this
    canvas.width = geometry.pixelWidth
    canvas.height = geometry.pixelHeight
    canvas.style.width = `${geometry.width}px`
    canvas.style.height = `${geometry.height}px`
    this.colorCanvas.width = geometry.cols
    this.colorCanvas.height = geometry.rows
    this.colorImage = this.colorCtx.createImageData(geometry.cols, geometry.rows)
    this.tintCanvas.width = geometry.cols
    this.tintCanvas.height = geometry.rows
    this.tintImage = this.tintCtx.createImageData(geometry.cols, geometry.rows)
    this.setAtlas(atlas)
  }

  setAtlas(atlas: GlyphAtlas): void {
    this.atlas = atlas
    this.trailColor = null
  }

  draw(frame: FieldFrame): void {
    const { ctx, geometry, atlas, colorImage, tintImage, rgb } = this
    if (!geometry || !atlas || !colorImage || !tintImage) return
    const { cols, rows, cellW, cellH, cellPxW, cellPxH, width, height, pixelWidth, pixelHeight } = geometry
    const { cells, settings, time } = frame
    if (settings.trailColor !== this.trailColor) this.paintTrailGlyphs(settings.trailColor)

    // Each cell's color: its own place on the gradient, gently swaying.
    const color = colorImage.data
    const tint = tintImage.data
    const [phaseX, phaseY] = swayPhases(time)
    for (let j = 0; j < rows; j++) {
      const cy = (j + 0.5) * cellH
      const du = swayU(cy, phaseX)
      for (let i = 0; i < cols; i++) {
        const cx = (i + 0.5) * cellW
        sampleGradient(cx / width + du, cy / height + swayV(cx, phaseY), rgb)
        const o = (j * cols + i) * 4
        const lift = tintLift((0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255, settings.glyphContrast)
        for (let c = 0; c < 3; c++) {
          color[o + c] = rgb[c]
          tint[o + c] = rgb[c] + (255 - rgb[c]) * lift
        }
        color[o + 3] = 255
        tint[o + 3] = 255
      }
    }
    this.colorCtx.putImageData(colorImage, 0, 0)
    this.tintCtx.putImageData(tintImage, 0, 0)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, pixelWidth, pixelHeight)

    // 1. White background glyphs, one atlas cell each.
    const { slotW, pad } = atlas
    let current = 1
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const o = (j * cols + i) * 4
        const glyph = cells[o]
        if (glyph === 0 || cells[o + 2] !== 0) continue
        const alpha = cells[o + 1] / 255
        if (alpha !== current) ctx.globalAlpha = current = alpha
        ctx.drawImage(atlas.canvas, glyph * slotW + pad, pad, cellPxW, cellPxH, i * cellPxW, j * cellPxH, cellPxW, cellPxH)
      }
    }
    ctx.globalAlpha = 1

    // 2. Tint them with their cells' colors.
    ctx.imageSmoothingEnabled = true
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(this.tintCanvas, 0, 0, cols * cellPxW, rows * cellPxH)

    // 3. Underneath: the gradient wash over the dark ground.
    ctx.globalCompositeOperation = 'destination-over'
    if (settings.baseColor > 0.001) {
      ctx.globalAlpha = settings.baseColor
      ctx.drawImage(this.colorCanvas, 0, 0, cols * cellPxW, rows * cellPxH)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = `rgb(${FIELD.BASE_RGB.join(',')})`
    ctx.fillRect(0, 0, pixelWidth, pixelHeight)
    ctx.globalCompositeOperation = 'source-over'

    // 4. The trail's glyphs, in the cells whose characters stepped aside for them.
    current = 1
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const o = (j * cols + i) * 4
        const glyph = cells[o + 2]
        if (glyph === 0) continue
        const alpha = cells[o + 3] / 255
        if (alpha !== current) ctx.globalAlpha = current = alpha
        ctx.drawImage(this.trailCanvas, (glyph - 1) * slotW + pad, pad, cellPxW, cellPxH, i * cellPxW, j * cellPxH, cellPxW, cellPxH)
      }
    }
    ctx.globalAlpha = 1
  }

  destroy(): void {
    this.onDestroy?.()
  }

  /** Copy the atlas's trail glyphs and fill them with the trail color. */
  private paintTrailGlyphs(trailColor: TrailColor): void {
    const { atlas, trailCanvas, trailCtx } = this
    if (!atlas) return
    this.trailColor = trailColor
    const sx = atlas.trailBase * atlas.slotW
    trailCanvas.width = atlas.canvas.width - sx
    trailCanvas.height = atlas.canvas.height
    trailCtx.globalCompositeOperation = 'source-over'
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height)
    trailCtx.drawImage(atlas.canvas, sx, 0, trailCanvas.width, trailCanvas.height, 0, 0, trailCanvas.width, trailCanvas.height)
    trailCtx.globalCompositeOperation = 'source-in'
    trailCtx.fillStyle = TRAIL_COLORS[trailColor]
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height)
    trailCtx.globalCompositeOperation = 'source-over'
  }
}
