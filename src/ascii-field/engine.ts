import { driftPose, swayPhases, swayU, swayV } from './ambient'
import { FluidField } from './fluid'
import { sampleGradient } from './gradient'
import { createValueNoise } from './noise'
import {
  createFieldRenderer,
  drawGlyphAtlas,
  type FieldGeometry,
  type FieldRenderer,
  type GlyphAtlas,
  type WarpField,
} from './renderer'
import { FIELD, FOG, MONO_FAMILY, MONO_STACK, RAMPS, type FieldSettings } from './settings'
import { buildClearMask, CLEAR_SELECTOR } from './textClearing'

/** Pointer-downs inside elements marked `data-fog-ignore` (e.g. the tweak panel) don't splash. */
const IGNORE_SELECTOR = '[data-fog-ignore]'
const TAU = Math.PI * 2

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/**
 * Box-blur a grid of w × h nodes holding two interleaved floats each, in place, with edges
 * clamped. Running sums keep it linear in the grid size whatever the radius.
 */
function blurPairs(data: Float32Array, scratch: Float32Array, w: number, h: number, r: number): void {
  const inv = 1 / (2 * r + 1)
  for (let j = 0; j < h; j++) {
    const row = j * w
    for (let c = 0; c < 2; c++) {
      let sum = 0
      for (let o = -r; o <= r; o++) sum += data[(row + (o < 0 ? 0 : o > w - 1 ? w - 1 : o)) * 2 + c]
      for (let i = 0; i < w; i++) {
        scratch[(row + i) * 2 + c] = sum * inv
        const add = i + r + 1 > w - 1 ? w - 1 : i + r + 1
        const drop = i - r < 0 ? 0 : i - r
        sum += data[(row + add) * 2 + c] - data[(row + drop) * 2 + c]
      }
    }
  }
  for (let i = 0; i < w; i++) {
    for (let c = 0; c < 2; c++) {
      let sum = 0
      for (let o = -r; o <= r; o++) sum += scratch[((o < 0 ? 0 : o > h - 1 ? h - 1 : o) * w + i) * 2 + c]
      for (let j = 0; j < h; j++) {
        data[(j * w + i) * 2 + c] = sum * inv
        const add = j + r + 1 > h - 1 ? h - 1 : j + r + 1
        const drop = j - r < 0 ? 0 : j - r
        sum += scratch[(add * w + i) * 2 + c] - scratch[(drop * w + i) * 2 + c]
      }
    }
  }
}

/**
 * Bilinear sample of a node grid (w × h nodes, `stride` floats per node, starting at `offset`)
 * at node coordinates (x, y), clamped to the grid.
 */
function sampleNodes(
  data: Float32Array,
  w: number,
  h: number,
  stride: number,
  offset: number,
  x: number,
  y: number,
): number {
  x = x < 0 ? 0 : x > w - 1.001 ? w - 1.001 : x
  y = y < 0 ? 0 : y > h - 1.001 ? h - 1.001 : y
  const i = x | 0
  const j = y | 0
  const fx = x - i
  const fy = y - j
  const a = (j * w + i) * stride + offset
  const b = a + w * stride
  return (
    (data[a] * (1 - fx) + data[a + stride] * fx) * (1 - fy) + (data[b] * (1 - fx) + data[b + stride] * fx) * fy
  )
}

/**
 * Runs the hero background in a full-viewport canvas: one grid of monospace glyphs.
 *
 * - The gradient's colors stay where they are apart from a slow ambient sway. Each cell's
 *   character comes from the gradient's brightness, with a column wave that imitates fluted
 *   glass and a faint shimmer.
 * - The cursor's wind (a Stable-Fluids simulation) carries the characters: the glyphs slide
 *   around the pointer and ease back, while the colors stay put. Every few seconds a gentle
 *   swell slides a patch of them on its own, so the field keeps breathing.
 * - Along the path, cells switch to the fog's ○ > _ glyphs, born where the pointer passes and
 *   dissolved within about a second, over a soft veil that dims the art beneath.
 *
 * The CPU runs the fluid, lays the fog into the grid and works out how far the glyphs have
 * slid. The WebGL2 renderer does the rest per pixel on the GPU; where WebGL2 isn't available,
 * a Canvas 2D renderer draws the same field with the glyphs picked on the CPU and held in
 * place. The engine owns its DOM listeners and animation loop; call `destroy()` to release them.
 */
export class AsciiFieldEngine {
  private readonly renderer: FieldRenderer
  /** Off-screen canvases for measuring the mono face and drawing the glyph atlas. */
  private readonly measureCtx: CanvasRenderingContext2D
  private readonly atlasCanvas = document.createElement('canvas')
  private readonly noise = createValueNoise(FOG.NOISE_N)
  private readonly rgb = new Float32Array(3)
  private readonly motionQuery: MediaQueryList
  private readonly clearObserver: ResizeObserver | null

  private settings: FieldSettings
  private reduceMotion: boolean

  // Grid.
  private geometry: FieldGeometry | null = null
  private atlas: GlyphAtlas | null = null
  /** Glyph size relative to the reference fog's 11px cells; scales brush and rings. */
  private sizeScale = 1
  /** 4 bytes per cell for the renderer: glyph, its opacity, trail glyph, its opacity. */
  private cells = new Uint8Array(0)

  // Per column / row / cell, fixed for a given grid.
  private colX = new Float32Array(0)
  private colU = new Float32Array(0)
  private colRib = new Float32Array(0)
  private colSway = new Float32Array(0)
  private colNode = new Int32Array(0)
  private colFrac = new Float32Array(0)
  private rowY = new Float32Array(0)
  private rowV = new Float32Array(0)
  private rowNode = new Int32Array(0)
  private rowFrac = new Float32Array(0)
  private phaseSin = new Float32Array(0)
  private phaseCos = new Float32Array(0)

  // Fluid.
  private fluid: FluidField | null = null
  /** How far the wind has carried the characters, for the renderer to slide the glyphs. */
  private warp: WarpField | null = null
  private warpScratch = new Float32Array(0)
  /** Longest slide in the warp field, CSS px. */
  private warpReach = 0
  /** Cells whose fog bytes were written last frame: [i0, j0, i1, j1] inclusive. */
  private fogRect: [number, number, number, number] | null = null
  private clearMask: Float32Array = new Float32Array(0)
  /** The clear mask changed, so `cells` needs uploading even if the fog didn't move. */
  private calmChanged = false
  private texTime = 0

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
    this.settings = settings
    this.renderer = createFieldRenderer(canvas, this.onRendererRestored)
    const measureCtx = document.createElement('canvas').getContext('2d')
    if (!measureCtx) throw new Error('Canvas 2D is not supported in this browser')
    this.measureCtx = measureCtx
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

  /** Which renderer is drawing: 'webgl2', or 'canvas2d' where WebGL2 isn't available. */
  get rendererKind(): FieldRenderer['kind'] {
    return this.renderer.kind
  }

  /** Apply new settings; rebuilds the grid only when the glyph size changes. */
  setSettings(next: FieldSettings): void {
    const prev = this.settings
    this.settings = next
    if (!this.booted || this.destroyed) return
    if (next.cellSize !== prev.cellSize) this.build()
    else if (next.ramp !== prev.ramp) this.redrawAtlas()
    if (!this.running) this.render(0)
  }

  /** Clear the trail, still the wind and put every character back in place. */
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
    this.measureClearMask(elements)
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
    this.renderer.destroy()
  }

  // ---- setup --------------------------------------------------------------------------------

  /** The mono face's advance at the current glyph size, CSS px. */
  private measureAdvance(): number {
    const { cellSize } = this.settings
    this.measureCtx.font = `500 ${cellSize}px ${MONO_STACK}`
    return this.measureCtx.measureText('M').width || cellSize * 0.6
  }

  private build(): void {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const { cellSize } = this.settings
    const cellPxW = Math.max(1, Math.round(this.measureAdvance() * dpr))
    const cellPxH = Math.max(1, Math.round(cellSize * dpr))
    const pixelWidth = Math.max(1, Math.round(width * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    const geometry: FieldGeometry = {
      width,
      height,
      dpr,
      pixelWidth,
      pixelHeight,
      cols: Math.ceil(pixelWidth / cellPxW),
      rows: Math.ceil(pixelHeight / cellPxH),
      cellPxW,
      cellPxH,
      cellW: cellPxW / dpr,
      cellH: cellPxH / dpr,
      ribPeriod: Math.max((2.2 * cellPxW) / dpr, width / FIELD.RIBS_ACROSS),
    }
    this.geometry = geometry
    this.sizeScale = cellSize / FOG.REF_CELL
    this.cells = new Uint8Array(geometry.cols * geometry.rows * 4)
    for (let o = 1; o < this.cells.length; o += 4) this.cells[o] = 255
    this.fogRect = null

    // The reference sizes its fluid grid from square character cells × RES_SCALE. Here a
    // square cell is one row tall, so the trail and the push keep their proportions at any size.
    let fluidCols = Math.ceil(width / cellSize) * FOG.RES_SCALE
    let fluidRows = Math.ceil(height / cellSize) * FOG.RES_SCALE
    const crowding = Math.sqrt((fluidCols * fluidRows) / FOG.MAX_NODES)
    if (crowding > 1) {
      fluidCols /= crowding
      fluidRows /= crowding
    }
    const fluid = new FluidField(width, height, Math.round(fluidCols), Math.round(fluidRows))
    this.fluid = fluid
    this.warp = {
      data: new Float32Array(fluid.size * 2),
      cols: fluid.cols,
      rows: fluid.rows,
      scaleX: fluid.scaleX,
      scaleY: fluid.scaleY,
    }
    this.warpScratch = new Float32Array(fluid.size * 2)
    this.layoutCells(geometry, fluid)
    this.atlas = drawGlyphAtlas(this.atlasCanvas, RAMPS[this.settings.ramp], geometry, cellSize)
    this.renderer.setGeometry(geometry, this.atlas)
    this.refreshClearMask()
  }

  private redrawAtlas(): void {
    if (!this.geometry) return
    this.atlas = drawGlyphAtlas(this.atlasCanvas, RAMPS[this.settings.ramp], this.geometry, this.settings.cellSize)
    this.renderer.setAtlas(this.atlas)
  }

  /** Precompute where each column and row sits on the gradient and on the fluid grid. */
  private layoutCells(geometry: FieldGeometry, fluid: FluidField): void {
    const { cols, rows, cellW, cellH, width, height } = geometry
    this.colX = new Float32Array(cols)
    this.colU = new Float32Array(cols)
    this.colRib = new Float32Array(cols)
    this.colSway = new Float32Array(cols)
    this.colNode = new Int32Array(cols)
    this.colFrac = new Float32Array(cols)
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * cellW
      const node = Math.min(x * fluid.scaleX, fluid.cols - 1.001)
      this.colX[i] = x
      this.colU[i] = x / width
      this.colNode[i] = node | 0
      this.colFrac[i] = node - (node | 0)
    }
    this.rowY = new Float32Array(rows)
    this.rowV = new Float32Array(rows)
    this.rowNode = new Int32Array(rows)
    this.rowFrac = new Float32Array(rows)
    for (let j = 0; j < rows; j++) {
      const y = (j + 0.5) * cellH
      const node = Math.min(y * fluid.scaleY, fluid.rows - 1.001)
      this.rowY[j] = y
      this.rowV[j] = y / height
      this.rowNode[j] = node | 0
      this.rowFrac[j] = node - (node | 0)
    }
    const count = cols * rows
    this.phaseSin = new Float32Array(count)
    this.phaseCos = new Float32Array(count)
    for (let k = 0; k < count; k++) {
      const phase = Math.random() * TAU
      this.phaseSin[k] = Math.sin(phase)
      this.phaseCos[k] = Math.cos(phase)
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
    const { fluid } = this
    if (!this.running || !fluid) return
    let dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 0.016
    this.lastFrame = now
    if (dt > 0.05) dt = 0.05
    else if (dt <= 0) dt = 0.016
    const time = now / 1000
    fluid.step(dt, this.settings.trailLength, this.renderer.canWarp ? this.settings.push : 0)
    this.texTime += dt
    this.render(time)
    this.raf = requestAnimationFrame(this.frame)
  }

  // ---- each frame ---------------------------------------------------------------------------

  private render(time: number): void {
    if (!this.geometry) return
    const warping = this.renderer.canWarp && this.updateWarp()
    let cellsChanged = this.paintFog(warping) || this.calmChanged
    this.calmChanged = false
    if (!this.renderer.picksGlyphs) {
      this.pickGlyphs(time)
      cellsChanged = true
    }
    this.renderer.draw({
      time,
      cells: this.cells,
      cellsChanged,
      settings: this.settings,
      warp: warping ? this.warp : null,
    })
  }

  /**
   * Turn the fluid's character coordinates into the displacement the renderer slides the
   * glyphs by. Where the wind shears hard, the whole field is scaled back so the grid stretches
   * at most by WARP_LIMIT and never folds over itself. Returns false when nothing has moved.
   */
  private updateWarp(): boolean {
    const { fluid, geometry, warp } = this
    if (!fluid || !geometry || !warp || fluid.charactersHome) return false
    const { cols: w, rows: h, charU, charV, scaleX, scaleY } = fluid
    const { data } = warp
    const toU = 1 / (w - 1)
    const toV = 1 / (h - 1)
    let moved = 0
    for (let j = 0; j < h; j++) {
      const homeV = j * toV
      for (let i = 0, k = j * w; i < w; i++, k++) {
        const dx = (charU[k] - i * toU) * geometry.width
        const dy = (charV[k] - homeV) * geometry.height
        data[k * 2] = dx
        data[k * 2 + 1] = dy
        const m = (dx < 0 ? -dx : dx) + (dy < 0 ? -dy : dy)
        if (m > moved) moved = m
      }
    }
    if (moved < 0.05) return false

    // The wind is concentrated in a narrow band along the path; blur its displacement so the
    // glyphs slide as one smooth sheet instead of tearing at the band's edges.
    const radius = Math.max(1, Math.round(FIELD.WARP_BLUR * Math.min(scaleX, scaleY)))
    blurPairs(data, this.warpScratch, w, h, radius)
    blurPairs(data, this.warpScratch, w, h, radius)

    // The steepest stretch anywhere: an upper bound on how much a glyph is scaled.
    let shear = 0
    for (let j = 0; j < h - 1; j++) {
      for (let i = 0, k = j * w; i < w - 1; i++, k++) {
        const o = k * 2
        const xx = (data[o + 2] - data[o]) * scaleX
        const xy = (data[o + w * 2] - data[o]) * scaleY
        const yx = (data[o + 3] - data[o + 1]) * scaleX
        const yy = (data[o + w * 2 + 1] - data[o + 1]) * scaleY
        const sx = (xx < 0 ? -xx : xx) + (xy < 0 ? -xy : xy)
        const sy = (yx < 0 ? -yx : yx) + (yy < 0 ? -yy : yy)
        if (sx > shear) shear = sx
        if (sy > shear) shear = sy
      }
    }
    const scale = shear > FIELD.WARP_LIMIT ? FIELD.WARP_LIMIT / shear : 1
    let reach = 0
    for (let k = 0; k < data.length; k++) {
      const d = (data[k] *= scale)
      if (d > reach) reach = d
      else if (-d > reach) reach = -d
    }
    this.warpReach = reach
    return true
  }

  /**
   * Each cell's background glyph (for renderers that don't pick glyphs themselves): the
   * gradient's brightness at its home, ribbed, shimmering and drifting, with the drift calmed
   * behind marked text. The renderer may slide the glyph with the wind; its color is always the
   * gradient under it.
   */
  private pickGlyphs(time: number): void {
    const { geometry, cells, rgb, noise, clearMask } = this
    if (!geometry) return
    const { cols, rows } = geometry
    const { colX, colU, colRib, colSway, rowY, rowV, phaseSin, phaseCos } = this
    const { amount, ribShift, flow } = driftPose(time, this.settings.drift)
    const ribK = TAU / geometry.ribPeriod
    const { ribbing } = this.settings
    const steps = RAMPS[this.settings.ramp].length - 1
    const toGlyph = steps / (FIELD.DENSITY_HI - FIELD.DENSITY_LO)
    const ribBase = 1 - ribbing * 0.08
    const ribAmp = ribbing * 0.16
    const shimmerSin = FIELD.SHIMMER * Math.sin(time * FIELD.SHIMMER_SPEED)
    const shimmerCos = FIELD.SHIMMER * Math.cos(time * FIELD.SHIMMER_SPEED)
    const [phaseX, phaseY] = swayPhases(time)
    for (let i = 0; i < cols; i++) {
      colSway[i] = swayV(colX[i], phaseY)
      colRib[i] = 0.5 + 0.5 * Math.sin(colX[i] * ribK + ribShift)
    }
    for (let j = 0; j < rows; j++) {
      const sway = swayU(rowY[j], phaseX)
      const v = rowV[j]
      const waveY = rowY[j] * FIELD.DRIFT_SCALE
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        sampleGradient(colU[i] + sway, v + colSway[i], rgb)
        const r = rgb[0]
        const g = rgb[1]
        const b = rgb[2]
        const bright = (0.7 * (0.2126 * r + 0.7152 * g + 0.0722 * b) + 0.3 * (r > g ? (r > b ? r : b) : g > b ? g : b)) / 255
        let dens = bright * (ribBase + ribAmp * colRib[i]) + shimmerSin * phaseCos[k] + shimmerCos * phaseSin[k]
        if (amount > 0) {
          const waveX = colX[i] * FIELD.DRIFT_SCALE
          const wave =
            noise.sample(waveX + flow[0], waveY + flow[1]) +
            noise.sample(waveX * 1.7 + flow[2], waveY * 1.7 + flow[3]) -
            1
          dens += wave * amount * (1 - clearMask[k])
        }
        const gi = Math.round((dens - FIELD.DENSITY_LO) * toGlyph)
        cells[k * 4] = gi < 0 ? 0 : gi > steps ? steps : gi
      }
    }
  }

  /**
   * The fog's part of each cell: ○ > _ where it is dense enough (replacing the background
   * glyph) and a veil that dims the art beneath it. Only the cells around the fog are visited.
   * With `warping`, the renderer draws each cell where the wind has carried it, so the fog is
   * read there. Returns whether any cell changed.
   */
  private paintFog(warping: boolean): boolean {
    const { fluid, geometry, warp, cells, clearMask, noise } = this
    if (!fluid || !geometry || !warp) return false
    const { cols, rows, cellW, cellH } = geometry
    const hadFog = this.fogRect !== null

    // Put last frame's cells back to "no fog".
    if (this.fogRect) {
      const [a0, b0, a1, b1] = this.fogRect
      for (let j = b0; j <= b1; j++) {
        for (let o = (j * cols + a0) * 4, end = (j * cols + a1) * 4; o <= end; o += 4) {
          cells[o + 1] = 255
          cells[o + 2] = 0
          cells[o + 3] = 0
        }
      }
      this.fogRect = null
    }
    const box = fluid.fogBox
    if (fluid.maxDensity < FOG.MIN_DENSITY || box.i1 < box.i0) return hadFog

    // The fog's nodes in cells, widened by a node for interpolation and by the longest slide.
    const margin = warping ? this.warpReach : 0
    const i0 = Math.max(0, Math.floor(((box.i0 - 1) / fluid.scaleX - margin) / cellW))
    const i1 = Math.min(cols - 1, Math.ceil(((box.i1 + 1) / fluid.scaleX + margin) / cellW))
    const j0 = Math.max(0, Math.floor(((box.j0 - 1) / fluid.scaleY - margin) / cellH))
    const j1 = Math.min(rows - 1, Math.ceil(((box.j1 + 1) / fluid.scaleY + margin) / cellH))
    if (i1 < i0 || j1 < j0) return hadFog
    this.fogRect = [i0, j0, i1, j1]

    const { colX, colNode, colFrac, rowY, rowNode, rowFrac } = this
    const { cols: fw, rows: fh, density, scaleX, scaleY } = fluid
    const shift = warp.data
    const flow = this.texTime * FOG.TEX_FLOW
    const texStepX = (cellW / cellH) * FOG.TEX_SCALE
    const veilSpan = FOG.VEIL_HI - FOG.VEIL_LO
    for (let j = j0; j <= j1; j++) {
      const y = rowY[j]
      const fy = rowFrac[j]
      const nodeRow = rowNode[j] * fw
      for (let i = i0; i <= i1; i++) {
        const k = j * cols + i
        let d: number
        if (warping) {
          // Where this cell is drawn: solve p + shift(p) = home by two fixed-point steps.
          const x = colX[i]
          let px = x - sampleNodes(shift, fw, fh, 2, 0, x * scaleX, y * scaleY)
          let py = y - sampleNodes(shift, fw, fh, 2, 1, x * scaleX, y * scaleY)
          const sx = sampleNodes(shift, fw, fh, 2, 0, px * scaleX, py * scaleY)
          const sy = sampleNodes(shift, fw, fh, 2, 1, px * scaleX, py * scaleY)
          px = x - sx
          py = y - sy
          d = sampleNodes(density, fw, fh, 1, 0, px * scaleX, py * scaleY)
        } else {
          const fx = colFrac[i]
          const n00 = nodeRow + colNode[i]
          d =
            (density[n00] * (1 - fx) + density[n00 + 1] * fx) * (1 - fy) +
            (density[n00 + fw] * (1 - fx) + density[n00 + fw + 1] * fx) * fy
        }
        if (d < FOG.MIN_DENSITY) continue
        const c = clearMask[k]
        const keep = c > 0 ? 1 - c * c * (3 - 2 * c) : 1
        if (keep < 0.5) continue
        if (d > 1) d = 1
        const o = k * 4
        let q = (d - FOG.VEIL_LO) / veilSpan
        q = q < 0 ? 0 : q > 1 ? 1 : q
        cells[o + 1] = ((1 - FOG.VEIL * q * q * (3 - 2 * q) * keep) * 255 + 0.5) | 0
        const n = noise.sample(i * texStepX + flow, j * FOG.TEX_SCALE - flow * 0.7)
        const texture = FOG.TEX_FLOOR + (1 - FOG.TEX_FLOOR) * Math.pow(n, FOG.TEX_SHAPE)
        let t = (texture * d - 0.5) * FOG.CONTRAST + 0.5
        t = t < 0 ? 0 : t > 1 ? 1 : t
        const fogGlyph = Math.floor((1 - Math.pow(t, FOG.GAMMA)) * 4)
        if (fogGlyph <= 2) {
          cells[o + 2] = fogGlyph + 1
          cells[o + 3] = (FOG.ALPHA * keep * 255 + 0.5) | 0
        }
      }
    }
    return true
  }

  private measureClearMask(elements: Iterable<Element>): void {
    const { geometry } = this
    if (!geometry) return
    const mask = buildClearMask(elements, geometry.cols, geometry.rows, geometry.cellW, geometry.cellH)
    this.clearMask = mask
    if (this.renderer.picksGlyphs) {
      // Hand the shader its share of the drift through the unused glyph byte.
      for (let k = 0; k < mask.length; k++) this.cells[k * 4] = ((1 - mask[k]) * 255 + 0.5) | 0
      this.calmChanged = true
    }
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
    if (!this.booted || this.destroyed || !this.geometry) return
    const cellPxW = Math.max(1, Math.round(this.measureAdvance() * this.geometry.dpr))
    if (cellPxW !== this.geometry.cellPxW) this.build()
    else this.redrawAtlas()
    this.scheduleClearMask()
    if (!this.running) this.render(0)
  }

  /** A lost WebGL context came back: repaint a still frame (a running loop repaints anyway). */
  private readonly onRendererRestored = (): void => {
    if (this.booted && !this.destroyed && !this.running) this.render(0)
  }

  /** Text moved or resized: recompute the clear mask on the next frame. */
  private readonly scheduleClearMask = (): void => {
    if (this.clearFrame || this.destroyed) return
    this.clearFrame = requestAnimationFrame(() => {
      this.clearFrame = 0
      if (!this.booted || this.destroyed) return
      this.measureClearMask(document.querySelectorAll(CLEAR_SELECTOR))
    })
  }
}
