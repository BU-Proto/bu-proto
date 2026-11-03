import { FIELD, FOG } from './settings'

/** Boundary handling: 0 copies scalars, 1 reflects x-velocity, 2 reflects y-velocity. */
type Boundary = 0 | 1 | 2

interface Splash {
  x: number
  y: number
  /** Seconds since the ring started; negative while it waits for its stagger. */
  age: number
  life: number
}

/**
 * Jos Stam's stable fluids on a coarse grid spanning the viewport:
 * diffuse → project → advect → project for velocity; density is advected (not diffused)
 * and decays as exp(−k·dt). Reflective walls let the fog swirl instead of blowing off-screen.
 *
 * Positions passed in are CSS px; velocities are stored in grid cells per second.
 * The same velocity also advects `uvx`/`uvy`, the coordinates the background samples the
 * gradient at, so the colors smear with the wind and then relax back home.
 */
export class FluidField {
  readonly cols: number
  readonly rows: number
  readonly size: number
  /** CSS px between grid nodes. */
  readonly pitchX: number
  readonly pitchY: number

  readonly vx: Float32Array
  readonly vy: Float32Array
  readonly density: Float32Array
  readonly uvx: Float32Array
  readonly uvy: Float32Array

  private readonly width: number
  private readonly height: number
  private readonly vx0: Float32Array
  private readonly vy0: Float32Array
  private readonly density0: Float32Array
  private readonly pressure: Float32Array
  private readonly divergence: Float32Array
  private readonly uvx0: Float32Array
  private readonly uvy0: Float32Array
  private readonly splashes: Splash[] = []
  private breezeAt = 0

  constructor(widthPx: number, heightPx: number, cols: number, rows: number) {
    this.width = widthPx
    this.height = heightPx
    this.cols = Math.max(16, cols)
    this.rows = Math.max(16, rows)
    this.size = this.cols * this.rows
    this.pitchX = widthPx / (this.cols - 1)
    this.pitchY = heightPx / (this.rows - 1)
    const field = () => new Float32Array(this.size)
    this.vx = field()
    this.vy = field()
    this.vx0 = field()
    this.vy0 = field()
    this.density = field()
    this.density0 = field()
    this.pressure = field()
    this.divergence = field()
    this.uvx = field()
    this.uvy = field()
    this.uvx0 = field()
    this.uvy0 = field()
    this.resetGradient()
  }

  /** Stop all motion, clear the fog and put the gradient back where it rests. */
  reset(): void {
    this.vx.fill(0)
    this.vy.fill(0)
    this.density.fill(0)
    this.splashes.length = 0
    this.resetGradient()
  }

  /**
   * A pointer moved from (x0, y0) to (x1, y1) in `elapsed` seconds: inject its velocity as
   * force and deposit fog along the segment, with a brush that grows with speed.
   */
  stroke(x0: number, y0: number, x1: number, y1: number, elapsed: number, wind: number): void {
    const dt = elapsed < 0.001 ? 0.001 : elapsed > 0.05 ? 0.05 : elapsed
    const dx = x1 - x0
    const dy = y1 - y0
    const dist = Math.hypot(dx, dy)
    if (dist < 0.5) return

    const speed = dist / dt
    const radius = FOG.HOVER_RADIUS + Math.min(FOG.DRAG_MAX, speed * FOG.DRAG_SCALE)
    let fx = ((dx / dt) * FOG.FORCE_SCALE * wind) / this.pitchX
    let fy = ((dy / dt) * FOG.FORCE_SCALE * wind) / this.pitchY
    const magnitude = Math.hypot(fx, fy)
    if (magnitude > FOG.FORCE_MAX) {
      fx *= FOG.FORCE_MAX / magnitude
      fy *= FOG.FORCE_MAX / magnitude
    }
    // Interpolate along the segment so fast flicks leave a continuous band.
    const spacing = Math.max(3, radius * 0.5)
    const steps = Math.max(1, Math.ceil(dist / spacing))
    const share = 1 / Math.max(1, radius / spacing)
    for (let s = 1; s <= steps; s++) {
      const q = s / steps
      this.splatDisk(x0 + dx * q, y0 + dy * q, radius, fx * share, fy * share)
    }
  }

  /** A click: start the staggered shockwave rings. */
  splash(x: number, y: number): void {
    for (let r = 0; r < FOG.SPLASH_RINGS; r++) {
      this.splashes.push({
        x,
        y,
        age: -r * FOG.SPLASH_STAGGER,
        life: FOG.SPLASH_LIFE * (0.85 + 0.3 * Math.random()),
      })
    }
  }

  /** Advance the simulation by dt seconds; `trailLength` scales how long the fog lingers. */
  step(dt: number, time: number, trailLength: number): void {
    const { vx, vy, vx0, vy0, density, density0 } = this
    this.stepSplashes(dt)
    this.breeze(time)

    const a = dt * FOG.DIFFUSION * FOG.VISCOSITY_SCALE
    vx0.set(vx)
    vy0.set(vy)
    this.diffuse(1, vx, vx0, a)
    this.diffuse(2, vy, vy0, a)
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
    for (let k = 0; k < this.size; k++) {
      vx[k] *= velocityDecay
      vy[k] *= velocityDecay
      density[k] *= densityDecay
    }

    this.flowGradient(dt, time)
  }

  // ---- forces ---------------------------------------------------------------------------

  private splatDisk(px: number, py: number, radius: number, fx: number, fy: number): void {
    const { cols, rows, vx, vy, density } = this
    const cx = px / this.pitchX
    const cy = py / this.pitchY
    const rx = radius / this.pitchX
    const ry = radius / this.pitchY
    const i0 = Math.max(0, Math.floor(cx - rx))
    const i1 = Math.min(cols - 1, Math.ceil(cx + rx))
    const j0 = Math.max(0, Math.floor(cy - ry))
    const j1 = Math.min(rows - 1, Math.ceil(cy + ry))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const ddx = (i - cx) / rx
        const ddy = (j - cy) / ry
        const d2 = ddx * ddx + ddy * ddy
        if (d2 >= 1) continue
        const f = 1 - d2
        const k = j * cols + i
        vx[k] += fx * f
        vy[k] += fy * f
        if (density[k] < FOG.MOVE_CAP) {
          density[k] = Math.min(FOG.MOVE_CAP, density[k] + FOG.STRENGTH * f)
        }
      }
    }
  }

  private stepSplashes(dt: number): void {
    const { cols, rows, vx, vy, density, splashes } = this
    const ease = FOG.SPLASH_TRAVEL_EASE
    const norm = 1 - Math.exp(-ease)
    const half = FOG.SPLASH_THICKNESS / 2
    const frames = dt * 60

    for (let s = splashes.length - 1; s >= 0; s--) {
      const splash = splashes[s]
      splash.age += dt
      if (splash.age < 0) continue
      const p = splash.age / splash.life
      if (p >= 1) {
        splashes.splice(s, 1)
        continue
      }
      const radius = (FOG.SPLASH_RANGE * (1 - Math.exp(-ease * p))) / norm
      const reach = radius + half
      const fade = Math.exp(-FOG.SPLASH_DEN_DECAY * p)
      const push = FOG.SPLASH_FORCE_MAG * Math.exp(-FOG.SPLASH_FORCE_DECAY * p) * frames * 0.5
      const cx = splash.x / this.pitchX
      const cy = splash.y / this.pitchY
      const i0 = Math.max(0, Math.floor(cx - reach / this.pitchX))
      const i1 = Math.min(cols - 1, Math.ceil(cx + reach / this.pitchX))
      const j0 = Math.max(0, Math.floor(cy - reach / this.pitchY))
      const j1 = Math.min(rows - 1, Math.ceil(cy + reach / this.pitchY))
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const dpx = (i - cx) * this.pitchX
          const dpy = (j - cy) * this.pitchY
          const d = Math.hypot(dpx, dpy)
          let w = 1 - Math.abs(d - radius) / half
          if (w <= 0) continue
          w = w * w * (3 - 2 * w)
          const k = j * cols + i
          if (density[k] < FOG.SPLASH_CAP) {
            density[k] = Math.min(FOG.SPLASH_CAP, density[k] + FOG.SPLASH_DEPOSIT * w * fade * frames)
          }
          if (d > 1e-3) {
            vx[k] += (dpx / d) * push * w
            vy[k] += (dpy / d) * push * w
          }
        }
      }
    }
  }

  /** An occasional gentle gust keeps the gradient breathing when nobody is moving. */
  private breeze(time: number): void {
    if (time < this.breezeAt) return
    this.breezeAt = time + 1.8 + Math.random() * 2.4
    const angle = Math.random() * Math.PI * 2
    const radius = 120
    const cx = (Math.random() * this.width) / this.pitchX
    const cy = (Math.random() * this.height) / this.pitchY
    const rx = radius / this.pitchX
    const ry = radius / this.pitchY
    const gx = Math.cos(angle) * 5
    const gy = Math.sin(angle) * 5
    for (let j = Math.max(0, Math.floor(cy - ry)); j <= Math.min(this.rows - 1, Math.ceil(cy + ry)); j++) {
      for (let i = Math.max(0, Math.floor(cx - rx)); i <= Math.min(this.cols - 1, Math.ceil(cx + rx)); i++) {
        const ddx = (i - cx) / rx
        const ddy = (j - cy) / ry
        const d2 = ddx * ddx + ddy * ddy
        if (d2 >= 1) continue
        const k = j * this.cols + i
        this.vx[k] += gx * (1 - d2)
        this.vy[k] += gy * (1 - d2)
      }
    }
  }

  // ---- gradient coordinates ---------------------------------------------------------------

  private resetGradient(): void {
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const k = j * this.cols + i
        this.uvx[k] = i / (this.cols - 1)
        this.uvy[k] = j / (this.rows - 1)
      }
    }
  }

  /** Carry the gradient's sampling coordinates with the wind, then ease them back home. */
  private flowGradient(dt: number, time: number): void {
    const { cols, rows, uvx, uvy, uvx0, uvy0 } = this
    uvx0.set(uvx)
    uvy0.set(uvy)
    this.advect(null, uvx, uvx0, this.vx, this.vy, dt)
    this.advect(null, uvy, uvy0, this.vx, this.vy, dt)
    const relax = 1 - Math.exp(-dt * FIELD.GRADIENT_RELAX)
    for (let j = 0; j < rows; j++) {
      const wobbleX = 0.01 * Math.sin(j * 0.1265 + time * 0.33)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        const homeX = i / (cols - 1) + wobbleX
        const homeY = j / (rows - 1) + 0.008 * Math.sin(i * 0.1045 - time * 0.27)
        uvx[k] += (homeX - uvx[k]) * relax
        uvy[k] += (homeY - uvy[k]) * relax
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

  /** Implicit diffusion by Gauss–Seidel relaxation. */
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

  /** Semi-Lagrangian advection with bilinear sampling. `b === null` skips boundary handling. */
  private advect(
    b: Boundary | null,
    d: Float32Array,
    d0: Float32Array,
    u: Float32Array,
    v: Float32Array,
    dt: number,
  ): void {
    const { cols: w, rows: h } = this
    const xMax = w - 1.001
    const yMax = h - 1.001
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const k = j * w + i
        let x = i - dt * u[k]
        let y = j - dt * v[k]
        if (x < 0) x = 0
        else if (x > xMax) x = xMax
        if (y < 0) y = 0
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
    if (b !== null) this.setBoundary(b, d)
  }
}
