// The optics behind the site's glass. A lens bends what's behind it instead of blurring it, so each
// surface gets a map of how far every pixel's view is pushed, found by tracing a ray down through a
// convex edge by Snell's law, and a rim of light fixed to the same outline. Browsers feed the map to
// an SVG displacement filter. Only Chromium can run that filter on what's behind an element, so the
// others keep the frost and the rim, which are enough to read as glass.

/** Map pixels per CSS pixel. Past 2 the error stops falling while every frame's cost keeps rising. */
const MAP_SCALE = 2
const INDEX_OF_REFRACTION = 1.5
/** The flat slab under the curved edge, as a multiple of the curve's height. */
const SLAB = 2
const STEPS = 512

/** The light: where it falls from (up and to the left), and how much of the rim it reaches. */
const LIGHT_ANGLE = (120 * Math.PI) / 180
const LIGHT_REACH = 0.42
/** Rim opacity everywhere, then added where the light lands. A rim past 0.5 starts to look painted. */
const RIM_AMBIENT = 0.13
const RIM_PEAK = 0.37
/** The bright line sits just inside the outline, in CSS px. */
const RIM_INSET = 1.1
const RIM_WIDTH = 1.1
/** Glass catches more light at a glancing angle, so the very edge glows faintly. */
const EDGE_GLOW = 0.14
/** Between these distances in from the rim, in CSS px, the clear edge turns to frost. */
const CLEAR_TO = 5
const FROST_FROM = 15

const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v))

/** The edge's height, 0 at the rim and 1 where it has curved over to flat: a squircle's quarter. */
const relief = (t: number) => (1 - (1 - t) ** 4) ** 0.25
const slope = (t: number) => (1 - t) ** 3 * (1 - (1 - t) ** 4) ** -0.75

/** How far sideways a straight-down ray lands after entering the edge at `t`, inward as positive. */
function travel(t: number): number {
  const s = slope(t)
  const length = Math.hypot(s, 1)
  const nx = -s / length
  const ny = -1 / length
  const ratio = 1 / INDEX_OF_REFRACTION
  const k = ratio * ny + Math.sqrt(1 - ratio * ratio * (1 - ny * ny))
  return (-k * nx * (relief(t) + SLAB)) / (ratio - k * ny)
}

/** `travel` across the edge, as a fraction of its peak at the rim. */
const BEND = (() => {
  const curve = new Float32Array(STEPS + 1)
  const peak = travel(1e-4)
  for (let i = 0; i < STEPS; i++) curve[i] = clamp(travel(Math.max(i / STEPS, 1e-4)) / peak, -1, 1)
  return curve
})()

export interface GlassMaps {
  /** Displacement: red and green hold x and y, with 128 for none. */
  map: string
  /** The rim of light, as white with the shape in alpha. */
  rim: string
  /** Where the frost sits: all of the middle, gone by the rim, so the rim stays clear and bends sharply. */
  core: string
}

const cache = new Map<string, GlassMaps>()

/** The maps for a rounded box in CSS px. `bezel` is how far in from the rim the edge curves. */
export function glassMaps(width: number, height: number, radius: number, bezel: number): GlassMaps {
  const key = `${width}x${height}/${radius}/${bezel}`
  const cached = cache.get(key)
  if (cached) return cached

  const columns = Math.round(width * MAP_SCALE)
  const rows = Math.round(height * MAP_SCALE)
  const map = new ImageData(columns, rows)
  const rim = new ImageData(columns, rows)
  const core = new ImageData(columns, rows)
  const straightX = width / 2 - radius
  const straightY = height / 2 - radius

  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) / MAP_SCALE - height / 2
    const signY = y < 0 ? -1 : 1
    const qy = Math.abs(y) - straightY
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5) / MAP_SCALE - width / 2
      const signX = x < 0 ? -1 : 1
      const qx = Math.abs(x) - straightX

      // The outward normal and the distance in from the outline, from the rounded box's distance field.
      let nx = 0
      let ny = signY
      let inset = radius - qy
      if (qx > 0 && qy > 0) {
        const out = Math.hypot(qx, qy)
        nx = (signX * qx) / out
        ny = (signY * qy) / out
        inset = radius - out
      } else if (qx > qy) {
        nx = signX
        ny = 0
        inset = radius - qx
      }

      const bend = BEND[Math.round(clamp(inset / bezel, 0, 1) * STEPS)]
      const at = (row * columns + column) * 4
      map.data[at] = 128 - nx * bend * 127
      map.data[at + 1] = 128 - ny * bend * 127
      map.data[at + 2] = 128
      map.data[at + 3] = 255

      // Each highlight starts at its own end of the box and dies away along the edge.
      const along = (x + width / 2) / width
      const fromLeft = Math.exp(-((along / LIGHT_REACH) ** 2))
      const fromRight = Math.exp(-(((1 - along) / LIGHT_REACH) ** 2))
      const reach = fromRight + (fromLeft - fromRight) * ((1 - ny) / 2)
      const facing = Math.cos(Math.atan2(ny, nx) + LIGHT_ANGLE) ** 2
      const offset = Math.abs(inset - RIM_INSET)
      const line = offset < RIM_WIDTH ? Math.cos((Math.PI / 2) * (offset / RIM_WIDTH)) : 0
      const glow = EDGE_GLOW * clamp(1.2 - 0.185 * Math.max(inset, 0) * 2.6, 0, 1) ** 5
      rim.data[at] = 255
      rim.data[at + 1] = 255
      rim.data[at + 2] = 255
      rim.data[at + 3] = 255 * clamp(line * (RIM_AMBIENT + RIM_PEAK * facing * reach) + glow, 0, 1)

      const clear = clamp((inset - CLEAR_TO) / (FROST_FROM - CLEAR_TO), 0, 1)
      core.data[at + 3] = 255 * clear * clear * (3 - 2 * clear)
    }
  }

  const maps = { map: toDataUrl(map), rim: toDataUrl(rim), core: toDataUrl(core) }
  cache.set(key, maps)
  return maps
}

function toDataUrl(image: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  canvas.getContext('2d')?.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Whether to run the lens. Fail closed: Safari and Firefox accept `url()` in `backdrop-filter`, so a
 * feature check says yes, then they drop the whole list, frost and all. Anyone who has asked for
 * less transparency or more contrast gets the frost too.
 */
export function canRefract(): boolean {
  const agent = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }
  if (!agent.userAgentData?.brands?.some((entry) => entry.brand === 'Chromium')) return false
  return !matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)').matches
}
