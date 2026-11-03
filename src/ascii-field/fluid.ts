import { FOG } from './settings'

/** Boundary handling: 0 copies scalars, 1 reflects x-velocity, 2 reflects y-velocity. */
type Boundary = 0 | 1 | 2

interface Ring {
  /** Center, in grid cells. */
  x: number
  y: number
  /** Seconds since the click. */
  age: number
  life: number
  /** Final radius and half the band width, in grid cells. */
  maxRadius: number
  half: number
}

/** Smoothstep on [0, 1], clamped: the falloff used by brushes and rings. */
const fall = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v))

/**
 * Jos Stam's stable fluids, following the reference fog's solver: grid spacing 1, velocities
 * in grid cells per second, diffuse → project → advect → project for velocity, and density
 * advected (never diffused) with exp(−k·dt) decay. Reflective walls let the fog swirl.
 *
 * Positions passed in are CSS px. `sizeScale` scales brush and ring sizes with the glyph size.
 */
export class FluidField {
  readonly cols: number
  readonly rows: number
  readonly size: number
  /** Grid cells per CSS px. */
  readonly scaleX: number
  readonly scaleY: number

  readonly vx: Float32Array
  readonly vy: Float32Array
  readonly density: Float32Array

  /** False once the fog has dissolved and the wind has died down: nothing to step or draw. */
  awake = false
  /**
   * Grid cells that hold visible fog after the last step, as [minI, maxI, minJ, maxJ],
   * or null when there is none. Lets the renderer touch only that region.
   */
  bounds: [number, number, number, number] | null = null

  private readonly vx0: Float32Array
  private readonly vy0: Float32Array
  private readonly density0: Float32Array
  private readonly pressure: Float32Array
  private readonly divergence: Float32Array
  private readonly rings: Ring[] = []

  constructor(widthPx: number, heightPx: number, cols: number, rows: number) {
    this.cols = Math.max(16, cols)
    this.rows = Math.max(16, rows)
    this.size = this.cols * this.rows
    this.scaleX = this.cols / widthPx
    this.scaleY = this.rows / heightPx
    const field = () => new Float32Array(this.size)
    this.vx = field()
    this.vy = field()
    this.vx0 = field()
    this.vy0 = field()
    this.density = field()
    this.density0 = field()
    this.pressure = field()
    this.divergence = field()
  }

  /** Stop all motion and clear the fog. */
  reset(): void {
    this.vx.fill(0)
    this.vy.fill(0)
    this.density.fill(0)
    this.rings.length = 0
    this.awake = false
    this.bounds = null
  }

  /**
   * One pointer move by (dx, dy) px, ending at (x, y), `elapsed` seconds after the last one:
   * the pointer's velocity becomes force, and fog is deposited where the pointer is now.
   * Faster moves get a larger brush.
   */
  stroke(dx: number, dy: number, x: number, y: number, elapsed: number, wind: number, sizeScale: number): void {
    const dt = elapsed < 0.001 ? 0.001 : elapsed > 0.05 ? 0.05 : elapsed
    const speed = Math.hypot(dx, dy) / dt
    const boost = Math.min(FOG.DRAG_MAX, speed * FOG.DRAG_SCALE)
    const radius = (FOG.HOVER_RADIUS + boost) * sizeScale * Math.min(this.scaleX, this.scaleY)
    const fx = (dx / dt) * this.scaleX * FOG.FORCE_SCALE * wind
    const fy = (dy / dt) * this.scaleY * FOG.FORCE_SCALE * wind
    this.splat(x * this.scaleX, y * this.scaleY, fx, fy, radius)
  }

  /** A click: four rings that start together and ease outward to slightly different reaches. */
  splash(x: number, y: number, sizeScale: number): void {
    this.awake = true
    const cell = Math.min(this.scaleX, this.scaleY)
    const reach = FOG.SPLASH_RANGE * sizeScale * cell
    const half = FOG.SPLASH_THICKNESS * sizeScale * cell * 0.5
    for (let r = 0; r < FOG.SPLASH_RINGS; r++) {
      this.rings.push({
        x: x * this.scaleX,
        y: y * this.scaleY,
        age: 0,
        life: FOG.SPLASH_LIFE * (0.85 + 0.3 * Math.random()),
        maxRadius: reach * (0.6 + 0.55 * Math.random()),
        half,
      })
    }
  }

  /**
   * Advance one frame; `trailLength` scales how long the fog lingers. `visibleDensity` is the
   * least density worth drawing, used to report `bounds`.
   */
  step(dt: number, trailLength: number, visibleDensity: number): void {
    const { vx, vy, vx0, vy0, density, density0 } = this
    this.stepRings(dt)

    vx0.set(vx)
    vy0.set(vy)
    this.diffuse(1, vx, vx0, FOG.DIFFUSION)
    this.diffuse(2, vy, vy0, FOG.DIFFUSION)
    this.project()
    vx0.set(vx)
    vy0.set(vy)
    this.advect(1, vx, vx0, vx0, vy0, dt)
    this.advect(2, vy, vy0, vx0, vy0, dt)
    this.project()

    density0.set(density)
    this.advect(0, density, density0, vx, vy, dt)

    const velocityDecay = Math.exp(-FOG.VEL_DISSIP * dt)
    const densityDecay = Math.exp((-FOG.DEN_DISSIP / Math.max(0.3, trailLength)) * dt)
    let maxDensity = 0
    let maxSpeed2 = 0
    let minI = this.cols
    let maxI = -1
    let minJ = this.rows
    let maxJ = -1
    for (let j = 0, k = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++, k++) {
        const u = (vx[k] *= velocityDecay)
        const v = (vy[k] *= velocityDecay)
        const d = (density[k] *= densityDecay)
        const speed2 = u * u + v * v
        if (speed2 > maxSpeed2) maxSpeed2 = speed2
        if (d > maxDensity) maxDensity = d
        if (d >= visibleDensity) {
          if (i < minI) minI = i
          if (i > maxI) maxI = i
          if (j < minJ) minJ = j
          if (j > maxJ) maxJ = j
        }
      }
    }
    this.bounds = maxI >= 0 ? [minI, maxI, minJ, maxJ] : null
    // Sleep once the fog is gone and what's left of the wind (under 0.5 cells/s) couldn't
    // visibly move new fog; clear the remainder so the next stroke starts from still air.
    this.awake = this.rings.length > 0 || maxDensity >= 0.005 || maxSpeed2 >= 0.25
    if (!this.awake) {
      vx.fill(0)
      vy.fill(0)
      density.fill(0)
    }
  }

  // ---- forces ---------------------------------------------------------------------------

  /** Add force and fog in a disk (grid units) with a smoothstep falloff. */
  private splat(cx: number, cy: number, fx: number, fy: number, radius: number): void {
    const { cols, rows, vx, vy } = this
    this.awake = true
    const r2 = radius * radius
    const i0 = Math.max(0, Math.floor(cx - radius))
    const i1 = Math.min(cols - 1, Math.ceil(cx + radius))
    const j0 = Math.max(0, Math.floor(cy - radius))
    const j1 = Math.min(rows - 1, Math.ceil(cy + radius))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const dx = i - cx
        const dy = j - cy
        const d2 = dx * dx + dy * dy
        if (d2 > r2) continue
        const m = fall(1 - Math.sqrt(d2) / radius)
        const k = j * cols + i
        vx[k] += fx * m
        vy[k] += fy * m
        this.raise(k, FOG.STRENGTH * m, FOG.MOVE_CAP)
      }
    }
  }

  /** Raise density toward a cap; never lowers it, so a stroke can't erase a denser splash. */
  private raise(k: number, amount: number, cap: number): void {
    let next = this.density[k] + amount
    if (next > cap) next = cap
    if (next > this.density[k]) this.density[k] = next
  }

  private stepRings(dt: number): void {
    const { cols, rows, vx, vy, rings } = this
    for (let s = rings.length - 1; s >= 0; s--) {
      const ring = rings[s]
      const c = ring.age / ring.life
      if (c >= 1) {
        rings.splice(s, 1)
        continue
      }
      ring.age += dt
      const left = 1 - c
      const radius = (1 - Math.pow(left, FOG.SPLASH_TRAVEL_EASE)) * ring.maxRadius
      const deposit = FOG.SPLASH_DEPOSIT * Math.pow(left, FOG.SPLASH_DEN_DECAY)
      const push = FOG.SPLASH_FORCE_MAG * Math.pow(left, FOG.SPLASH_FORCE_DECAY)
      const reach = radius + ring.half
      const i0 = Math.max(0, Math.floor(ring.x - reach))
      const i1 = Math.min(cols - 1, Math.ceil(ring.x + reach))
      const j0 = Math.max(0, Math.floor(ring.y - reach))
      const j1 = Math.min(rows - 1, Math.ceil(ring.y + reach))
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const dx = i - ring.x
          const dy = j - ring.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const off = Math.abs(dist - radius)
          if (off > ring.half) continue
          const m = fall(1 - off / ring.half)
          const k = j * cols + i
          if (dist > 0.001) {
            vx[k] += (dx / dist) * push * m
            vy[k] += (dy / dist) * push * m
          }
          this.raise(k, deposit * m, FOG.SPLASH_CAP)
        }
      }
    }
  }

  // ---- solver ----------------------------------------------------------------------------

  private setBoundary(b: Boundary, x: Float32Array): void {
    const { cols: w, rows: h, size } = this
    for (let j = 1; j < h - 1; j++) {
      x[j * w] = b === 1 ? -x[j * w + 1] : x[j * w + 1]
      x[j * w + w - 1] = b === 1 ? -x[j * w + w - 2] : x[j * w + w - 2]
    }
    for (let i = 1; i < w - 1; i++) {
      x[i] = b === 2 ? -x[w + i] : x[w + i]
      x[(h - 1) * w + i] = b === 2 ? -x[(h - 2) * w + i] : x[(h - 2) * w + i]
    }
    x[0] = 0.5 * (x[1] + x[w])
    x[w - 1] = 0.5 * (x[w - 2] + x[2 * w - 1])
    x[(h - 1) * w] = 0.5 * (x[(h - 2) * w] + x[(h - 1) * w + 1])
    x[size - 1] = 0.5 * (x[size - 2] + x[size - 1 - w])
  }

  /** Implicit diffusion by Gauss–Seidel relaxation; `a` is applied per step. */
  private diffuse(b: Boundary, x: Float32Array, x0: Float32Array, a: number): void {
    const { cols: w, rows: h } = this
    const c = 1 / (1 + 4 * a)
    for (let it = 0; it < FOG.ITERATIONS; it++) {
      for (let j = 1; j < h - 1; j++) {
        let k = j * w + 1
        for (let i = 1; i < w - 1; i++, k++) {
          x[k] = (x0[k] + a * (x[k - 1] + x[k + 1] + x[k - w] + x[k + w])) * c
        }
      }
      this.setBoundary(b, x)
    }
  }

  /** Make the velocity field divergence-free (mass conserving). */
  private project(): void {
    const { cols: w, rows: h, vx: u, vy: v, pressure: p, divergence: div } = this
    for (let j = 1; j < h - 1; j++) {
      let k = j * w + 1
      for (let i = 1; i < w - 1; i++, k++) {
        div[k] = -0.5 * (u[k + 1] - u[k - 1] + v[k + w] - v[k - w])
        p[k] = 0
      }
    }
    this.setBoundary(0, div)
    this.setBoundary(0, p)
    for (let it = 0; it < FOG.PROJECT_ITERS; it++) {
      for (let j = 1; j < h - 1; j++) {
        let k = j * w + 1
        for (let i = 1; i < w - 1; i++, k++) {
          p[k] = (div[k] + p[k - 1] + p[k + 1] + p[k - w] + p[k + w]) * 0.25
        }
      }
      this.setBoundary(0, p)
    }
    for (let j = 1; j < h - 1; j++) {
      let k = j * w + 1
      for (let i = 1; i < w - 1; i++, k++) {
        u[k] -= 0.5 * (p[k + 1] - p[k - 1])
        v[k] -= 0.5 * (p[k + w] - p[k - w])
      }
    }
    this.setBoundary(1, u)
    this.setBoundary(2, v)
  }

  /** Semi-Lagrangian advection with bilinear sampling. */
  private advect(b: Boundary, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number): void {
    const { cols: w, rows: h } = this
    const xMax = w - 1.5
    const yMax = h - 1.5
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const k = j * w + i
        let x = i - dt * u[k]
        let y = j - dt * v[k]
        if (x < 0.5) x = 0.5
        else if (x > xMax) x = xMax
        if (y < 0.5) y = 0.5
        else if (y > yMax) y = yMax
        const i0 = x | 0
        const j0 = y | 0
        const fx = x - i0
        const fy = y - j0
        const r0 = j0 * w + i0
        const r1 = r0 + w
        d[k] =
          (d0[r0] * (1 - fx) + d0[r0 + 1] * fx) * (1 - fy) +
          (d0[r1] * (1 - fx) + d0[r1 + 1] * fx) * fy
      }
    }
    this.setBoundary(b, d)
  }
}
