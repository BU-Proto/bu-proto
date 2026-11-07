import { GRADIENT_COLORMAP, type Colormap } from './colormap'
import { PALETTE_V2 } from './palettePreview'

/**
 * The shapes the field's light can take. `bloom` is the hero gradient sampled from the reference
 * design; the others are painted here from the same pigments (picked out of that gradient), so
 * every shape is in the site's one palette and only the silhouette changes.
 */
export const SHAPES = ['summit', 'tides', 'bloom', 'eclipse', 'ripple', 'aurora', 'rays', 'strata', 'dawn', 'beacon'] as const
export type ShapeName = (typeof SHAPES)[number]

export const SHAPE_LABELS: Record<ShapeName, string> = {
  summit: 'Summit',
  tides: 'Tides',
  bloom: 'Bloom',
  eclipse: 'Eclipse',
  ripple: 'Ripple',
  aurora: 'Aurora',
  rays: 'Rays',
  strata: 'Strata',
  dawn: 'Dawn',
  beacon: 'Beacon',
}

/** A grid of RGB colors (0–255), row-major, top to bottom. Sampled bilinearly over the viewport. */
export interface GradientMap {
  readonly width: number
  readonly height: number
  readonly data: Float32Array
}

type RGB = readonly [number, number, number]

const hex = (h: string): RGB => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]

/** Pigments taken from the hero gradient (its darkest blue, its ground, its warm core...). */
const P = {
  deep: hex('046aa8'),
  sky: hex('039ac8'),
  lagoon: hex('00a4d0'),
  iris: hex(PALETTE_V2 ? '857fd7' : '8488b5'),
  haze: hex('cec1be'),
  peach: hex('f8928a'),
  rose: hex('da346f'),
  /** The site's frost and navy: the highlights on the tides' currents, and the deeper ground
      between them. */
  frost: hex('f6fbff'),
  navy: hex('0b2a46'),
} as const

/** The violet at the middle of the tides' lower current, the old hero's purple. */
const VIOLET: RGB = [122, 92, 236]

/** How fast the summit's peaks rise and lean (radians a second): one breath takes about 20 seconds. */
const SUMMIT_SPEED = 0.32

/** The summit's peaks, back to front: where (0 to 1 across), how tall and wide, and their colours
    from the ridge down, each blending into the field's blue. */
const SUMMIT_PEAKS: readonly { at: number; height: number; width: number; glow: number; tones: readonly RGB[] }[] = [
  { at: 0.28, height: 0.4, width: 0.17, glow: 0.6, tones: [[150, 118, 240], [122, 92, 236], [60, 96, 200], [4, 106, 168]] },
  { at: 0.6, height: 0.56, width: 0.15, glow: 1, tones: [[237, 99, 125], [218, 52, 111], [122, 92, 236], [4, 106, 168]] },
  { at: 0.86, height: 0.3, width: 0.13, glow: 0.8, tones: [[242, 120, 128], [218, 52, 111], [96, 90, 220], [4, 106, 168]] },
]

/** How fast the beacon's rings roll outward (ring spacings a second): one every 12 seconds or so. */
const BEACON_SPEED = 0.085

/** Painted shapes are drawn on a 16:10 canvas, the hero's own proportion. */
const PW = 96
const PH = 60
const ASPECT = PW / PH

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const gauss = (t: number) => Math.exp(-t * t)
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** A pigment picked along a run of stops, t in 0–1. */
function ramp(stops: readonly RGB[], t: number): RGB {
  const x = clamp01(t) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x))
  return mixRGB(stops[i], stops[i + 1], x - i)
}

/** The hero's ground: deep blue at the left, sky through the middle, lagoon at the right. */
const groundAt = (x: number, y: number): RGB =>
  x < 0.8 ? mixRGB(P.deep, P.sky, smooth(0, 0.8, x + 0.15 * y)) : mixRGB(P.sky, P.lagoon, smooth(0.8, 1.6, x))

/**
 * Paint a shape: `paint` gets x in 0–1.6 (so circles stay round), y in 0–1, and the ground color
 * there, and returns the color.
 */
function painted(paint: (x: number, y: number, ground: RGB) => RGB): GradientMap {
  const data = new Float32Array(PW * PH * 3)
  for (let j = 0; j < PH; j++) {
    for (let i = 0; i < PW; i++) {
      const x = (i / (PW - 1)) * ASPECT
      const y = j / (PH - 1)
      const c = paint(x, y, groundAt(x, y))
      const o = (j * PW + i) * 3
      data[o] = c[0]
      data[o + 1] = c[1]
      data[o + 2] = c[2]
    }
  }
  return { width: PW, height: PH, data }
}

/** Lay `pigment` over `base` with opacity `a`. */
const over = (base: RGB, pigment: RGB, a: number): RGB => mixRGB(base, pigment, clamp01(a))

function fromColormap({ width, height, rows }: Colormap): GradientMap {
  const data = new Float32Array(width * height * 3)
  rows.forEach((row, j) => {
    for (let i = 0; i < width; i++) {
      const o = (j * width + i) * 3
      const s = i * 6
      data[o] = parseInt(row.slice(s, s + 2), 16)
      data[o + 1] = parseInt(row.slice(s + 2, s + 4), 16)
      data[o + 2] = parseInt(row.slice(s + 4, s + 6), 16)
    }
  })
  return { width, height, data }
}

/** Light for the tides' currents: from the upper left and front, like a studio render. */
type Vec3 = readonly [number, number, number]
const unit = (x: number, y: number, z: number): Vec3 => {
  const l = Math.hypot(x, y, z) || 1
  return [x / l, y / l, z / l]
}
const LIGHT = unit(-0.45, -0.7, 0.6)
const HALF = unit(LIGHT[0], LIGHT[1], LIGHT[2] + 1)
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/**
 * A surface of color `base` facing `n`: its shadow side is a deeper shade of its own color (never
 * black, so the glyphs keep covering it, and never mixed with another hue, so a pink current
 * doesn't shade to purple), its lit side is its own color, with a frost highlight on top.
 */
function lit(base: RGB, n: Vec3, gloss: number, shine: number): RGB {
  const diffuse = clamp01(dot(n, LIGHT))
  const spec = Math.pow(clamp01(dot(n, HALF)), gloss)
  const shade: RGB = [base[0] * 0.68, base[1] * 0.68, base[2] * 0.68]
  return over(mixRGB(shade, base, 0.2 + 0.8 * diffuse), P.frost, spec * shine)
}

/** Gaussian blur in place (separable, edges clamped), sigma in map pixels. */
function soften(map: GradientMap, sigma: number, scratch: Float32Array = new Float32Array(map.data.length)): GradientMap {
  const { width: W, height: H, data } = map
  const r = Math.ceil(sigma * 2.5)
  const kernel = new Float32Array(2 * r + 1)
  let sum = 0
  for (let i = -r; i <= r; i++) sum += kernel[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma))
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum
  const pass = (from: Float32Array, to: Float32Array, horizontal: boolean) => {
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        let r0 = 0
        let g0 = 0
        let b0 = 0
        for (let o = -r; o <= r; o++) {
          const ii = horizontal ? Math.min(W - 1, Math.max(0, i + o)) : i
          const jj = horizontal ? j : Math.min(H - 1, Math.max(0, j + o))
          const at = (jj * W + ii) * 3
          const w = kernel[o + r]
          r0 += from[at] * w
          g0 += from[at + 1] * w
          b0 += from[at + 2] * w
        }
        const out = (j * W + i) * 3
        to[out] = r0
        to[out + 1] = g0
        to[out + 2] = b0
      }
    }
  }
  pass(data, scratch, true)
  pass(scratch, data, false)
  return map
}

/**
 * The tides: four currents of light running level across the screen, evenly spaced and the same
 * weight from edge to edge. Each is a glossy tube with a soft glow of its own color and a faint shadow,
 * in the field's own colors: two in ice and the field's blues, two in its warm pinks and peach,
 * over a ground sunk toward navy so each current stands out as its own shape. The lower ones pass
 * in front where they overlap in the bundle.
 *
 * The currents stay where they are; only their width moves. Each one ripples up and down in place,
 * swelling at some points as it settles at others, in a pattern exactly two ripples to the
 * screen's width, so the swelling and the settling always cancel out and each current shows the
 * same amount of its color: the balance of color on screen never changes.
 */
const CURRENTS = [
  // Colors run from the right edge (first) to the bundle (last). Each current blends within its
  // own family, and the warm ones only through peach, never straight from pink into blue.
  // Two only, on the blue ground: the old hero's pink over a slimmer current that turns from the
  // field's sky to violet in the middle and back, so blue, pink and violet show in about equal measure.
  { base: 0.2, tones: [P.rose, P.rose, P.rose] },
  { base: 0.42, tones: [P.sky, VIOLET, P.sky] },
].map(({ base, tones }, k) => ({ base, tones, R: k === 0 ? 0.11 : 0.075 }))

/**
 * The ripples: how far they swell and settle a current (a share of its radius), how long one
 * swell takes (seconds), and their spacing, two whole ripples across the screen so their effect on
 * a current's area always cancels.
 */
const RIPPLE = 0.28
const RIPPLE_PERIOD = 10
const RIPPLE_K = (2 * 2 * Math.PI) / ASPECT


/** Painted finer than the other shapes, so the currents' highlights stay crisp, and softened a little. */
const TIDES_W = 128
const TIDES_H = 80
const TIDES_SOFTEN = 1.5

/**
 * Where current `k` runs at `u` (measured from the right edge, 0, to the left, 1.6). It never moves:
 * a gentle curve, the same for every current at a given u.
 */
/**
 * In development, `?tides=` previews another path for the currents: `level` (level and evenly
 * spaced), `bundle` (bundled on the left, spreading right), `sweep` (a diagonal rising to the
 * right), `swell` (deep S waves) or `arc` (an arc over the top). Without it they draw the mountain.
 */
const TIDES_PATH =
  import.meta.env.DEV && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tides') : null

/**
 * The mountain's ridge, an abstract Everest: one soft summit a little right of centre and a lower
 * shoulder to its left, every rise rounded so it reads as a form rather than a jagged line. `x` runs 0 (left) to 1 (right); the result is the
 * ridge's height as a share of the picture from the top.
 */
function ridge(x: number): number {
  const summit = 0.54 * gauss((x - 0.58) / 0.17)
  const shoulder = 0.26 * gauss((x - 0.32) / 0.15)
  return 0.68 - Math.max(summit, shoulder) - 0.3 * summit * shoulder
}

function currentY(k: number, u: number): number {
  const { base } = CURRENTS[k]
  const across = u / ASPECT
  if (!TIDES_PATH || TIDES_PATH === 'everest') {
    // The mountain: the currents lie under the ridge as its contours. Like contour lines they crowd together at the summit and fan out down the slopes.
    const x = 1 - across
    const gap = 0.1 + 0.08 * (1 - gauss((x - 0.58) / 0.22))
    return ridge(x) + k * gap
  }
  if (TIDES_PATH === 'bundle') {
    const pull = smooth(-0.1, 1.75, u)
    const meet = 0.3 + (k - 1.5) * 0.045
    const wave = 0.035 * Math.sin(2.4 * u) * (1 - pull)
    const roll = 0.028 * Math.sin(1.2 * u) * (0.35 + 0.65 * (1 - pull))
    return base + (meet - base) * pull + wave + roll
  }
  if (TIDES_PATH === 'sweep') return 0.04 + base * 0.75 + 0.32 * across + 0.02 * Math.sin(2.2 * u)
  if (TIDES_PATH === 'swell') return 0.12 + base * 0.8 + 0.1 * Math.sin(2.6 * u + 0.6)
  if (TIDES_PATH === 'arc') return 0.1 + base * 0.75 + 0.32 * ((across - 0.5) * 2) ** 2
  // `level`: evenly spaced the whole way across, the same weight from edge to edge.
  const wave = 0.035 * Math.sin(2.4 * u)
  const roll = 0.028 * Math.sin(1.2 * u)
  return base + wave + roll
}

/** What doesn't move under the tides: the ground sunk toward navy, with a soft lagoon glow over the bundle. */
let tidesGround: Float32Array | null = null
/** The tides' buffers, repainted in place. */
let tidesData: Float32Array | null = null
let tidesScratch: Float32Array | null = null

function paintTides(time: number): GradientMap {
  const W = TIDES_W
  const H = TIDES_H
  const n = CURRENTS.length
  if (!tidesGround) {
    tidesGround = new Float32Array(W * H * 3)
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const x = (i / (W - 1)) * ASPECT
        const y = j / (H - 1)
        let c = over(over(groundAt(x, y), P.deep, 0.6), P.navy, 0.32)
        c = over(c, P.lagoon, smooth(1.5, 0, Math.hypot(x - 0.4, y - 0.3)) * 0.2)
        tidesGround.set(c, (j * W + i) * 3)
      }
    }
    tidesData = new Float32Array(W * H * 3)
    tidesScratch = new Float32Array(W * H * 3)
  }
  const data = tidesData as Float32Array
  const swell = (time * 2 * Math.PI) / RIPPLE_PERIOD

  // Each column's slice of each current: its center, which way is "across" it, its radius and color.
  const centers = new Float32Array(W * n)
  const acrossX = new Float32Array(W * n)
  const acrossY = new Float32Array(W * n)
  const radii = new Float32Array(W * n)
  const tones: RGB[] = new Array(W * n)
  for (let i = 0; i < W; i++) {
    const u = ASPECT - (i / (W - 1)) * ASPECT
    const along = clamp01((u + 0.15) / 1.9)
    for (let k = 0; k < n; k++) {
      const o = i * n + k
      const slope = (currentY(k, u - 0.002) - currentY(k, u + 0.002)) / 0.004
      const len = Math.sqrt(1 + slope * slope)
      centers[o] = currentY(k, u)
      acrossX[o] = -slope / len
      acrossY[o] = 1 / len
      // The current's width ripples up and down in place: its ripples sit still along it and swell
      // and settle in turn. Neighbouring currents swell in opposite turns, so as one swells the next
      // settles and the two warm ones never grow together.
      radii[o] = CURRENTS[k].R * (1 + RIPPLE * Math.sin(RIPPLE_K * u + k * 1.1) * Math.sin(swell + k * Math.PI))
      tones[o] = ramp(CURRENTS[k].tones, along)
    }
  }

  const offsets = new Float32Array(n)
  for (let j = 0; j < H; j++) {
    const y = j / (H - 1)
    for (let i = 0; i < W; i++) {
      const p = (j * W + i) * 3
      const ground = tidesGround
      let c: RGB = [ground[p], ground[p + 1], ground[p + 2]]
      // First every current's glow and shadow, then the currents themselves, the lower ones in front.
      for (let k = 0; k < n; k++) {
        const o = i * n + k
        const d = (y - centers[o]) * acrossY[o]
        offsets[k] = d
        const dist = Math.abs(d)
        c = over(c, P.navy, gauss((dist - radii[o] - 0.03) / 0.06) * 0.3)
        c = over(c, tones[o], gauss(dist / (radii[o] * 2.3)) * 0.4)
      }
      for (let k = 0; k < n; k++) {
        const o = i * n + k
        const across = Math.abs(offsets[k]) / radii[o]
        if (across >= 1.06) continue
        const t = Math.min(1, across)
        const side = Math.sign(offsets[k]) * t
        const normal = unit(acrossX[o] * side, acrossY[o] * side, Math.sqrt(1 - t * t))
        let col = lit(tones[o], normal, 50, 0.6)
        col = over(col, P.lagoon, Math.pow(1 - normal[2], 3) * 0.3)
        c = over(c, col, smooth(1.06, 0.88, across) * 0.95)
      }
      data[p] = c[0]
      data[p + 1] = c[1]
      data[p + 2] = c[2]
    }
  }
  return soften({ width: W, height: H, data }, TIDES_SOFTEN, tidesScratch as Float32Array)
}

const PAINTERS: Record<ShapeName, (time: number) => GradientMap> = {
  // Currents of light flowing across the top of the landing (see paintTides).
  tides: paintTides,

  bloom: () => fromColormap(GRADIENT_COLORMAP),

  // A range of three soft peaks, back to front: a violet one far off on the left, the tall pink summit
  // a little right of centre, and a low pink one in front on the right. Each blends from its ridge
  // down into the field's blue rather than sitting in bands, with a haze along its ridge; the far
  // one is cooler, so it reads as further away.
  // The peaks move slowly on their own: each rises and settles, leans a little left and right and
  // broadens and narrows, out of step with the others, so the range breathes without losing its shape.
  summit: (time) =>
    painted((x, y, ground) => {
      const u = x / ASPECT
      let c = ground
      for (const [n, peak] of SUMMIT_PEAKS.entries()) {
        const phase = time * SUMMIT_SPEED + n * 2.1
        const height = peak.height * (1 + 0.12 * Math.sin(phase))
        const at = peak.at + 0.025 * Math.sin(phase * 0.7 + 1.3)
        const width = peak.width * (1 + 0.1 * Math.sin(phase * 0.8 + 2.6))
        const d = y - (0.76 - height * gauss((u - at) / width))
        if (d < 0) c = over(c, peak.tones[0], gauss(d / 0.07) * 0.7 * peak.glow)
        else c = over(c, ramp(peak.tones, clamp01(d / 0.45)), 0.94 * (1 - smooth(0.35, 0.7, d)))
      }
      return c
    }),

  // A ring of warm light around a dark disc, high on the right: the corona of an eclipse, lit
  // hottest on its lower-left rim, with a bright bead where the sun breaks through.
  eclipse: () =>
    painted((x, y, ground) => {
      const cx = 1.12
      const cy = 0.26
      const R = 0.2
      const dx = x - cx
      const dy = y - cy
      const d = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)
      // 1 on the lower-left of the rim, 0 on the upper-right.
      const lit = 0.5 + 0.5 * Math.cos(angle - 2.4)
      let c = ground
      c = over(c, P.iris, 0.8 * gauss((d - R) / 0.26) + 0.25 * gauss((d - R) / 0.55))
      c = over(c, P.peach, gauss((d - R) / (0.08 + 0.08 * lit)) * (0.6 + 0.4 * lit))
      c = over(c, P.rose, gauss((d - R + 0.02) / 0.05) * lit * 0.85)
      c = over(c, P.deep, smooth(R * 0.95, R * 0.55, d) * 0.92)
      const bead = Math.hypot(x - (cx + R * Math.cos(-0.75)), y - (cy + R * Math.sin(-0.75)))
      return over(c, P.haze, gauss(bead / 0.11))
    }),

  // Rings rolling out from beyond the top-left corner, as if something dropped in just off the
  // page: warm near the source, cooling to iris and lagoon, fading as they spread.
  ripple: () =>
    painted((x, y, ground) => {
      const d = Math.hypot(x - 0.3, y + 0.12)
      const swell = Math.pow(0.5 + 0.5 * Math.cos((2 * Math.PI * d) / 0.24), 1.1)
      const fade = smooth(1.5, 0.05, d)
      const tone = ramp([P.haze, P.peach, P.rose, P.iris, P.lagoon], smooth(0.1, 1.3, d))
      let c = over(ground, P.iris, 0.4 * fade)
      c = over(c, tone, swell * fade)
      // The troughs sink a little darker so the rings read in the characters too.
      return over(c, P.deep, (1 - swell) * fade * 0.25)
    }),

  // Curtains of light hanging across the top of the page: each has a sharp, bright lower hem and
  // a long glow rising above it, and the color runs rose to lagoon from left to right.
  aurora: () =>
    painted((x, y, ground) => {
      let c = over(ground, P.deep, smooth(0.35, 0, y) * 0.3)
      const curtain = (hem: number, amp: number, phase: number, strength: number, warm: number) => {
        const edge = hem + amp * Math.sin(2.1 * x + phase) + amp * 0.45 * Math.sin(5.3 * x + phase * 1.7)
        const dy = y - edge
        // Below the hem the light stops sharply; above it, it fades slowly.
        const folds = 0.6 + 0.4 * Math.sin(11 * x + 3 * Math.sin(4 * x) + phase)
        const a = dy > 0 ? gauss(dy / 0.06) : Math.exp(dy / 0.26) * folds
        const tone = ramp([P.rose, P.peach, P.haze, P.iris, P.lagoon], clamp01(x / ASPECT + warm))
        c = over(c, P.iris, Math.min(1, a * 1.4) * strength * 0.6)
        c = over(c, tone, a * strength)
        c = over(c, P.haze, gauss(dy / 0.03) * strength * 0.7)
      }
      curtain(0.2, 0.05, 2.6, 0.6, 0.25)
      curtain(0.4, 0.08, 0.4, 1, -0.1)
      return c
    }),

  // Shafts of light fanning down from the top-right corner, like sun through a high window:
  // pale at the source, warming, then cooling into iris as they reach across.
  rays: () =>
    painted((x, y, ground) => {
      const ox = 1.42
      const oy = -0.12
      const dx = x - ox
      const dy = y - oy
      const len = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx)
      const shafts = [
        [2.02, 0.11, 1],
        [2.3, 0.08, 0.8],
        [2.52, 0.13, 1],
        [2.8, 0.08, 0.75],
        [3.0, 0.1, 0.7],
      ] as const
      let light = 0
      for (const [a, w, s] of shafts) light += s * gauss((angle - a) / w)
      light = Math.min(1, light) * smooth(1.9, 0.2, len)
      const glow = gauss((angle - 2.45) / 0.5) * smooth(1.8, 0.1, len)
      const tone = ramp([P.haze, P.peach, P.rose, P.iris], smooth(0.2, 1.5, len))
      let c = over(ground, P.iris, glow * 0.6)
      c = over(c, tone, light)
      return over(c, P.haze, gauss(len / 0.38) * 0.85)
    }),

  // Bands of color laid one over another like sediment or dunes, their edges rolling, each crest
  // catching a thin line of light.
  strata: () =>
    painted((x, y, ground) => {
      const bands: readonly [base: number, amp: number, freq: number, phase: number, pigment: RGB, alpha: number][] = [
        [0.07, 0.03, 2.2, 0.3, P.lagoon, 0.6],
        [0.15, 0.04, 1.7, 1.9, P.iris, 0.85],
        [0.24, 0.045, 2.6, 4.1, P.peach, 0.9],
        [0.33, 0.04, 1.9, 2.7, P.rose, 0.7],
        [0.43, 0.04, 2.3, 5.2, P.iris, 0.8],
        [0.56, 0.035, 1.6, 0.9, P.sky, 0.6],
      ]
      let c = ground
      for (const [base, amp, freq, phase, pigment, alpha] of bands) {
        const edge = base + amp * Math.sin(freq * x + phase) + amp * 0.4 * Math.sin(4.7 * x + phase * 2)
        const below = smooth(edge - 0.03, edge + 0.07, y)
        c = over(c, pigment, below * alpha)
        c = over(c, P.haze, gauss((y - edge) / 0.02) * 0.5)
      }
      return c
    }),

  // The join page's light: a beacon rising from under the bottom edge, a rose and peach core with a
  // violet halo, sending wide soft rings of light out across the page that cool to blue as they go.
  // The rings roll slowly outward and the core breathes, so it reads as a call going out.
  beacon: (time) =>
    painted((x, y, ground) => {
      const d = Math.hypot(x - ASPECT / 2, (y - 0.98) * 1.1)
      const breath = 1 + 0.06 * Math.sin(time * 0.5)
      const spread = smooth(1.9, 0.25, d)
      let c = over(ground, P.deep, smooth(0.5, 0, y) * 0.25)
      c = over(c, VIOLET, smooth(1.3, 0.25, d) * 0.55)
      const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * (d / 0.3 - time * BEACON_SPEED))
      const tone = ramp([P.peach, P.rose, VIOLET, P.sky], smooth(0.3, 1.5, d))
      c = over(c, tone, Math.pow(wave, 2) * spread * 0.85)
      c = over(c, P.rose, smooth(0.62 * breath, 0.18, d) * 0.85)
      c = over(c, P.peach, smooth(0.38 * breath, 0.04, d) * 0.85)
      return over(c, P.haze, smooth(0.2 * breath, 0, d) * 0.6)
    }),

  // A sun coming up from under the bottom edge: a wide iris sky, a peach glow, a rose rim and a
  // pale core breaking the horizon, with faint shafts fanning up from it. For the end of a page.
  dawn: () =>
    painted((x, y, ground) => {
      const cx = ASPECT / 2
      const cy = 1.02
      const dx = x - cx
      const dy = y - cy
      const d = Math.hypot(dx, dy)
      const angle = Math.atan2(dy, dx) // about -π/2 straight up
      const R = 0.4
      let c = over(ground, P.deep, smooth(0.45, 0, y) * 0.3)
      c = over(c, P.iris, smooth(R + 0.7, R + 0.05, d) * 0.8)
      const shafts = 0.5 + 0.5 * Math.cos((angle + Math.PI / 2) * 9)
      c = over(c, P.lagoon, smooth(R + 0.7, R + 0.15, d) * shafts * 0.35)
      c = over(c, P.peach, smooth(R + 0.28, R - 0.02, d) * 0.95)
      c = over(c, P.rose, gauss((d - R - 0.02) / 0.06) * 0.8)
      return over(c, P.haze, smooth(R - 0.04, R - 0.26, d))
    }),
}

/** Shapes that move on their own, and how many times a second they're repainted. */
const MOVING: Partial<Record<ShapeName, number>> = { tides: 12, summit: 12, beacon: 12 }

const cache = new Map<ShapeName, GradientMap>()
/** For a moving shape: which repaint its cached map is. */
const steps = new Map<ShapeName, number>()

/**
 * The colors of a shape at `time` (seconds; 0 is the still pose). A still shape is painted the
 * first time it's asked for. A moving one is repainted a few times a second (into the same
 * buffer), and each repaint comes back as a new object, so a renderer can tell it has changed.
 */
export function shapeMap(name: ShapeName, time = 0): GradientMap {
  const cached = cache.get(name)
  const rate = MOVING[name]
  const step = rate ? Math.floor(time * rate) : 0
  if (cached && steps.get(name) === step) return cached
  const map = PAINTERS[name](rate ? step / rate : 0)
  cache.set(name, map)
  steps.set(name, step)
  return map
}
