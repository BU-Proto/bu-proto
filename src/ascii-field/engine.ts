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

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')
  return ctx
}

/**
 * Renders the hero background into a full-viewport canvas:
 *
 * 1. a field of monospace glyphs whose characters and colors come from the sampled gradient
 *    (brightness picks the character, a column wave imitates fluted glass), and
 * 2. a cursor trail of ○ > _ glyphs that are born where the pointer passes and dissolve,
 *    driven by a Stable-Fluids simulation whose wind also smears the gradient underneath.
 *
 * The engine owns its DOM listeners and animation loop; call `destroy()` to release them.
 */
export class AsciiFieldEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  /** White glyphs for the current ramp, one cell each, drawn once and stamped per frame. */
  private readonly atlas: HTMLCanvasElement
  private readonly atlasCtx: CanvasRenderingContext2D
  /** One pixel per background cell: the gradient wash. */
  private readonly colorCanvas: HTMLCanvasElement
  private readonly colorCtx: CanvasRenderingContext2D
  /** One pixel per background cell: the glyph tint. */
  private readonly tintCanvas: HTMLCanvasElement
  private readonly tintCtx: CanvasRenderingContext2D
  private readonly noise = createValueNoise(FOG.NOISE_N)
  private readonly rgb = new Float32Array(3)
  private readonly motionQuery: MediaQueryList
  private readonly clearObserver: ResizeObserver | null

  private settings: FieldSettings
  private reduceMotion: boolean

  // Viewport and background grid.
  private width = 0
  private height = 0
  private dpr = 1
  private cols = 0
  private rows = 0
  private cellW = 8
  private cellH = 13
  private ramp: string = RAMPS.classic
  private ribK = 2
  private glyphs = new Uint8Array(0)
  private phase = new Float32Array(0)
  private offsetX = new Float32Array(0)
  private offsetY = new Float32Array(0)
  private alpha = new Float32Array(0)
  private colorImage: ImageData | null = null
  private tintImage: ImageData | null = null

  // Fog (cursor trail).
  private fluid: FluidField | null = null
  private fogCols = 0
  private fogRows = 0
  private clearMask: Float32Array = new Float32Array(0)
  private texX = 0
  private texY = 0

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
    this.atlas = document.createElement('canvas')
    this.atlasCtx = context2d(this.atlas)
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

    // Wait briefly for the mono face so the glyph atlas starts with real metrics.
    const boot = () => {
      if (this.destroyed) return
      this.booted = true
      this.build()
      this.start()
    }
    Promise.race([document.fonts.load(`500 13px ${MONO_FAMILY}`), wait(1500)]).then(boot, boot)
  }

  /** Apply new settings; rebuilds the grid only when the glyph size changes. */
  setSettings(next: FieldSettings): void {
    const prev = this.settings
    this.settings = next
    if (!this.booted || this.destroyed) return
    if (next.cellSize !== prev.cellSize) this.build()
    else if (next.ramp !== prev.ramp) this.buildAtlas()
    if (!this.running) this.render(0)
  }

  /** Clear the trail and let the gradient settle back to rest. */
  settle(): void {
    this.fluid?.reset()
    if (this.booted && !this.running) this.render(0)
  }

  /** Re-measure the elements marked `data-fog-clear` (call after showing or hiding them). */
  refreshClearMask(): void {
    if (!this.booted || this.destroyed) return
    const elements = document.querySelectorAll(CLEAR_SELECTOR)
    if (this.clearObserver) {
      this.clearObserver.disconnect()
      for (const element of elements) this.clearObserver.observe(element)
    }
    this.clearMask = buildClearMask(elements, this.fogCols, this.fogRows)
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
    canvas.width = Math.round(this.width * this.dpr)
    canvas.height = Math.round(this.height * this.dpr)
    canvas.style.width = `${this.width}px`
    canvas.style.height = `${this.height}px`
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    const { cellSize } = this.settings
    ctx.font = `500 ${cellSize}px ${MONO_STACK}`
    this.cellW = ctx.measureText('M').width || cellSize * 0.6
    this.cellH = cellSize
    this.cols = Math.ceil(this.width / this.cellW) + 1
    this.rows = Math.ceil(this.height / this.cellH) + 1
    const cells = this.cols * this.rows
    this.glyphs = new Uint8Array(cells)
    this.phase = Float32Array.from({ length: cells }, () => Math.random() * Math.PI * 2)
    this.offsetX = new Float32Array(cells)
    this.offsetY = new Float32Array(cells)
    this.alpha = new Float32Array(cells)
    this.ribK = (Math.PI * 2) / Math.max(2.2, this.width / FIELD.RIBS_ACROSS / this.cellW)
    this.colorCanvas.width = this.cols
    this.colorCanvas.height = this.rows
    this.colorImage = this.colorCtx.createImageData(this.cols, this.rows)
    this.tintCanvas.width = this.cols
    this.tintCanvas.height = this.rows
    this.tintImage = this.tintCtx.createImageData(this.cols, this.rows)
    this.buildAtlas()

    // The fluid runs on the fog's glyph grid scaled by RES_SCALE, spanning the viewport.
    this.fogCols = Math.ceil(this.width / FOG.CELL_X) + 1
    this.fogRows = Math.ceil(this.height / FOG.CELL_Y) + 1
    this.fluid = new FluidField(
      this.width,
      this.height,
      Math.ceil(this.fogCols * FOG.RES_SCALE),
      Math.ceil(this.fogRows * FOG.RES_SCALE),
    )
    this.refreshClearMask()
  }

  private buildAtlas(): void {
    const { atlas, atlasCtx, cellW, cellH, dpr } = this
    this.ramp = RAMPS[this.settings.ramp]
    atlas.width = Math.ceil(this.ramp.length * cellW * dpr)
    atlas.height = Math.ceil(cellH * dpr)
    atlasCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    atlasCtx.clearRect(0, 0, atlas.width, atlas.height)
    atlasCtx.font = `500 ${this.settings.cellSize}px ${MONO_STACK}`
    atlasCtx.fillStyle = '#fff'
    atlasCtx.textAlign = 'center'
    atlasCtx.textBaseline = 'middle'
    for (let i = 0; i < this.ramp.length; i++) {
      atlasCtx.fillText(this.ramp[i], i * cellW + cellW / 2, cellH / 2 + 0.5)
    }
  }

  // ---- loop ---------------------------------------------------------------------------------

  private start(): void {
    if (this.running || !this.booted || this.destroyed) return
    if (this.reduceMotion) {
      this.render(0)
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

  private readonly frame = (now: number): void => {
    this.raf = 0
    if (!this.running || !this.fluid) return
    const time = now / 1000
    let dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 1 / 60
    this.lastFrame = now
    if (dt > 1 / 30) dt = 1 / 30
    this.fluid.step(dt, time, this.settings.trailLength)
    this.texX += FOG.TEX_FLOW * dt
    this.texY += FOG.TEX_FLOW * 0.7 * dt
    this.render(time)
    this.raf = requestAnimationFrame(this.frame)
  }

  // ---- rendering ----------------------------------------------------------------------------

  private render(time: number): void {
    const { ctx, fluid, colorImage, tintImage, rgb } = this
    if (!fluid || !colorImage || !tintImage) return
    const { cols, rows, cellW, cellH, ramp, ribK, glyphs, phase, offsetX, offsetY, alpha } = this
    const { ribbing, glyphContrast, baseColor } = this.settings
    const color = colorImage.data
    const tint = tintImage.data
    const steps = ramp.length - 1
    const span = FIELD.DENSITY_HI - FIELD.DENSITY_LO
    const { cols: fw, pitchX, pitchY, uvx, uvy, vx, vy, density } = fluid
    const xMax = fluid.cols - 1.001
    const yMax = fluid.rows - 1.001
    const maxOffX = cellW * 0.7
    const maxOffY = cellH * 0.7

    for (let j = 0; j < rows; j++) {
      const fyAbs = Math.min(yMax, Math.max(0, ((j + 0.5) * cellH) / pitchY))
      const j0 = fyAbs | 0
      const fy = fyAbs - j0
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        const fxAbs = Math.min(xMax, Math.max(0, ((i + 0.5) * cellW) / pitchX))
        const i0 = fxAbs | 0
        const fx = fxAbs - i0
        const k00 = j0 * fw + i0
        const k10 = k00 + 1
        const k01 = k00 + fw
        const k11 = k01 + 1
        const w00 = (1 - fx) * (1 - fy)
        const w10 = fx * (1 - fy)
        const w01 = (1 - fx) * fy
        const w11 = fx * fy

        // The gradient, sampled where the wind has carried this cell's coordinates.
        sampleGradient(
          uvx[k00] * w00 + uvx[k10] * w10 + uvx[k01] * w01 + uvx[k11] * w11,
          uvy[k00] * w00 + uvy[k10] * w10 + uvy[k01] * w01 + uvy[k11] * w11,
          rgb,
        )
        const r = rgb[0]
        const g = rgb[1]
        const b = rgb[2]
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        const val = Math.max(r, g, b) / 255

        // Character: brightness, modulated by the ribbing and a faint shimmer.
        let dens = 0.7 * lum + 0.3 * val
        const rib = 0.5 + 0.5 * Math.sin(i * ribK)
        dens *= 1 - ribbing * 0.08 + ribbing * 0.16 * rib
        dens += 0.012 * Math.sin(time * 1.3 + phase[k])
        const gi = Math.round(((dens - FIELD.DENSITY_LO) / span) * steps)
        glyphs[k] = gi < 0 ? 0 : gi > steps ? steps : gi

        const o = k * 4
        color[o] = r
        color[o + 1] = g
        color[o + 2] = b
        color[o + 3] = 255

        // Tint: the cell color lifted toward white, more where the base is already light,
        // so the characters keep similar contrast across the whole gradient.
        let light = (lum - 0.55) / 0.25
        light = light < 0 ? 0 : light > 1 ? 1 : light
        const lift = Math.min(1, (0.5 + 0.35 * light) * glyphContrast)
        tint[o] = r + (255 - r) * lift
        tint[o + 1] = g + (255 - g) * lift
        tint[o + 2] = b + (255 - b) * lift
        tint[o + 3] = 255

        // The wind nudges the characters...
        const windX = (vx[k00] * w00 + vx[k10] * w10 + vx[k01] * w01 + vx[k11] * w11) * pitchX
        const windY = (vy[k00] * w00 + vy[k10] * w10 + vy[k01] * w01 + vy[k11] * w11) * pitchY
        const ox = windX * FIELD.WIND_NUDGE
        const oy = windY * FIELD.WIND_NUDGE
        offsetX[k] = ox > maxOffX ? maxOffX : ox < -maxOffX ? -maxOffX : ox
        offsetY[k] = oy > maxOffY ? maxOffY : oy < -maxOffY ? -maxOffY : oy

        // ...and where the trail's fog is dense, it takes their place.
        const fog = density[k00] * w00 + density[k10] * w10 + density[k01] * w01 + density[k11] * w11
        let q = (fog - 0.04) / 0.46
        q = q < 0 ? 0 : q > 1 ? 1 : q
        alpha[k] = 1 - q * q * (3 - 2 * q)
      }
    }
    this.colorCtx.putImageData(colorImage, 0, 0)
    this.tintCtx.putImageData(tintImage, 0, 0)

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, this.width, this.height)

    // 1. Stamp white glyphs from the atlas, offset by the wind.
    const sw = cellW * this.dpr
    const sh = cellH * this.dpr
    let currentAlpha = 1
    for (let j = 0; j < rows; j++) {
      const y = j * cellH
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        const gi = glyphs[k]
        if (gi === 0) continue
        const a = alpha[k]
        if (a < 0.02) continue
        if (a !== currentAlpha) {
          ctx.globalAlpha = a
          currentAlpha = a
        }
        ctx.drawImage(this.atlas, gi * sw, 0, sw, sh, i * cellW + offsetX[k], y + offsetY[k], cellW, cellH)
      }
    }
    ctx.globalAlpha = 1

    // 2. Tint them with their per-cell colors.
    ctx.imageSmoothingEnabled = true
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(this.tintCanvas, 0, 0, cols * cellW, rows * cellH)

    // 3. Underneath: the gradient wash over the dark ground.
    ctx.globalCompositeOperation = 'destination-over'
    if (baseColor > 0.001) {
      ctx.globalAlpha = baseColor
      ctx.drawImage(this.colorCanvas, 0, 0, cols * cellW, rows * cellH)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = `rgb(${FIELD.BASE_RGB.join(',')})`
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.globalCompositeOperation = 'source-over'

    this.drawFog()
  }

  /**
   * The trail: luma = texture × min(density, 1), then contrast → gamma → invert → quantize
   * into ○ > _ or blank. Density decides presence; the texture decides shape.
   */
  private drawFog(): void {
    const { ctx, fluid, clearMask, fogCols, fogRows, noise } = this
    if (!fluid) return
    const { cols: fw, pitchX, pitchY, density } = fluid
    const xMax = fluid.cols - 1.001
    const yMax = fluid.rows - 1.001
    const shadow = this.settings.trailColor === 'white'

    ctx.font = `400 ${FOG.FONT_PX}px ${MONO_STACK}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = TRAIL_COLORS[this.settings.trailColor]
    if (shadow) {
      // A soft halo keeps white glyphs readable over the pale parts of the gradient.
      ctx.shadowColor = 'rgba(0, 30, 60, 0.38)'
      ctx.shadowBlur = 3
      ctx.shadowOffsetY = 1
    }

    for (let cj = 0; cj < fogRows; cj++) {
      const py = (cj + 0.5) * FOG.CELL_Y
      const fyAbs = Math.min(yMax, py / pitchY)
      const j0 = fyAbs | 0
      const fy = fyAbs - j0
      for (let ci = 0; ci < fogCols; ci++) {
        const px = (ci + 0.5) * FOG.CELL_X
        const fxAbs = Math.min(xMax, px / pitchX)
        const i0 = fxAbs | 0
        const fx = fxAbs - i0
        const k00 = j0 * fw + i0
        let d =
          (density[k00] * (1 - fx) + density[k00 + 1] * fx) * (1 - fy) +
          (density[k00 + fw] * (1 - fx) + density[k00 + fw + 1] * fx) * fy
        if (d < 0.02) continue
        if (d > 1) d = 1

        const n = noise(ci * FOG.TEX_SCALE + this.texX, cj * FOG.TEX_SCALE + this.texY)
        const texture = FOG.TEX_FLOOR + (1 - FOG.TEX_FLOOR) * Math.pow(n, FOG.TEX_SHAPE)
        let t = (texture * d - 0.5) * FOG.CONTRAST + 0.5
        t = t < 0 ? 0 : t > 1 ? 1 : t
        const gi = Math.floor((1 - Math.pow(t, FOG.GAMMA)) * 4)
        if (gi > 2) continue

        let a: number = FOG.ALPHA
        const clear = clearMask[cj * fogCols + ci]
        if (clear > 0) {
          if (clear >= 0.999) continue
          a *= 1 - clear * clear * (3 - 2 * clear)
        }
        ctx.globalAlpha = a
        ctx.fillText(FOG_GLYPHS[gi], px, py + 0.5)
      }
    }

    ctx.globalAlpha = 1
    if (shadow) {
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }
  }

  // ---- events -------------------------------------------------------------------------------

  private readonly onPointerMove = (event: PointerEvent): void => {
    const hadPointer = this.hasPointer
    const x0 = this.pointerX
    const y0 = this.pointerY
    const t0 = this.pointerTime
    this.hasPointer = true
    this.pointerX = event.clientX
    this.pointerY = event.clientY
    this.pointerTime = event.timeStamp
    if (!hadPointer || !this.running || !this.fluid) return
    const elapsed = (event.timeStamp - t0) / 1000
    this.fluid.stroke(x0, y0, event.clientX, event.clientY, elapsed, this.settings.wind)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.target instanceof Element && event.target.closest(IGNORE_SELECTOR)) return
    this.hasPointer = true
    this.pointerX = event.clientX
    this.pointerY = event.clientY
    this.pointerTime = event.timeStamp
    if (this.running) this.fluid?.splash(event.clientX, event.clientY)
  }

  private readonly onPointerOut = (event: PointerEvent): void => {
    // Leaving the window: forget the last position so re-entry doesn't draw a long streak.
    if (!event.relatedTarget) this.hasPointer = false
  }

  private readonly onResize = (): void => {
    window.clearTimeout(this.resizeTimer)
    this.resizeTimer = window.setTimeout(() => {
      if (!this.booted || this.destroyed) return
      this.build()
      this.render(this.running ? performance.now() / 1000 : 0)
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

  /** A face finished loading: redraw the atlas, or rebuild if the mono metrics changed. */
  private readonly onFontsLoaded = (): void => {
    if (!this.booted || this.destroyed) return
    this.ctx.font = `500 ${this.settings.cellSize}px ${MONO_STACK}`
    const cellW = this.ctx.measureText('M').width || this.settings.cellSize * 0.6
    if (Math.abs(cellW - this.cellW) > 0.01) this.build()
    else this.buildAtlas()
    this.scheduleClearMask()
    if (!this.running) this.render(0)
  }

  /** Text moved or resized: recompute the clear mask on the next frame. */
  private readonly scheduleClearMask = (): void => {
    if (this.clearFrame || this.destroyed) return
    this.clearFrame = requestAnimationFrame(() => {
      this.clearFrame = 0
      if (!this.booted || this.destroyed) return
      this.clearMask = buildClearMask(document.querySelectorAll(CLEAR_SELECTOR), this.fogCols, this.fogRows)
    })
  }
}
