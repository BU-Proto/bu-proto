// The site's ASCII field, redrawn for email: a grid of glyphs from the fine ramp, tinted along the
// hero gradient over navy, with the fluted-glass ribs in the glyphs' colour. It's
// generated, not pasted, so every email of a kind gets the same art and the HTML stays small:
// colour is held per rib (three columns), so a row is a few dozen <font> runs, not one per glyph.

const RAMP = " .,:;'-~=+<>*xo%#@"

/** GRADIENT_COLORMAP sampled at nine points across its top, middle and bottom rows. */
const STOPS = [
  ['0576ad', '0287ba', '0393c3', '0b9dca', '4aa7c6', '71a3c2', '66afc9', '57abc8', '44a7c7'],
  ['0483b5', '3792be', '8d8bb5', 'dc98a2', 'd76881', 'aa729d', '689ec1', '2aa8ce', '00a2ce'],
  ['0884b3', '3595bc', '83a2b9', '8c9dba', '4192c1', '9790b9', 'c4aeb7', 'cfbaba', 'cbc2c0'],
].map((row) => row.map((hex) => [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16))))

const WHITE = [255, 255, 255]
const RIB = 3

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a: number[], b: number[], t: number) => a.map((value, k) => value + (b[k] - value) * t)
const hex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

/** Bilinear sample of the stops at (u, v), both 0–1. */
function gradient(u: number, v: number): number[] {
  const x = clamp01(u) * 8
  const y = clamp01(v) * 2
  const i = Math.min(7, Math.floor(x))
  const j = Math.min(1, Math.floor(y))
  const top = mix(STOPS[j][i], STOPS[j][i + 1], x - i)
  const bottom = mix(STOPS[j + 1][i], STOPS[j + 1][i + 1], x - i)
  return mix(top, bottom, y - j)
}

/** A stable 0–1 value per integer pair and seed. */
function hash(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return s - Math.floor(s)
}

/** Smooth value noise, so the density rolls in waves like the site's drift. */
function noise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const top = hash(xi, yi, seed) + (hash(xi + 1, yi, seed) - hash(xi, yi, seed)) * sx
  const bottom = hash(xi, yi + 1, seed) + (hash(xi + 1, yi + 1, seed) - hash(xi, yi + 1, seed)) * sx
  return top + (bottom - top) * sy
}

interface Cell {
  glyph: string
  /** Null for a blank, which can join any run. */
  color: string | null
}

export interface ArtOptions {
  cols: number
  rows: number
  seed: number
  /** Where on the gradient the art sits, top and bottom (0 is the colormap's top row). */
  band?: [number, number]
  /** Thin the field toward the bottom so it dissolves into what's below. */
  fadeBottom?: boolean
  /** Thin the field toward the top. */
  fadeTop?: boolean
}

function artCells(options: ArtOptions): Cell[][] {
  const { cols, rows, seed } = options
  const [bandTop, bandBottom] = options.band ?? [0.3, 0.75]
  const grid: Cell[][] = []
  for (let j = 0; j < rows; j++) {
    const v = rows === 1 ? 0.5 : j / (rows - 1)
    const line: Cell[] = []
    for (let i = 0; i < cols; i++) {
      const u = i / Math.max(1, cols - 1)
      const rib = Math.floor(i / RIB)
      // Two scales of noise for the waves, a diagonal swell like the hero's light, and the ribs.
      let d =
        0.55 * noise(i * 0.045, j * 0.16, seed) +
        0.3 * noise(i * 0.13, j * 0.42, seed + 3) +
        0.22 * Math.sin(u * 5.2 - v * 1.6 + seed) +
        0.1 * Math.cos((i % RIB) * ((2 * Math.PI) / RIB))
      if (options.fadeBottom) d -= 0.75 * Math.pow(v, 2.4)
      if (options.fadeTop) d -= 0.75 * Math.pow(1 - v, 2.4)
      d += (hash(i, j, seed) - 0.5) * 0.14
      const level = clamp01((d + 0.02) / 0.78)
      const glyph = RAMP[Math.round(level * (RAMP.length - 1))]
      if (glyph === ' ') {
        line.push({ glyph, color: null })
        continue
      }
      // Colour is held for a whole rib, alternately lifted toward white: the fluted glass.
      const ribU = (rib * RIB + RIB / 2) / cols
      const base = gradient(ribU, bandTop + (bandBottom - bandTop) * v)
      const lift = rib % 2 ? 0.5 : 0.38
      const shade = mix(base, WHITE, lift)
      line.push({ glyph, color: hex(shade) })
    }
    grid.push(line)
  }
  return grid
}

/**
 * The ground under the glyphs: the site's gradient across the band. (The site's fluted ribs read
 * as barcode stripes at email size, so they're left out.) Clients that drop background images
 * show the navy bgcolor.
 */
export function artGround(band: [number, number]): string {
  const v = (band[0] + band[1]) / 2
  const stops = Array.from({ length: 9 }, (_, k) => `${hex(gradient(k / 8, v))} ${k * 12.5}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

const escapeGlyph = (glyph: string) => (glyph === '<' ? '&lt;' : glyph === '>' ? '&gt;' : glyph === '&' ? '&amp;' : glyph)

/** Rows of HTML, each a run of <font color> groups; blanks ride along in whatever run they're in. */
export function artHtmlRows(options: ArtOptions): string[] {
  return artCells(options).map((line) => {
    let html = ''
    let run = ''
    let color: string | null = null
    const flush = () => {
      if (!run) return
      html += color ? `<font color="${color}">${run}</font>` : run
      run = ''
    }
    for (const cell of line) {
      if (cell.color && cell.color !== color) {
        flush()
        color = cell.color
      }
      run += escapeGlyph(cell.glyph)
    }
    flush()
    return html
  })
}

/** The same art as plain text, for the text version of an email. */
export function artTextRows(options: ArtOptions): string[] {
  return artCells(options).map((line) => line.map((cell) => cell.glyph).join('').replace(/\s+$/, ''))
}

/** A one-row rule that climbs the ramp and falls back, for the text version's dividers. */
export function rampRule(width: number): string {
  const climb = RAMP.slice(1, 10)
  const unit = climb + [...climb].reverse().join('')
  return unit.repeat(Math.ceil(width / unit.length)).slice(0, width)
}
