import { GRADIENT_COLORMAP, type Colormap } from './colormap'

/**
 * The shapes the field's light can take. `bloom` is the hero gradient sampled from the reference
 * design; the others are painted here from the same pigments (picked out of that gradient), so
 * every shape is in the site's one palette and only the silhouette changes.
 */
export const SHAPES = ['bloom', 'eclipse', 'ripple', 'aurora', 'rays', 'strata', 'dawn'] as const
export type ShapeName = (typeof SHAPES)[number]

export const SHAPE_LABELS: Record<ShapeName, string> = {
  bloom: 'Bloom',
  eclipse: 'Eclipse',
  ripple: 'Ripple',
  aurora: 'Aurora',
  rays: 'Rays',
  strata: 'Strata',
  dawn: 'Dawn',
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
  iris: hex('8488b5'),
  haze: hex('cec1be'),
  peach: hex('f8928a'),
  rose: hex('da346f'),
} as const

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
      // The hero's ground: deep blue at the left, sky through the middle, lagoon at the right.
      const ground = x < 0.8 ? mixRGB(P.deep, P.sky, smooth(0, 0.8, x + 0.15 * y)) : mixRGB(P.sky, P.lagoon, smooth(0.8, 1.6, x))
      const c = paint(x, y, ground)
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

const PAINTERS: Record<ShapeName, () => GradientMap> = {
  bloom: () => fromColormap(GRADIENT_COLORMAP),

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

const cache = new Map<ShapeName, GradientMap>()

/** The colors of a shape, painted the first time it's asked for. */
export function shapeMap(name: ShapeName): GradientMap {
  let map = cache.get(name)
  if (!map) {
    map = PAINTERS[name]()
    cache.set(name, map)
  }
  return map
}
