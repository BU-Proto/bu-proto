// The site's ASCII field as plain text, for the text version of an email: a few rows of glyphs
// from the fine ramp whose density rolls in waves, like the field's drift. It's generated, not
// pasted, so every email of a kind opens with the same strip. (The HTML version shows the field
// as a picture of the site's own hero instead; see emailTemplate.ts.)

const RAMP = " .,:;'-~=+<>*xo%#@"

/** Columns to a rib: the density pulses on this beat, as the fluted glass does on the site. */
const RIB = 3

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

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

export interface ArtOptions {
  cols: number
  rows: number
  seed: number
}

/** Rows of glyphs, trailing blanks trimmed. */
export function artTextRows({ cols, rows, seed }: ArtOptions): string[] {
  return Array.from({ length: rows }, (_, j) => {
    const v = rows === 1 ? 0.5 : j / (rows - 1)
    let line = ''
    for (let i = 0; i < cols; i++) {
      const u = i / Math.max(1, cols - 1)
      // Two scales of noise for the waves, a diagonal swell like the hero's light, and the ribs.
      const density =
        0.55 * noise(i * 0.045, j * 0.16, seed) +
        0.3 * noise(i * 0.13, j * 0.42, seed + 3) +
        0.22 * Math.sin(u * 5.2 - v * 1.6 + seed) +
        0.1 * Math.cos((i % RIB) * ((2 * Math.PI) / RIB)) +
        (hash(i, j, seed) - 0.5) * 0.14
      line += RAMP[Math.round(clamp01((density + 0.02) / 0.78) * (RAMP.length - 1))]
    }
    return line.replace(/\s+$/, '')
  })
}

/** A one-row rule that climbs the ramp and falls back, for the text version's dividers. */
export function rampRule(width: number): string {
  const climb = RAMP.slice(1, 10)
  const unit = climb + [...climb].reverse().join('')
  return unit.repeat(Math.ceil(width / unit.length)).slice(0, width)
}
