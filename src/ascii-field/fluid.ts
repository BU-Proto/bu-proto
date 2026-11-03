import { FIELD, FOG } from './settings'

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

/** An ambient swell that slides the characters in one patch a few px and lets them go. */
interface Gust {
  /** Center and radius, in grid cells. */
  x: number
  y: number
  radius: number
  /** Total slide over the gust, in normalized viewport units. */
  du: number
  dv: number
  age: number
  life: number
}

/** Smoothstep on [0, 1], clamped: the falloff used by brushes and rings. */
const fall = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v))

/** Below these the wind and the fog count as gone, and the solver sleeps. */
const REST_SPEED = 0.02
const REST_DENSITY = 0.005
/** Characters within this (normalized units, well under 0.1 px) of home are home. */
const REST_OFFSET = 2e-5

/**
 * Jos Stam's stable fluids, following the reference fog's solver: grid spacing 1, velocities
 * in grid cells per second, diffuse → project → advect → project for velocity, and density
 * advected (never diffused) with exp(−k·dt) decay. Reflective walls let the fog swirl.
 *
 * The same wind also carries the background's characters: `charU`/`charV` say where the
 * character over each node lives at rest (normalized viewport coordinates). They drift with a
 * fraction of the wind and ease back home, so the ASCII art flows around the cursor and
 * settles while the gradient's colors stay where they are. Now and then a gentle gust slides
 * a patch of characters on its own, so the field keeps breathing.
 *
 * When nothing moves, the solver sleeps until the next stroke, click or gust.
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
  readonly charU: Float32Array
  readonly charV: Float32Array
  /** Highest fog density after the last step; below FOG.MIN_DENSITY there is nothing to draw. */
  maxDensity = 0
  /** True while every character sits exactly at home. */
  charactersHome = true
  /** Nodes holding visible fog (inclusive); empty when i1 < i0. */
  readonly fogBox = { i0: 0, j0: 0, i1: -1, j1: -1 }

  private readonly widthPx: number
  private readonly heightPx: number
  private readonly vx0: Float32Array
  private readonly vy0: Float32Array
  private readonly density0: Float32Array
  private readonly pressure: Float32Array
  private readonly divergence: Float32Array
  private readonly charU0: Float32Array
  private readonly charV0: Float32Array
  private readonly rings: Ring[] = []
  private readonly gusts: Gust[] = []
  /** Seconds simulated so far, when the pointer last stirred the fluid, and the next gust. */
  private clock = 0
  private stirredAt = -Infinity
  private gustAt = 0
  /** No wind and no fog: the solver can skip its passes. */
  private still = true

  constructor(widthPx: number, heightPx: number, cols: number, rows: number) {
    this.widthPx = widthPx
    this.heightPx = heightPx
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
    this.charU = field()
    this.charV = field()
    this.charU0 = field()
    this.charV0 = field()
    this.homeCharacters()
    this.gustAt = FIELD.GUST_EVERY * (0.3 + 0.4 * Math.random())
  }

  /** Stop all motion, clear the fog and put every character back in place. */
  reset(): void {
    this.vx.fill(0)
    this.vy.fill(0)
    this.density.fill(0)
    this.rings.length = 0
    this.gusts.length = 0
    this.maxDensity = 0
    this.fogBox.i1 = -1
    this.still = true
    this.homeCharacters()
  }

  /**
   * One pointer move by (dx, dy) px, ending at (x, y), `elapsed` seconds after the last one:
   * the pointer's velocity becomes force, and fog is laid along the way. Faster moves get a
   * larger brush.
   *
   * The reference adds one brush per pointer event, so when events arrive slowly (a busy page,
   * a fast flick) its trail breaks into beads. Here the fog is laid every half brush along the
   * segment, so the trail stays unbroken, and the wind is added as often as the reference
   * would at 60 events a second.
   */
  stroke(dx: number, dy: number, x: number, y: number, elapsed: number, wind: number, sizeScale: number): void {
    const dt = elapsed < 0.001 ? 0.001 : elapsed > 0.05 ? 0.05 : elapsed
    const speed = Math.hypot(dx, dy) / dt
    const boost = Math.min(FOG.DRAG_MAX, speed * FOG.DRAG_SCALE)
    const radius = (FOG.HOVER_RADIUS + boost) * sizeScale * Math.min(this.scaleX, this.scaleY)
    const fx = (dx / dt) * this.scaleX * FOG.FORCE_SCALE * wind
    const fy = (dy / dt) * this.scaleY * FOG.FORCE_SCALE * wind
    const x1 = x * this.scaleX
    const y1 = y * this.scaleY
    const x0 = x1 - dx * this.scaleX
    const y0 = y1 - dy * this.scaleY
    // After a pause the pointer may have jumped (a test, a dialog, a refocus): fog only where it is.
    const fogSteps =
      elapsed > 0.1 ? 1 : Math.min(24, Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (radius * 0.5))))
    for (let s = 1; s <= fogSteps; s++) {
      const t = s / fogSteps
      this.splat(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0, 0, radius)
    }
    const pushes = Math.min(3, Math.max(1, Math.round(dt * 60)))
    for (let s = 1; s <= pushes; s++) {
      const t = s / pushes
      this.splat(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, fx, fy, radius, false)
    }
    this.stirredAt = this.clock
    this.still = false
  }

  /** A click: four rings that start together and ease outward to slightly different reaches. */
  splash(x: number, y: number, sizeScale: number): void {
    const cell = Math.min(this.scaleX, this.scaleY)
    const reach = FOG.SPLASH_RANGE * sizeScale * cell
    const half = FOG.SPLASH_THICKNESS * sizeScale * cell * 0.5
    this.stirredAt = this.clock
    this.still = false
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
   * Advance one frame. `trailLength` scales how long the fog lingers; `push` is the fraction of
   * the wind that carries the characters (0 leaves them in place).
   */
  step(dt: number, trailLength: number, push: number): void {
    this.clock += dt
    this.stepGusts(dt)
    if (!this.still) this.stepFluid(dt, trailLength)
    if (!this.charactersHome || this.gusts.length > 0 || (!this.still && push > 0)) {
      this.flowCharacters(dt, this.still ? 0 : push)
    }
  }

  private stepFluid(dt: number, trailLength: number): void {
    const { vx, vy, vx0, vy0, density, density0 } = this
    this.stepRings(dt)

    vx0.set(vx)
    vy0.set(vy)
    this.diffuseVelocity(FOG.DIFFUSION)
    this.project()
    vx0.set(vx)
    vy0.set(vy)
    this.advectVelocity(dt)
    this.project()

    density0.set(density)
    this.advectDensity(dt)

    // A moment after the pointer stops, the leftover wind mostly just moves the characters:
    // let it calm down faster so they settle soon after the trail fades.
    const calm = this.clock - this.stirredAt > FIELD.CALM_AFTER && this.rings.length === 0
    const velocityDecay = Math.exp(-(FOG.VEL_DISSIP + (calm ? FIELD.CALM_DAMPING : 0)) * dt)
    const densityDecay = Math.exp((-FOG.DEN_DISSIP / Math.max(0.3, trailLength)) * dt)
    const { cols: w, rows: h, fogBox: box } = this
    let maxDensity = 0
    let maxSpeed = 0
    box.i0 = w
    box.i1 = -1
    box.j0 = h
    box.j1 = -1
    for (let j = 0, k = 0; j < h; j++) {
      let first = -1
      let last = -1
      for (let i = 0; i < w; i++, k++) {
        const u = (vx[k] *= velocityDecay)
        const v = (vy[k] *= velocityDecay)
        const d = (density[k] *= densityDecay)
        if (d > maxDensity) maxDensity = d
        const speed = (u < 0 ? -u : u) + (v < 0 ? -v : v)
        if (speed > maxSpeed) maxSpeed = speed
        if (d >= FOG.MIN_DENSITY) {
          if (first < 0) first = i
          last = i
        }
      }
      if (first >= 0) {
        if (first < box.i0) box.i0 = first
        if (last > box.i1) box.i1 = last
        if (j < box.j0) box.j0 = j
        box.j1 = j
      }
    }
    this.maxDensity = maxDensity
    if (calm && maxSpeed < REST_SPEED && maxDensity < REST_DENSITY) {
      vx.fill(0)
      vy.fill(0)
      density.fill(0)
      this.maxDensity = 0
      box.i1 = -1
      this.still = true
    }
  }

  // ---- the characters ---------------------------------------------------------------------

  private homeCharacters(): void {
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const k = j * this.cols + i
        this.charU[k] = i / (this.cols - 1)
        this.charV[k] = j / (this.rows - 1)
      }
    }
    this.charactersHome = true
  }

  /**
   * Carry the characters with `push` of the wind (semi-Lagrangian, edges left free so nothing
   * drifts at rest), then ease them back to where they belong.
   */
  private flowCharacters(dt: number, push: number): void {
    const { cols: w, rows: h, vx, vy, charU, charV, charU0, charV0 } = this
    const relax = 1 - Math.exp(-dt * FIELD.PUSH_RELAX)
    const toU = 1 / (w - 1)
    const toV = 1 / (h - 1)
    let offset = 0
    if (push > 0) {
      charU0.set(charU)
      charV0.set(charV)
      const step = dt * push
      const xMax = w - 1.001
      const yMax = h - 1.001
      for (let j = 0; j < h; j++) {
        const homeV = j * toV
        let k = j * w
        for (let i = 0; i < w; i++, k++) {
          let x = i - step * vx[k]
          let y = j - step * vy[k]
          x = x < 0 ? 0 : x > xMax ? xMax : x
          y = y < 0 ? 0 : y > yMax ? yMax : y
          const i0 = x | 0
          const j0 = y | 0
          const fx = x - i0
          const fy = y - j0
          const r0 = j0 * w + i0
          const r1 = r0 + w
          const u = (charU0[r0] * (1 - fx) + charU0[r0 + 1] * fx) * (1 - fy) + (charU0[r1] * (1 - fx) + charU0[r1 + 1] * fx) * fy
          const v = (charV0[r0] * (1 - fx) + charV0[r0 + 1] * fx) * (1 - fy) + (charV0[r1] * (1 - fx) + charV0[r1 + 1] * fx) * fy
          const du = (i * toU - u) * (1 - relax)
          const dv = (homeV - v) * (1 - relax)
          charU[k] = i * toU - du
          charV[k] = homeV - dv
          const m = (du < 0 ? -du : du) + (dv < 0 ? -dv : dv)
          if (m > offset) offset = m
        }
      }
    } else {
      for (let j = 0; j < h; j++) {
        const homeV = j * toV
        let k = j * w
        for (let i = 0; i < w; i++, k++) {
          const du = (i * toU - charU[k]) * (1 - relax)
          const dv = (homeV - charV[k]) * (1 - relax)
          charU[k] = i * toU - du
          charV[k] = homeV - dv
          const m = (du < 0 ? -du : du) + (dv < 0 ? -dv : dv)
          if (m > offset) offset = m
        }
      }
    }
    if (offset < REST_OFFSET && this.still && this.gusts.length === 0) this.homeCharacters()
    else this.charactersHome = false
  }

  /** Every few seconds a gentle swell slides a patch of characters a few px, then lets go. */
  private stepGusts(dt: number): void {
    const { gusts, charU, charV, cols, rows } = this
    if (FIELD.GUST_SLIDE > 0 && this.clock >= this.gustAt) {
      this.gustAt = this.clock + FIELD.GUST_EVERY * (0.6 + 0.8 * Math.random())
      const angle = Math.random() * Math.PI * 2
      const slide = FIELD.GUST_SLIDE * (0.7 + 0.6 * Math.random())
      gusts.push({
        x: Math.random() * (cols - 1),
        y: Math.random() * (rows - 1),
        radius: FIELD.GUST_RADIUS * (0.75 + 0.5 * Math.random()) * Math.min(this.scaleX, this.scaleY),
        du: (Math.cos(angle) * slide) / this.widthPx,
        dv: (Math.sin(angle) * slide) / this.heightPx,
        age: 0,
        life: FIELD.GUST_LIFE * (0.8 + 0.4 * Math.random()),
      })
    }
    for (let s = gusts.length - 1; s >= 0; s--) {
      const gust = gusts[s]
      gust.age += dt
      if (gust.age >= gust.life) {
        gusts.splice(s, 1)
        continue
      }
      // sin² swell: the rate integrates to exactly the gust's slide over its life.
      const swell = Math.sin((Math.PI * gust.age) / gust.life)
      const rate = ((2 * swell * swell) / gust.life) * dt
      const { x: cx, y: cy, radius } = gust
      const r2 = radius * radius
      for (let j = Math.max(0, Math.floor(cy - radius)); j <= Math.min(rows - 1, Math.ceil(cy + radius)); j++) {
        for (let i = Math.max(0, Math.floor(cx - radius)); i <= Math.min(cols - 1, Math.ceil(cx + radius)); i++) {
          const d2 = (i - cx) * (i - cx) + (j - cy) * (j - cy)
          if (d2 > r2) continue
          const m = fall(1 - Math.sqrt(d2) / radius) * rate
          const k = j * cols + i
          charU[k] += gust.du * m
          charV[k] += gust.dv * m
        }
      }
      this.charactersHome = false
    }
  }

  // ---- forces ---------------------------------------------------------------------------

  /** Add force (and, unless `fog` is false, fog) in a disk (grid units) with a smoothstep falloff. */
  private splat(cx: number, cy: number, fx: number, fy: number, radius: number, fog = true): void {
    const { cols, rows, vx, vy } = this
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
        if (fog) this.raise(k, FOG.STRENGTH * m, FOG.MOVE_CAP)
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

  /**
   * Implicit diffusion of both velocity components; `a` is applied per step. Like the pressure
   * solve below, this relaxes with red–black Gauss–Seidel: it converges like the reference's
   * row-by-row sweep, but each half-sweep has no chain of dependencies, so it runs several
   * times faster.
   */
  private diffuseVelocity(a: number): void {
    const { cols: w, rows: h, vx, vy, vx0, vy0 } = this
    const c = 1 / (1 + 4 * a)
    for (let it = 0; it < FOG.ITERATIONS; it++) {
      for (let color = 0; color < 2; color++) {
        for (let j = 1; j < h - 1; j++) {
          const start = ((j + 1) & 1) === color ? 1 : 2
          let k = j * w + start
          for (let i = start; i < w - 1; i += 2, k += 2) {
            vx[k] = (vx0[k] + a * (vx[k - 1] + vx[k + 1] + vx[k - w] + vx[k + w])) * c
            vy[k] = (vy0[k] + a * (vy[k - 1] + vy[k + 1] + vy[k - w] + vy[k + w])) * c
          }
        }
      }
      this.setBoundary(1, vx)
      this.setBoundary(2, vy)
    }
  }

  /** Make the velocity field divergence-free (mass conserving), by red–black Gauss–Seidel. */
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
      for (let color = 0; color < 2; color++) {
        for (let j = 1; j < h - 1; j++) {
          const start = ((j + 1) & 1) === color ? 1 : 2
          let k = j * w + start
          for (let i = start; i < w - 1; i += 2, k += 2) {
            p[k] = (div[k] + p[k - 1] + p[k + 1] + p[k - w] + p[k + w]) * 0.25
          }
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

  /**
   * Semi-Lagrangian self-advection of the velocity (from vx0/vy0), bilinear, clamped to
   * [0.5, size − 1.5] like the reference. Both components share one backtrace.
   */
  private advectVelocity(dt: number): void {
    const { cols: w, rows: h, vx, vy, vx0, vy0 } = this
    const xMax = w - 1.5
    const yMax = h - 1.5
    for (let j = 0; j < h; j++) {
      let k = j * w
      for (let i = 0; i < w; i++, k++) {
        let x = i - dt * vx0[k]
        let y = j - dt * vy0[k]
        x = x < 0.5 ? 0.5 : x > xMax ? xMax : x
        y = y < 0.5 ? 0.5 : y > yMax ? yMax : y
        const i0 = x | 0
        const j0 = y | 0
        const fx = x - i0
        const fy = y - j0
        const r0 = j0 * w + i0
        const r1 = r0 + w
        vx[k] = (vx0[r0] * (1 - fx) + vx0[r0 + 1] * fx) * (1 - fy) + (vx0[r1] * (1 - fx) + vx0[r1 + 1] * fx) * fy
        vy[k] = (vy0[r0] * (1 - fx) + vy0[r0 + 1] * fx) * (1 - fy) + (vy0[r1] * (1 - fx) + vy0[r1 + 1] * fx) * fy
      }
    }
    this.setBoundary(1, vx)
    this.setBoundary(2, vy)
  }

  /** Carry the fog (from density0) along the projected wind. */
  private advectDensity(dt: number): void {
    const { cols: w, rows: h, vx, vy, density: d, density0: d0 } = this
    const xMax = w - 1.5
    const yMax = h - 1.5
    for (let j = 0; j < h; j++) {
      let k = j * w
      for (let i = 0; i < w; i++, k++) {
        let x = i - dt * vx[k]
        let y = j - dt * vy[k]
        x = x < 0.5 ? 0.5 : x > xMax ? xMax : x
        y = y < 0.5 ? 0.5 : y > yMax ? yMax : y
        const i0 = x | 0
        const j0 = y | 0
        const fx = x - i0
        const fy = y - j0
        const r0 = j0 * w + i0
        const r1 = r0 + w
        d[k] = (d0[r0] * (1 - fx) + d0[r0 + 1] * fx) * (1 - fy) + (d0[r1] * (1 - fx) + d0[r1 + 1] * fx) * fy
      }
    }
    this.setBoundary(0, d)
  }
}
