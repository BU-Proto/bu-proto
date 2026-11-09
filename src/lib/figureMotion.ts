// The trail's three glyphs (○ > _), drawn big in the fine ramp and kept moving: the live figures
// at the foot of the three ways in. glyphArt draws them still; this is the same idea in time, with
// each stroke stopping 0.84 from the centre so all three stand on one baseline.

import { FINE_RAMP, hash, type FigureShape } from './glyphArt'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Distance from (x, y) to the segment a–b. */
function segment(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const px = x - ax
  const py = y - ay
  const dx = bx - ax
  const dy = by - ay
  const t = clamp01((px * dx + py * dy) / (dx * dx + dy * dy))
  return Math.hypot(px - dx * t, py - dy * t)
}

/** Signed distance to a glyph in a -1..1 square. The ring and the rule come out the same width. */
function shapeDistance(shape: FigureShape, x: number, y: number): number {
  if (shape === 'ring') return Math.abs(Math.hypot(x, y) - 0.64) - 0.2
  if (shape === 'chevron') {
    return Math.min(segment(x, y, -0.42, -0.66, 0.42, 0), segment(x, y, 0.42, 0, -0.42, 0.66)) - 0.18
  }
  // The underscore: a thin rule down on the baseline, not a block, so it reads as `_`.
  const qx = Math.abs(x) - 0.84
  const qy = Math.abs(y - 0.775) - 0.065
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)
}

/**
 * A figure at a moment in time, as one string. Each shape moves the way its glyph means: the ring
 * breathes with light orbiting it, the chevron pushes forward in pulses, the underscore blinks like
 * a cursor with a glint running along it. The grid never changes, so only the characters do.
 */
export function asciiFigureAt(shape: FigureShape, time: number, rows = 22, aspect = 0.6): string {
  const cols = Math.round(rows / aspect)
  const top = FINE_RAMP.length - 1
  let out = ''
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let x = ((i + 0.5) / cols) * 2 - 1
      let y = ((j + 0.5) / rows) * 2 - 1
      let light: number
      if (shape === 'ring') {
        const breath = 1 + 0.045 * Math.sin(time * 0.9)
        x /= breath
        y /= breath
        light = 0.5 + 0.5 * Math.cos(Math.atan2(y, x) - time * 0.8)
      } else if (shape === 'chevron') {
        x -= 0.07 * Math.sin(time * 1.1)
        light = 0.5 + 0.5 * Math.sin(x * 3.6 - y * 0.8 - time * 2.2)
      } else {
        light = Math.exp(-(((x - Math.sin(time * 0.7) * 0.9) / 0.4) ** 2))
      }
      const d = shapeDistance(shape, x, y)
      const body = d < 0 ? 0.62 + clamp01(-d / 0.1) * 0.2 : Math.max(0, 0.46 - d * 2.2)
      const blink = shape === 'bar' ? 0.72 + 0.28 * Math.sin(time * 2.4) ** 2 : 1
      const rib = 0.86 + 0.14 * Math.cos(i * 1.15 + time * 0.4)
      // Each cell also breathes on its own clock, so the surface is never quite still.
      const grain = (hash(i, j) - 0.5) * 0.2 * (0.6 + 0.4 * Math.sin(time * 1.4 + hash(j, i) * 6.28))
      const lit = body * blink * (0.72 + 0.46 * light)
      out += FINE_RAMP[Math.round(clamp01(lit * rib + (body > 0.02 ? grain : 0)) * top)]
    }
    if (j < rows - 1) out += '\n'
  }
  return out
}

/**
 * A figure part way to resolved: unsettled cells show a faint, shifting glyph instead. Cells settle
 * from the left with a ragged front, like the field drying into a shape, and a cell that ends up
 * empty stays empty, so the outline holds while it develops.
 */
export function developing(figure: string, progress: number, frame: number): string {
  return figure
    .split('\n')
    .map((line, j) => {
      let out = ''
      for (let i = 0; i < line.length; i++) {
        const settleAt = (i / line.length) * 0.6 + hash(i, j) * 0.4
        const blank = line[i] === ' '
        out += blank || progress >= settleAt ? line[i] : hash(i + frame, j) < 0.3 ? FINE_RAMP[1 + ((i + j + frame) % 6)] : ' '
      }
      return out
    })
    .join('\n')
}
