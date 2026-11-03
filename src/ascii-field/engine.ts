import { FluidField } from './fluid'
import { sampleGradient } from './gradient'
import { createValueNoise } from './noise'
import {
  FIELD,
  FOG,
  FOG_GLYPHS,
  MONO_FAMILY,
  MONO_STACK,
  RAMPS,
  TRAIL_COLORS,
  type FieldSettings,
} from './settings'
import { buildClearMask, CLEAR_SELECTOR } from './textClearing'

/** Pointer-downs inside elements marked `data-fog-ignore` (e.g. the tweak panel) don't splash. */
const IGNORE_SELECTOR = '[data-fog-ignore]'
/** Marks a touched cell that shows a faded background glyph rather than a trail glyph. */
const NO_TRAIL = 255
/** Room around each trail glyph sprite for its soft halo, in px. */
const TRAIL_PAD = 3

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')
  return ctx
}

/**
 * Renders the hero background into a full-viewport canvas as one grid of monospace glyphs:
 *
 * - Everywhere, a character picked from the gradient's brightness (with a column wave that
 *   imitates fluted glass), tinted with the gradient's color. This layer never moves; it is
 *   drawn once and cached.
 * - Along the cursor's path, those same cells switch to ○ > _ glyphs driven by a
 *   Stable-Fluids fog: born where the pointer passes, blown by its wind, dissolved within
 *   about a second, with a blank feather around them. Only the cells the fog touches are
 *   repainted each frame, and the simulation sleeps once the fog is gone.
 *
 * The engine owns its DOM listeners and animation loop; call `destroy()` to release them.
 */
export class AsciiFieldEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  /** The finished background (ground, wash and tinted glyphs) at device resolution. */
  private readonly staticLayer: HTMLCanvasElement
  private readonly staticCtx: CanvasRenderingContext2D
  /** Ground and wash only: what a cell looks like with its glyph removed. */
  private readonly washLayer: HTMLCanvasElement
  private readonly washCtx: CanvasRenderingContext2D
  /** White background glyphs for the current ramp, one cell each. */
  private readonly atlas: HTMLCanvasElement
  private readonly atlasCtx: CanvasRenderingContext2D
  /** ○ > _ in the trail color, with a little padding for the halo. */
  private readonly trailAtlas: HTMLCanvasElement
  private readonly trailAtlasCtx: CanvasRenderingContext2D
  /** One pixel per cell: the gradient's color, and the glyph tint. */
  private readonly colorCanvas: HTMLCanvasElement
  private readonly colorCtx: CanvasRenderingContext2D
  private readonly tintCanvas: HTMLCanvasElement
  private readonly tintCtx: CanvasRenderingContext2D
  private readonly noise = createValueNoise(FOG.NOISE_N)
  private readonly rgb = new Float32Array(3)
  private readonly motionQuery: MediaQueryList
  private readonly clearObserver: ResizeObserver | null

  private settings: FieldSettings
  private reduceMotion: boolean

  // Viewport and grid.
  private width = 0
  private height = 0
  private dpr = 1
  private cols = 0
  private rows = 0
  private cellW = 8
  private cellH = 13
  /** Glyph size relative to the reference fog's 11px cells; scales brush and rings. */
  private sizeScale = 1

  // Per-cell data, fixed for a given layout and settings.
  private lum = new Float32Array(0)
  private value = new Float32Array(0)
  private glyphs = new Uint8Array(0)
  private colorImage: ImageData | null = null
  private tintImage: ImageData | null = null

  // Cells the fog touches this frame: index, trail glyph (or NO_TRAIL) and opacity.
  private touched = new Int32Array(0)
  private touchedGlyph = new Uint8Array(0)
  private touchedAlpha = new Float32Array(0)

  // Trail.
  private fluid: FluidField | null = null
  private clearMask: Float32Array = new Float32Array(0)
  private texTime = 0
  /** Draw on the next frame even if the fog is asleep (it just fell asleep, or settings changed). */
  private needsDraw = true

  // Pointer.
  private hasPointer = false
  private pointerX = 0
  private pointerY = 0
  private pointerTime = 0

  // Lifecycle.
  private booted = false
  private destroyed = false
  private running = false
  private raf = 0
  private lastFrame = 0
  private resizeTimer = 0
  private clearFrame = 0

  constructor(canvas: HTMLCanvasElement, settings: FieldSettings) {
    this.canvas = canvas
    this.ctx = context2d(canvas)
    this.staticLayer = document.createElement('canvas')
    this.staticCtx = context2d(this.staticLayer)
    this.washLayer = document.createElement('canvas')
    this.washCtx = context2d(this.washLayer)
    this.atlas = document.createElement('canvas')
    this.atlasCtx = context2d(this.atlas)
    this.trailAtlas = document.createElement('canvas')
    this.trailAtlasCtx = context2d(this.trailAtlas)
    this.colorCanvas = document.createElement('canvas')
    this.colorCtx = context2d(this.colorCanvas)
    this.tintCanvas = document.createElement('canvas')
    this.tintCtx = context2d(this.tintCanvas)
    this.settings = settings
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reduceMotion = this.motionQuery.matches
    this.clearObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(this.scheduleClearMask)

    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true })
    window.addEventListener('pointerout', this.onPointerOut)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('scroll', this.scheduleClearMask, { passive: true })
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    document.fonts.addEventListener('loadingdone', this.onFontsLoaded)
    this.motionQuery.addEventListener('change', this.onMotionChange)

    // Wait briefly for the mono face so the glyph grid starts with real metrics.
    const boot = () => {
      if (this.destroyed) return
      this.booted = true
      this.build()
      this.start()
    }
    Promise.race([document.fonts.load(`500 13px ${MONO_FAMILY}`), wait(1500)]).then(boot, boot)
  }

  /** Apply new settings; rebuilds only what the change affects. */
  setSettings(next: FieldSettings): void {
    const prev = this.settings
    this.settings = next
    if (!this.booted || this.destroyed) return
    if (next.cellSize !== prev.cellSize) {
      this.build()
    } else {
      if (next.ramp !== prev.ramp) this.buildAtlas()
      if (next.glyphContrast !== prev.glyphContrast) this.buildTint()
      if (next.ramp !== prev.ramp || next.ribbing !== prev.ribbing) this.buildGlyphs()
      if (
        next.ramp !== prev.ramp ||
        next.ribbing !== prev.ribbing ||
        next.glyphContrast !== prev.glyphContrast ||
        next.baseColor !== prev.baseColor
      ) {
        this.buildStatic()
      }
      if (next.trailColor !== prev.trailColor) this.buildTrailAtlas()
    }
    this.redraw()
  }

  /** Clear the trail and still the wind. */
  settle(): void {
    this.fluid?.reset()
    this.redraw()
  }

  /** Re-measure the elements marked `data-fog-clear` (call after showing or hiding them). */
  refreshClearMask(): void {
    if (!this.booted || this.destroyed) return
    const elements = document.querySelectorAll(CLEAR_SELECTOR)
    if (this.clearObserver) {
      this.clearObserver.disconnect()
      for (const element of elements) this.clearObserver.observe(element)
    }
    this.clearMask = buildClearMask(elements, this.cols, this.rows, this.cellW, this.cellH)
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.stop()
    cancelAnimationFrame(this.clearFrame)
    window.clearTimeout(this.resizeTimer)
    this.clearObserver?.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerout', this.onPointerOut)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('scroll', this.scheduleClearMask)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    document.fonts.removeEventListener('loadingdone', this.onFontsLoaded)
    this.motionQuery.removeEventListener('change', this.onMotionChange)
  }

  // ---- setup --------------------------------------------------------------------------------

  private build(): void {
    const { canvas, ctx } = this
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    const deviceW = Math.round(this.width * this.dpr)
    const deviceH = Math.round(this.height * this.dpr)
    for (const layer of [canvas, this.staticLayer, this.washLayer]) {
      layer.width = deviceW
      layer.height = deviceH
    }
    canvas.style.width = `${this.width}px`
    canvas.style.height = `${this.height}px`

    const { cellSize } = this.settings
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.font = `500 ${cellSize}px ${MONO_STACK}`
    this.cellW = ctx.measureText('M').width || cellSize * 0.6
    this.cellH = cellSize
    this.sizeScale = cellSize / FOG.REF_CELL
    this.cols = Math.ceil(this.width / this.cellW) + 1
    this.rows = Math.ceil(this.height / this.cellH) + 1

    const cells = this.cols * this.rows
    this.lum = new Float32Array(cells)
    this.value = new Float32Array(cells)
    this.glyphs = new Uint8Array(cells)
    this.touched = new Int32Array(cells)
    this.touchedGlyph = new Uint8Array(cells)
    this.touchedAlpha = new Float32Array(cells)
    this.colorCanvas.width = this.cols
    this.colorCanvas.height = this.rows
    this.colorImage = this.colorCtx.createImageData(this.cols, this.rows)
    this.tintCanvas.width = this.cols
    this.tintCanvas.height = this.rows
    this.tintImage = this.tintCtx.createImageData(this.cols, this.rows)

    this.buildColors()
    this.buildTint()
    this.buildAtlas()
    this.buildGlyphs()
    this.buildStatic()
    this.buildTrailAtlas()

    // The reference sizes its fluid grid from square character cells × RES_SCALE. Here a
    // square cell is one row tall, so the trail keeps its proportions at any glyph size.
    this.fluid = new FluidField(
      this.width,
      this.height,
      Math.round(Math.ceil(this.width / cellSize) * FOG.RES_SCALE),
      Math.round(Math.ceil(this.height / cellSize) * FOG.RES_SCALE),
    )
    this.needsDraw = true
    this.refreshClearMask()
  }

  /** Sample the gradient at every cell center: each cell's color and brightness. */
  private buildColors(): void {
    const { cols, rows, cellW, cellH, width, height, rgb, lum, value, colorImage } = this
    if (!colorImage) return
    const color = colorImage.data
    for (let j = 0; j < rows; j++) {
      const v = Math.min(1, ((j + 0.5) * cellH) / height)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        sampleGradient(Math.min(1, ((i + 0.5) * cellW) / width), v, rgb)
        const r = rgb[0]
        const g = rgb[1]
        const b = rgb[2]
        lum[k] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        value[k] = Math.max(r, g, b) / 255
        const o = k * 4
        color[o] = r
        color[o + 1] = g
        color[o + 2] = b
        color[o + 3] = 255
      }
    }
    this.colorCtx.putImageData(colorImage, 0, 0)
  }

  /** Glyph tint: each cell's color lifted toward white, more where the base is already light. */
  private buildTint(): void {
    const { colorImage, tintImage, lum } = this
    if (!colorImage || !tintImage) return
    const color = colorImage.data
    const tint = tintImage.data
    const { glyphContrast } = this.settings
    for (let k = 0; k < lum.length; k++) {
      let light = (lum[k] - 0.55) / 0.25
      light = light < 0 ? 0 : light > 1 ? 1 : light
      const lift = Math.min(1, (0.5 + 0.35 * light) * glyphContrast)
      const o = k * 4
      tint[o] = color[o] + (255 - color[o]) * lift
      tint[o + 1] = color[o + 1] + (255 - color[o + 1]) * lift
      tint[o + 2] = color[o + 2] + (255 - color[o + 2]) * lift
      tint[o + 3] = 255
    }
    this.tintCtx.putImageData(tintImage, 0, 0)
  }

  /** Each cell's character: brightness, modulated by the fluted-glass ribbing, mapped onto the ramp. */
  private buildGlyphs(): void {
    const { cols, rows, cellW, width, lum, value, glyphs } = this
    const { ribbing } = this.settings
    const steps = RAMPS[this.settings.ramp].length - 1
    const span = FIELD.DENSITY_HI - FIELD.DENSITY_LO
    const ribK = (Math.PI * 2) / Math.max(2.2, width / FIELD.RIBS_ACROSS / cellW)
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        const rib = 0.5 + 0.5 * Math.sin(i * ribK)
        const density = (0.7 * lum[k] + 0.3 * value[k]) * (1 - ribbing * 0.08 + ribbing * 0.16 * rib)
        const gi = Math.round(((density - FIELD.DENSITY_LO) / span) * steps)
        glyphs[k] = gi < 0 ? 0 : gi > steps ? steps : gi
      }
    }
  }

  private buildAtlas(): void {
    const { atlas, atlasCtx, cellW, cellH, dpr } = this
    const ramp = RAMPS[this.settings.ramp]
    atlas.width = Math.ceil(ramp.length * cellW * dpr)
    atlas.height = Math.ceil(cellH * dpr)
    atlasCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    atlasCtx.clearRect(0, 0, atlas.width, atlas.height)
    atlasCtx.font = `500 ${this.settings.cellSize}px ${MONO_STACK}`
    atlasCtx.fillStyle = '#fff'
    atlasCtx.textAlign = 'center'
    atlasCtx.textBaseline = 'middle'
    for (let i = 0; i < ramp.length; i++) {
      atlasCtx.fillText(ramp[i], i * cellW + cellW / 2, cellH / 2 + 0.5)
    }
  }

  /** Paint the cached layers: ground + wash, and the full background with its tinted glyphs. */
  private buildStatic(): void {
    const { washCtx: wash, staticCtx: layer, cols, rows, cellW, cellH, dpr, glyphs } = this
    const { baseColor } = this.settings

    wash.setTransform(dpr, 0, 0, dpr, 0, 0)
    wash.globalCompositeOperation = 'source-over'
    wash.globalAlpha = 1
    wash.fillStyle = `rgb(${FIELD.BASE_RGB.join(',')})`
    wash.fillRect(0, 0, this.width, this.height)
    if (baseColor > 0.001) {
      wash.imageSmoothingEnabled = true
      wash.globalAlpha = baseColor
      wash.drawImage(this.colorCanvas, 0, 0, cols * cellW, rows * cellH)
      wash.globalAlpha = 1
    }

    layer.setTransform(dpr, 0, 0, dpr, 0, 0)
    layer.globalCompositeOperation = 'source-over'
    layer.globalAlpha = 1
    layer.clearRect(0, 0, this.width, this.height)
    const sw = cellW * dpr
    const sh = cellH * dpr
    for (let j = 0; j < rows; j++) {
      const y = j * cellH
      for (let i = 0; i < cols; i++) {
        const gi = glyphs[j * cols + i]
        if (gi !== 0) layer.drawImage(this.atlas, gi * sw, 0, sw, sh, i * cellW, y, cellW, cellH)
      }
    }
    layer.imageSmoothingEnabled = true
    layer.globalCompositeOperation = 'source-in'
    layer.drawImage(this.tintCanvas, 0, 0, cols * cellW, rows * cellH)
    layer.globalCompositeOperation = 'destination-over'
    layer.setTransform(1, 0, 0, 1, 0, 0)
    layer.drawImage(this.washLayer, 0, 0)
    layer.globalCompositeOperation = 'source-over'
    this.needsDraw = true
  }

  /** ○ > _ at the background's glyph size, each fitted inside one cell so neighbours never touch. */
  private buildTrailAtlas(): void {
    const { trailAtlas: atlas, trailAtlasCtx: a, cellW, cellH, dpr } = this
    const spriteW = cellW + TRAIL_PAD * 2
    const spriteH = cellH + TRAIL_PAD * 2
    atlas.width = Math.ceil(FOG_GLYPHS.length * spriteW * dpr)
    atlas.height = Math.ceil(spriteH * dpr)
    a.setTransform(dpr, 0, 0, dpr, 0, 0)
    a.clearRect(0, 0, atlas.width, atlas.height)
    a.textAlign = 'center'
    a.textBaseline = 'middle'
    a.fillStyle = TRAIL_COLORS[this.settings.trailColor]
    const halo = this.settings.trailColor === 'white'
    if (halo) {
      // A soft halo keeps white glyphs readable over the pale parts of the gradient.
      // Shadow sizes ignore the transform, so they're given in device pixels.
      a.shadowColor = 'rgba(0, 30, 60, 0.38)'
      a.shadowBlur = 2 * dpr
      a.shadowOffsetY = dpr
    }
    FOG_GLYPHS.forEach((glyph, g) => {
      let size = this.settings.cellSize
      a.font = `500 ${size}px ${MONO_STACK}`
      const glyphWidth = a.measureText(glyph).width
      if (glyphWidth > cellW * 0.96) {
        size *= (cellW * 0.96) / glyphWidth
        a.font = `500 ${size}px ${MONO_STACK}`
      }
      a.fillText(glyph, g * spriteW + spriteW / 2, spriteH / 2 + 0.5)
    })
    if (halo) {
      a.shadowColor = 'transparent'
      a.shadowBlur = 0
      a.shadowOffsetY = 0
    }
    this.needsDraw = true
  }

  // ---- loop ---------------------------------------------------------------------------------

  private start(): void {
    if (this.running || !this.booted || this.destroyed) return
    if (this.reduceMotion) {
      this.render()
      return
    }
    this.running = true
    this.lastFrame = 0
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  /** Draw now if the loop isn't running (paused or reduced motion), otherwise on the next frame. */
  private redraw(): void {
    this.needsDraw = true
    if (this.booted && !this.running) this.render()
  }

  private readonly frame = (now: number): void => {
    this.raf = 0
    const { fluid } = this
    if (!this.running || !fluid) return
    let dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 0.016
    this.lastFrame = now
    if (dt > 0.05) dt = 0.05
    else if (dt <= 0) dt = 0.016
    if (fluid.awake) {
      fluid.step(dt, this.settings.trailLength, FOG.MIN_DENSITY)
      this.texTime += dt
      this.render()
      // Draw once more after the fog falls asleep, so its last glyphs are cleared.
      this.needsDraw = true
    } else if (this.needsDraw) {
      this.render()
      this.needsDraw = false
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  // ---- rendering ----------------------------------------------------------------------------

  private render(): void {
    const { ctx, fluid, dpr } = this
    if (!fluid) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.drawImage(this.staticLayer, 0, 0)

    const count = this.findTouchedCells(fluid)
    if (count === 0) return
    const { cols, cellW, cellH, touched, touchedGlyph, touchedAlpha } = this
    const deviceW = this.canvas.width
    const deviceH = this.canvas.height

    // 1. Clear each touched cell back to the wash; feathered cells get their glyph back, faded.
    for (let n = 0; n < count; n++) {
      const k = touched[n]
      const i = k % cols
      const j = (k - i) / cols
      const x0 = Math.floor(i * cellW * dpr)
      const y0 = Math.floor(j * cellH * dpr)
      const w = Math.min(deviceW, Math.floor((i + 1) * cellW * dpr)) - x0
      const h = Math.min(deviceH, Math.floor((j + 1) * cellH * dpr)) - y0
      if (w <= 0 || h <= 0) continue
      ctx.drawImage(this.washLayer, x0, y0, w, h, x0, y0, w, h)
      if (touchedGlyph[n] === NO_TRAIL && touchedAlpha[n] > 0.02) {
        ctx.globalAlpha = touchedAlpha[n]
        ctx.drawImage(this.staticLayer, x0, y0, w, h, x0, y0, w, h)
        ctx.globalAlpha = 1
      }
    }

    // 2. The trail's glyphs, drawn last so their halos aren't clipped by neighbouring cells.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const tw = (cellW + TRAIL_PAD * 2) * dpr
    const th = (cellH + TRAIL_PAD * 2) * dpr
    for (let n = 0; n < count; n++) {
      const g = touchedGlyph[n]
      if (g === NO_TRAIL) continue
      const k = touched[n]
      const i = k % cols
      const j = (k - i) / cols
      ctx.globalAlpha = touchedAlpha[n]
      ctx.drawImage(
        this.trailAtlas,
        g * tw,
        0,
        tw,
        th,
        i * cellW - TRAIL_PAD,
        j * cellH - TRAIL_PAD,
        cellW + TRAIL_PAD * 2,
        cellH + TRAIL_PAD * 2,
      )
    }
    ctx.globalAlpha = 1
  }

  /**
   * Decide what the fog does to each cell it covers: luma = texture × min(density, 1), then
   * contrast → gamma → invert → quantize into ○ > _ or blank. Density decides presence, the
   * texture decides which glyph; a blank inside the fog fades the background glyph instead.
   * Returns how many cells were recorded in `touched`.
   */
  private findTouchedCells(fluid: FluidField): number {
    const bounds = fluid.bounds
    if (!bounds) return 0
    const { cols, rows, cellW, cellH, noise, clearMask, touched, touchedGlyph, touchedAlpha } = this
    const { cols: fw, scaleX, scaleY, density } = fluid
    const xMax = fluid.cols - 1.001
    const yMax = fluid.rows - 1.001
    // Only the cells whose centers fall within one grid cell of the fog's bounding box.
    const iFrom = Math.max(0, Math.floor((bounds[0] - 1) / scaleX / cellW))
    const iTo = Math.min(cols - 1, Math.ceil((bounds[1] + 1) / scaleX / cellW))
    const jFrom = Math.max(0, Math.floor((bounds[2] - 1) / scaleY / cellH))
    const jTo = Math.min(rows - 1, Math.ceil((bounds[3] + 1) / scaleY / cellH))
    // The texture is laid out in square-cell units and scrolls right and up, as in the reference.
    const flow = this.texTime * FOG.TEX_FLOW
    const texStepX = (cellW / cellH) * FOG.TEX_SCALE
    const texStepY = FOG.TEX_SCALE
    const featherSpan = FOG.FEATHER_HI - FOG.FEATHER_LO

    let count = 0
    for (let j = jFrom; j <= jTo; j++) {
      let fyAbs = (j + 0.5) * cellH * scaleY
      fyAbs = fyAbs > yMax ? yMax : fyAbs
      const j0 = fyAbs | 0
      const fy = fyAbs - j0
      for (let i = iFrom; i <= iTo; i++) {
        let fxAbs = (i + 0.5) * cellW * scaleX
        fxAbs = fxAbs > xMax ? xMax : fxAbs
        const i0 = fxAbs | 0
        const fx = fxAbs - i0
        const k00 = j0 * fw + i0
        let d =
          (density[k00] * (1 - fx) + density[k00 + 1] * fx) * (1 - fy) +
          (density[k00 + fw] * (1 - fx) + density[k00 + fw + 1] * fx) * fy
        if (d < FOG.MIN_DENSITY) continue

        // Near text the fog steps back and the background glyph stays.
        const k = j * cols + i
        const c = clearMask[k]
        const keep = c > 0 ? 1 - c * c * (3 - 2 * c) : 1
        if (keep < 0.5) continue

        if (d > 1) d = 1
        const n = noise(i * texStepX + flow, j * texStepY - flow * 0.7)
        const texture = FOG.TEX_FLOOR + (1 - FOG.TEX_FLOOR) * Math.pow(n, FOG.TEX_SHAPE)
        let t = (texture * d - 0.5) * FOG.CONTRAST + 0.5
        t = t < 0 ? 0 : t > 1 ? 1 : t
        const g = Math.floor((1 - Math.pow(t, FOG.GAMMA)) * 4)
        if (g <= 2) {
          touched[count] = k
          touchedGlyph[count] = g
          touchedAlpha[count] = FOG.ALPHA * keep
          count++
        } else {
          // The fog's blank feather: the background character fades out of the way.
          let q = (d - FOG.FEATHER_LO) / featherSpan
          if (q <= 0) continue
          q = q > 1 ? 1 : q
          touched[count] = k
          touchedGlyph[count] = NO_TRAIL
          touchedAlpha[count] = 1 - q * q * (3 - 2 * q)
          count++
        }
      }
    }
    return count
  }

  // ---- events -------------------------------------------------------------------------------

  private readonly onPointerMove = (event: PointerEvent): void => {
    // Like the reference, the trail follows a mouse or pen; touch drags are left to scrolling.
    if (event.pointerType === 'touch') return
    const hadPointer = this.hasPointer
    const dx = event.clientX - this.pointerX
    const dy = event.clientY - this.pointerY
    const elapsed = (event.timeStamp - this.pointerTime) / 1000
    this.hasPointer = true
    this.pointerX = event.clientX
    this.pointerY = event.clientY
    this.pointerTime = event.timeStamp
    if (!hadPointer || !this.running || !this.fluid) return
    this.fluid.stroke(dx, dy, event.clientX, event.clientY, elapsed, this.settings.wind, this.sizeScale)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest(IGNORE_SELECTOR)) return
    this.hasPointer = true
    this.pointerX = event.clientX
    this.pointerY = event.clientY
    this.pointerTime = event.timeStamp
    if (this.running) this.fluid?.splash(event.clientX, event.clientY, this.sizeScale)
  }

  private readonly onPointerOut = (event: PointerEvent): void => {
    // Leaving the window: forget the last position so re-entry doesn't count as a long, fast move.
    if (!event.relatedTarget) this.hasPointer = false
  }

  private readonly onResize = (): void => {
    window.clearTimeout(this.resizeTimer)
    this.resizeTimer = window.setTimeout(() => {
      if (!this.booted || this.destroyed) return
      this.build()
      this.render()
    }, 120)
  }

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.stop()
    else this.start()
  }

  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.reduceMotion = event.matches
    if (this.reduceMotion) {
      this.stop()
      this.fluid?.reset()
    }
    this.start()
  }

  /** A face finished loading: redraw the glyphs, or rebuild if the mono metrics changed. */
  private readonly onFontsLoaded = (): void => {
    if (!this.booted || this.destroyed) return
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.font = `500 ${this.settings.cellSize}px ${MONO_STACK}`
    const cellW = this.ctx.measureText('M').width || this.settings.cellSize * 0.6
    if (Math.abs(cellW - this.cellW) > 0.01) {
      this.build()
    } else {
      this.buildAtlas()
      this.buildStatic()
      this.buildTrailAtlas()
    }
    this.scheduleClearMask()
    this.redraw()
  }

  /** Text moved or resized: recompute the clear mask on the next frame. */
  private readonly scheduleClearMask = (): void => {
    if (this.clearFrame || this.destroyed) return
    this.clearFrame = requestAnimationFrame(() => {
      this.clearFrame = 0
      if (!this.booted || this.destroyed) return
      this.clearMask = buildClearMask(
        document.querySelectorAll(CLEAR_SELECTOR),
        this.cols,
        this.rows,
        this.cellW,
        this.cellH,
      )
    })
  }
}
