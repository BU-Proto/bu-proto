// Static glyph art drawn from the field's own vocabulary: its fine ramp for shapes, and the
// ░▒▓█ shades (as real 2px dithers, so no font has to carry the block characters) for edges.

/** The field's fine ramp, empty to dense. */
export const FINE_RAMP = " .,:;'-~=+<>*xo%#@"

/** A stable 0–1 value per integer pair, so the art never reshuffles between renders. */
export function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export type FigureShape = 'ring' | 'chevron' | 'bar'

/** Distance from (x, y) to the segment a–b. */
function segment(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
  const px = x - ax
  const py = y - ay
  const dx = bx - ax
  const dy = by - ay
  const t = clamp01((px * dx + py * dy) / (dx * dx + dy * dy))
  return Math.hypot(px - dx * t, py - dy * t)
}

/** Signed distance to the trail's three glyphs, drawn in a -1..1 square. */
function shapeDistance(shape: FigureShape, x: number, y: number): number {
  if (shape === 'ring') return Math.abs(Math.hypot(x, y) - 0.64) - 0.2
  if (shape === 'chevron') {
    return Math.min(segment(x, y, -0.42, -0.72, 0.42, 0), segment(x, y, 0.42, 0, -0.42, 0.72)) - 0.18
  }
  const qx = Math.abs(x) - 0.8
  const qy = Math.abs(y - 0.5) - 0.2
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0)
}

/**
 * One of the trail's glyphs (○ > _) rendered large in the fine ramp, as rows of text: dense in
 * the stroke, a sparse glow around it, and the field's fluted-glass ribs running down through it.
 * Mono cells are about 0.6 as wide as they are tall, so the grid has more columns than rows.
 */
export function asciiFigure(shape: FigureShape, rows = 22, aspect = 0.6): string[] {
  const cols = Math.round(rows / aspect)
  const top = FINE_RAMP.length - 1
  const lines: string[] = []
  for (let j = 0; j < rows; j++) {
    let line = ''
    for (let i = 0; i < cols; i++) {
      const x = ((i + 0.5) / cols) * 2 - 1
      const y = ((j + 0.5) / rows) * 2 - 1
      const d = shapeDistance(shape, x, y)
      // Inside: denser toward the stroke's middle. Outside: a glow that thins out fast.
      const body = d < 0 ? 0.8 + clamp01(-d / 0.1) * 0.2 : Math.max(0, 0.55 - d * 2.2)
      const rib = 0.86 + 0.14 * Math.cos(i * 1.15)
      const grain = (hash(i, j) - 0.5) * 0.22
      const v = clamp01(body * rib + (body > 0.02 ? grain : 0))
      line += FINE_RAMP[Math.round(v * top)]
    }
    lines.push(line)
  }
  return lines
}

export type EdgeMode = 'dissolve' | 'steps'

/** Which of the four 2×2 pixels a shade fills: ░ one, ▒ two (a checker), ▓ three, █ all. */
const SHADE_PIXELS = [[], [[0, 0]], [[0, 0], [1, 1]], [[0, 0], [1, 1], [1, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]]]

const edgeCache = new Map<string, string>()

/**
 * A strip, as a data URL to repeat across a band's edge, where `color` goes from solid at the
 * bottom to nothing at the top. `dissolve` breaks up like the field's glyphs; `steps` runs the
 * ░▒▓ shades in even rows, like an old terminal gradient. Cells are `cell` px, drawn at 2×.
 */
export function edgeStrip(color: string, mode: EdgeMode, rows = 10, cell = 8, cols = 180): string {
  const key = `${color}|${mode}|${rows}|${cell}|${cols}`
  const cached = edgeCache.get(key)
  if (cached) return cached
  if (typeof document === 'undefined') return ''
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = cols * cell * scale
  canvas.height = rows * cell * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.scale(scale, scale)
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  ctx.font = `${cell + 1}px ui-monospace, Menlo, Consolas, monospace`
  const dot = cell / 4
  for (let j = 0; j < rows; j++) {
    // 0 at the top row, 1 at the bottom.
    const depth = (j + 1) / rows
    for (let i = 0; i < cols; i++) {
      const level =
        mode === 'steps'
          ? Math.min(4, Math.floor(depth * 5))
          : Math.round(clamp01(depth ** 1.5 + (hash(i, j) - 0.5) * 0.7) * 4)
      const x0 = i * cell
      const y0 = j * cell
      if (level === 0) {
        // The far edge: a few loose glyphs, so the band frays into the field's characters.
        if (mode === 'dissolve' && hash(j, i) < depth * 0.55) {
          ctx.fillText(FINE_RAMP[1 + Math.floor(hash(i + 7, j) * 8)], x0, y0 - 1)
        }
        continue
      }
      if (level === 4) {
        ctx.fillRect(x0, y0, cell, cell)
        continue
      }
      // Each 2×2 block of dots inside the cell takes the shade's pattern.
      for (let by = 0; by < 2; by++) {
        for (let bx = 0; bx < 2; bx++) {
          for (const [px, py] of SHADE_PIXELS[level]) {
            ctx.fillRect(x0 + (bx * 2 + px) * dot, y0 + (by * 2 + py) * dot, dot, dot)
          }
        }
      }
    }
  }
  const url = canvas.toDataURL('image/png')
  edgeCache.set(key, url)
  return url
}

const textureCache = new Map<string, string>()

/**
 * A quiet tile of the fine ramp for a solid ground: glyph density follows slow waves, like the
 * field frozen and turned almost all the way down. Tiles seamlessly; `color` should be faint.
 */
export function glyphTexture(color: string, cols = 96, rows = 40, cell = 10): string {
  const key = `${color}|${cols}|${rows}|${cell}`
  const cached = textureCache.get(key)
  if (cached) return cached
  if (typeof document === 'undefined') return ''
  const scale = 2
  const cw = cell * 0.62
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cols * cw * scale)
  canvas.height = rows * cell * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.scale(scale, scale)
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  ctx.font = `${cell}px ui-monospace, Menlo, Consolas, monospace`
  const top = FINE_RAMP.length - 1
  const tau = Math.PI * 2
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      // Whole periods across the tile, so its edges meet.
      const wave =
        0.5 +
        0.28 * Math.sin((i / cols) * tau * 2 + (j / rows) * tau) +
        0.22 * Math.sin((j / rows) * tau * 2 - (i / cols) * tau)
      const v = clamp01(wave * 0.8 + (hash(i, j) - 0.5) * 0.35)
      const char = FINE_RAMP[Math.round(v * top)]
      if (char !== ' ') ctx.fillText(char, i * cw, j * cell)
    }
  }
  const url = canvas.toDataURL('image/png')
  textureCache.set(key, url)
  return url
}
