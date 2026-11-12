// The pixel language of the public site: the palette, a cheap noise, and the models behind each
// canvas (hero field, flow, skyline, pixel text). Everything here is plain data with no DOM, so a
// model only says which colour each cell is. usePixelCanvas does the drawing.

export const DEEP = '#1c4d75'
export const CERULEAN = '#1a8fc0'
export const IRIS = '#ab9dff'
export const RASPBERRY = '#c2407a'
export const MINT = '#9df0a8'
/** The ground the cells sit on, which their paler tiers fade toward. */
const HARBOR_RGB = [19, 19, 19]

/** Index 0 is always a blank cell. Cells are stored as indexes into a palette. */
export const HEAT_PALETTE = ['', DEEP, CERULEAN, IRIS, RASPBERRY, MINT] as const
const [, I_DEEP, I_CERULEAN, I_IRIS, I_RASPBERRY, I_MINT] = [0, 1, 2, 3, 4, 5] as const

/** A colour laid over the ground, as a solid value, so a cell can be repainted without clearing it. */
function tint(hex: string, strength: number): string {
  const channel = (at: number, index: number) => {
    const value = Number.parseInt(hex.slice(at, at + 2), 16)
    const ground = HARBOR_RGB[index]!
    return Math.round(ground + (value - ground) * strength)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(1, 0)}${channel(3, 1)}${channel(5, 2)}`
}

/** The flow's palette: the heat colours, then paler tiers of blue and gold. */
export const FLOW_PALETTE = [
  ...HEAT_PALETTE,
  tint(CERULEAN, 0.7),
  tint(CERULEAN, 0.45),
  tint(CERULEAN, 0.25),
  tint(IRIS, 0.65),
  tint(IRIS, 0.4),
] as const
const [I_CERULEAN_2, I_CERULEAN_3, I_CERULEAN_4, I_IRIS_2, I_IRIS_3] = [6, 7, 8, 9, 10] as const

// A fixed table of random values, so the same cell always gets the same value.
const SIZE = 256
const TABLE = new Float32Array(SIZE * SIZE)
{
  let seed = 0x2f6e2b1
  for (let i = 0; i < TABLE.length; i++) {
    seed = (seed + 0x6d2b79f5) | 0
    let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    TABLE[i] = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

/** A stable value from 0 to 1 for a whole-number position. */
export const hash = (x: number, y: number) => TABLE[((y & 255) << 8) | (x & 255)]!

/** Smooth value noise from 0 to 1. */
export function noise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const top = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx
  const bottom = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx
  return top + (bottom - top) * sy
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount
const ease = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

/** Heat to colour, low to high: blank, navy, blue, gold, red, neon. */
function band(heat: number): number {
  if (heat < 0.3) return 0
  if (heat < 0.46) return I_DEEP
  if (heat < 0.56) return I_CERULEAN
  if (heat < 0.74) return I_IRIS
  if (heat < 0.83) return I_RASPBERRY
  return I_MINT
}

// ---- The hero field ----

export type FlowVariant = 'helix' | 'bands'

/** A band in the 'bands' flow: from where to where, and how it moves down and swells on the way. */
interface Band {
  from: number
  to: number
  centre: [number, number]
  half: [number, number]
  density: [number, number]
  colour: number
}

const BANDS: readonly Band[] = [
  { from: 0, to: 0.56, centre: [-0.05, 0.42], half: [0.92, 0.26], density: [0.36, 0.95], colour: I_DEEP },
  { from: 0.27, to: 0.58, centre: [-0.28, 0.02], half: [0.14, 0.34], density: [0.62, 0.97], colour: I_CERULEAN },
  { from: 0.56, to: 0.84, centre: [0.1, -0.24], half: [0.5, 0.42], density: [0.97, 0.72], colour: I_IRIS },
  { from: 0.7, to: 1, centre: [-0.14, -0.74], half: [0.2, 0.26], density: [0.72, 0.9], colour: I_MINT },
]

function flowHelix(cells: Uint8Array, cols: number, rows: number, time: number) {
  const waist = 0.47
  const run = Math.floor(time * 5)
  const beat = Math.floor(time * 7)
  for (let y = 0; y < rows; y++) {
    const v = (y - (rows - 1) / 2) / ((rows - 1) / 2)
    for (let x = 0; x < cols; x++) {
      const u = x / (cols - 1)
      const moving = hash(x - run, y)
      const flicker = hash(x + beat * 7, y + 31)
      const goldness = ease((u - 0.34) / 0.3)
      const gold = hash(x, y + 5) < goldness
      let tier = 0

      // Scattered pixels on the left, drawn in through the waist. They run left to right.
      if (u < waist + 0.14) {
        const open = u < waist ? mix(0.96, 0.1, ease(u / waist)) : 0.1
        const density = mix(0.2, 0.66, ease(u / waist)) * (1 - ease((u - waist) / 0.14))
        if (Math.abs(v) < open * (0.72 + 0.4 * hash(x, 200 + y)) && moving < density) tier = 1 + Math.floor(flicker * 3.4)
      }

      // Two strands on the right, turning round each other as they widen.
      if (u > waist - 0.04) {
        const swell = mix(0.05, 0.82, ease((u - waist) / (1 - waist)))
        const turn = u * 17 - time * 1.5
        const near = Math.abs(v - swell * Math.sin(turn)) * (rows / 2)
        const far = Math.abs(v + swell * Math.sin(turn)) * (rows / 2)
        if (near < 1.1 + hash(x, 60) * 0.7 && flicker < 0.82) tier = 1
        else if (far < 0.9 + hash(x, 61) * 0.6 && flicker < 0.7) tier = 3
        else if (near < 3.4 && hash(x + beat, y + 90) < 0.1) tier = 2
        else if (Math.abs(v) < swell + 0.05 && moving < 0.012) tier = 3
      }

      if (tier === 0) cells[y * cols + x] = 0
      else if (gold) cells[y * cols + x] = tier === 1 ? I_IRIS : tier === 2 ? I_IRIS_2 : I_IRIS_3
      else cells[y * cols + x] = tier === 1 ? I_CERULEAN : tier === 2 ? I_CERULEAN_2 : tier === 3 ? I_CERULEAN_3 : I_CERULEAN_4
    }
  }
}

function flowBands(cells: Uint8Array, cols: number, rows: number, time: number) {
  const run = Math.floor(time * 4)
  const beat = Math.floor(time * 5)
  for (let y = 0; y < rows; y++) {
    const v = (y - (rows - 1) / 2) / ((rows - 1) / 2)
    for (let x = 0; x < cols; x++) {
      const u = x / (cols - 1)
      const moving = hash(x - run, y)
      const flicker = hash(x + beat * 7, y + 31)
      let colour = 0
      for (const band of BANDS) {
        if (u < band.from || u > band.to) continue
        const along = (u - band.from) / (band.to - band.from)
        const offset = Math.abs(v - mix(band.centre[0], band.centre[1], along))
        const half = mix(band.half[0], band.half[1], along)
        if (offset > half * (0.82 + 0.34 * hash(x, y + 7))) continue
        // Thin toward its edges, so a band's outline breaks up in loose cells.
        const density = mix(band.density[0], band.density[1], along) * (1 - ease((offset / half - 0.55) / 0.5) * 0.7)
        if ((colour === 0 || band.colour !== I_DEEP) && (moving * 0.7 + flicker * 0.3) < density) colour = band.colour
      }
      if (colour === 0 && u > 0.74 && v > 0.08 && moving < 0.05 * ease((u - 0.74) / 0.1)) colour = I_RASPBERRY
      cells[y * cols + x] = colour
    }
  }
}

export function flowFrame(variant: FlowVariant, cells: Uint8Array, cols: number, rows: number, time: number) {
  if (variant === 'helix') flowHelix(cells, cols, rows, time)
  else flowBands(cells, cols, rows, time)
}

// ---- The journey ----

/**
 * The journey's light, left to right: eight stops read across the field from sky, through iris, to
 * rose (this branch's named samples of it, see index.css), each at three strengths laid over the
 * harbor ground, then the steady frost beat underneath.
 */
const between = (from: string, to: string, amount: number) =>
  `#${[1, 3, 5]
    .map((at) => {
      const a = Number.parseInt(from.slice(at, at + 2), 16)
      const b = Number.parseInt(to.slice(at, at + 2), 16)
      return Math.round(a + (b - a) * amount).toString(16).padStart(2, '0')
    })
    .join('')}`
const SKY_LIGHT = '#7cc7f4'
const IRIS_LIGHT = '#ab9dff'
const ROSE_LIGHT = '#f4a2c0'
const FROST = '#f6fbff'
const JOURNEY_STOPS = Array.from({ length: 8 }, (_, index) => {
  const at = index / 7
  return at < 0.5 ? between(SKY_LIGHT, IRIS_LIGHT, at * 2) : between(IRIS_LIGHT, ROSE_LIGHT, (at - 0.5) * 2)
})
const JOURNEY_STRENGTHS = [1, 0.6, 0.3] as const

export const JOURNEY_PALETTE = [
  '',
  ...JOURNEY_STRENGTHS.flatMap((strength) => JOURNEY_STOPS.map((stop) => tint(stop, strength))),
  tint(FROST, 0.42),
] as const
const JOURNEY_BEAT = JOURNEY_PALETTE.length - 1

const JOURNEY_WAIST = 0.44
const JOURNEY_BEAT_ROW = 0.965
/** How much of the grid is lit, roughly. */
const JOURNEY_FILL = 0.2
const TAU = Math.PI * 2

/** Each stage has its own marks: light at the start, more made as it goes. Stable per cell. */
export function journeyGlyph(x: number, y: number, cols: number, rows: number): string {
  if (y === Math.round(rows * JOURNEY_BEAT_ROW)) return '_'
  const u = x / cols
  const set = u < 0.22 ? '+:+x' : u < JOURNEY_WAIST ? 'x+*+' : u < 0.68 ? '>=*>' : '#@%#'
  return set[Math.floor(hash(x, y) * set.length)]!
}

/**
 * People moving left to right: a wide crowd funnels through one narrow waist and comes out as three
 * braided strands. They're real particles, so the shape holds and everything in it is travelling.
 */
export function journeyFrame(cells: Uint8Array, cols: number, rows: number, time: number) {
  cells.fill(0)
  const beatRow = Math.round(rows * JOURNEY_BEAT_ROW)
  const count = Math.floor(cols * rows * JOURNEY_FILL)
  const stops = JOURNEY_STOPS.length
  const centre = 0.47
  for (let i = 0; i < count; i++) {
    // Evenly spread sequences, not random ones: no clumps and no holes in the crowd.
    const a = (i * 0.618034) % 1
    const b = (i * 0.754878) % 1
    const c = (i * 0.569840) % 1
    const u = (a + time * (0.016 + b * 0.014)) % 1
    // Two random numbers added lean toward the middle, so the crowd thins out at its edges.
    const off = b + c - 1
    let v: number
    let strength: number
    if (u < JOURNEY_WAIST) {
      const inward = ease(u / JOURNEY_WAIST)
      const spread = mix(0.44, 0.014, inward * inward * (2 - inward))
      v = centre + off * spread + Math.sin(time * 0.5 + a * 40) * spread * 0.05
      strength = Math.abs(off) < mix(0.62, 1, inward) ? 0 : Math.abs(off) < 0.82 ? 1 : 2
    } else {
      const open = ease((u - JOURNEY_WAIST) / (1 - JOURNEY_WAIST))
      const strand = Math.floor(c * 3)
      const phase = u * 11 - time * 0.42 + (strand * TAU) / 3
      v = centre + Math.sin(phase) * mix(0.014, 0.3, open) + off * mix(0.016, 0.05, open)
      // A strand passing behind the others goes dim, which is what makes the braid read.
      const front = Math.cos(phase)
      strength = front > -0.15 ? 0 : front > -0.65 ? 1 : 2
      // It thins out before the edge, so nothing is cut off by the screen.
      if (a < (u - 0.9) / 0.1) continue
    }
    const x = Math.floor(u * cols)
    const y = Math.floor(v * rows)
    if (y < 0 || y >= rows || y === beatRow) continue
    const stop = Math.min(stops - 1, Math.max(0, Math.floor((u + (a - 0.5) * 0.05) * stops)))
    const value = 1 + strength * stops + stop
    const at = y * cols + x
    // The brightest particle in a cell wins.
    if (cells[at] === 0 || value < cells[at]!) cells[at] = value
  }
  const beat = Math.floor(time * 6)
  for (let x = 0; x < cols; x++) if ((x + beat) % 8 < 2) cells[beatRow * cols + x] = JOURNEY_BEAT
}

// ---- The skyline ----

/** Columns of changing height along the foot of the page, in the field's colours. */
export function skylineFrame(cells: Uint8Array, cols: number, rows: number, time: number) {
  for (let x = 0; x < cols; x++) {
    const shape = noise(x * 0.14, time * 0.1) * 0.6 + noise(x * 0.5 + 40, time * 0.16) * 0.4
    const height = Math.max(1, Math.round(rows * clamp01((shape - 0.2) * 1.5 + (hash(x, 8) - 0.5) * 0.5)))
    for (let y = 0; y < rows; y++) {
      const fromFoot = rows - 1 - y
      const heat = noise(x * 0.09 + time * 0.08, y * 0.22) * 1.1 + 0.06 + (hash(x, y) - 0.5) * 0.12
      cells[y * cols + x] = fromFoot < height ? Math.max(1, band(heat)) : 0
    }
  }
}

// ---- Pixel text ----

/** Text rasterised to a strip of on/off cells, `rows` tall. Needs a canvas, so it comes in as a mask. */
export interface TextMask {
  cols: number
  rows: number
  on: Uint8Array
}

/** The strip scrolling sideways, its letters coloured by a slow drift of the field's heat. */
export function marqueeFrame(mask: TextMask, cells: Uint8Array, cols: number, rows: number, time: number, speed: number) {
  const offset = Math.floor(time * speed)
  const top = Math.max(0, Math.floor((rows - mask.rows) / 2))
  cells.fill(0)
  for (let y = 0; y < Math.min(rows, mask.rows); y++) {
    for (let x = 0; x < cols; x++) {
      const at = (x + offset) % mask.cols
      if (!mask.on[y * mask.cols + at]) continue
      const heat = noise(at * 0.035 + time * 0.1, y * 0.09) * 1.15 + 0.03 + (hash(at, y) - 0.5) * 0.08
      cells[(y + top) * cols + x] = Math.max(1, band(heat))
    }
  }
}
