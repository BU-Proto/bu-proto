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
  // The underscore: a thin rule down on the baseline, not a block, so it reads as `_`.
  const qx = Math.abs(x) - 0.82
  const qy = Math.abs(y - 0.68) - 0.065
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

/** Split a long name across two lines, at the space nearest its middle. */
function wordLines(word: string): string[] {
  const middle = word.length / 2
  const spaces = [...word.matchAll(/ /g)].map((match) => match.index)
  if (word.length < 9 || spaces.length === 0) return [word]
  const split = spaces.reduce((best, at) => (Math.abs(at - middle) < Math.abs(best - middle) ? at : best))
  return [word.slice(0, split), word.slice(split + 1)]
}

const wordCache = new Map<string, string[]>()

/**
 * A word rasterized into the fine ramp, as rows of text: dense in the letters, with a few loose
 * glyphs around them and the field's fluted-glass ribs running down through it. The default grid
 * fills a 20:13 box, given mono cells 0.6 as wide as they are tall.
 */
export function asciiWord(word: string, cols = 156, rows = 61, aspect = 0.6): string[] {
  const key = `${word}|${cols}|${rows}`
  const cached = wordCache.get(key)
  if (cached) return cached
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas')
  const ctx = canvas?.getContext('2d', { willReadFrequently: true })
  if (!canvas || !ctx) return []
  canvas.width = cols
  canvas.height = rows
  const lines = wordLines(word)
  const font = (size: number) => `600 ${size}px Inter, system-ui, sans-serif`
  ctx.font = font(100)
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width), 1)
  // Canvas pixels are square and the cells aren't, so the letters are drawn squashed to come out true.
  const size = Math.min((100 * cols * 0.88) / widest, (rows * 0.62) / (lines.length * aspect * 1.1))
  ctx.scale(1, aspect)
  ctx.font = font(size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  // A stroke on top, since Inter's 600 goes thin once it's only a few cells wide.
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = size * 0.035
  lines.forEach((line, index) => {
    const y = (rows / aspect) / 2 + (index - (lines.length - 1) / 2) * size * 1.1
    ctx.fillText(line, cols / 2, y)
    ctx.strokeText(line, cols / 2, y)
  })
  const { data } = ctx.getImageData(0, 0, cols, rows)
  const top = FINE_RAMP.length - 1
  const out: string[] = []
  for (let j = 0; j < rows; j++) {
    let line = ''
    for (let i = 0; i < cols; i++) {
      const ink = data[(j * cols + i) * 4 + 3] / 255
      const rib = 0.86 + 0.14 * Math.cos(i * 1.15)
      const grain = (hash(i, j) - 0.5) * 0.2
      const v = ink > 0.25 ? clamp01((0.68 + 0.32 * ink) * rib + grain) : hash(j, i) < 0.05 ? 0.1 : 0
      line += FINE_RAMP[Math.round(v * top)]
    }
    out.push(line)
  }
  wordCache.set(key, out)
  return out
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

const drainCache = new Map<string, string>()

/**
 * Where the field meets a solid ground. Read from the field's side: first the ground's colour
 * rises under the field row by row, but it leaves the field's own characters cut out of it, so
 * the wash drains away and the glyphs stay lit by the live field behind; then the glyphs thin
 * out down the ramp (@ to %, to +, to .) until only the ground is left. `towards` is the side the
 * solid ground is on. Cells are `cell` px tall and one mono advance wide, like the field's.
 */
export function drainStrip(color: string, rows = 32, cell = 10, towards: 'top' | 'bottom' = 'bottom', cols = 320): string {
  const key = `${color}|${rows}|${cell}|${towards}|${cols}`
  const cached = drainCache.get(key)
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
  ctx.textBaseline = 'top'
  ctx.font = `${cell}px ui-monospace, Menlo, Consolas, monospace`
  const top = FINE_RAMP.length - 1
  const width = cols * cw
  for (let j = 0; j < rows; j++) {
    // 0 on the field's side, 1 on the ground's.
    const depth = (j + 0.5) / rows
    const y = (towards === 'bottom' ? j : rows - 1 - j) * cell
    // The wash goes first and is gone by about two thirds of the way.
    const wash = clamp01(depth / 0.66) ** 1.35
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = wash
    ctx.fillStyle = color
    ctx.fillRect(0, y, width, cell)
    // Then the characters, cut out of the ground so the field shows through them.
    const thin = clamp01((depth - 0.1) / 0.86)
    if (thin >= 1) continue
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    for (let i = 0; i < cols; i++) {
      if (hash(i + 3, j * 7) > (1 - thin) ** 0.7 * 1.05) continue
      const v = clamp01((1 - thin) ** 1.1 + (hash(i, j) - 0.5) * 0.3)
      const char = FINE_RAMP[Math.round(v * top)]
      if (char !== ' ') ctx.fillText(char, i * cw, y)
    }
  }
  const url = canvas.toDataURL('image/png')
  drainCache.set(key, url)
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

/**
 * A measure drawn in the fine ramp, as rows of text: a wedge that rises and thickens from left to
 * right, so the low end of a range reads sparse and the high end dense. A thin glow runs above
 * the wedge's slope, like the field's characters thinning out.
 */
export function rampWedge(cols = 96, rows = 8): string[] {
  const top = FINE_RAMP.length - 1
  const lines: string[] = []
  for (let j = 0; j < rows; j++) {
    // 0 at the bottom row, 1 at the top.
    const lift = (rows - 1 - j + 0.5) / rows
    let line = ''
    for (let i = 0; i < cols; i++) {
      const t = i / (cols - 1)
      const height = 0.14 + 0.86 * t
      const grain = (hash(i, j) - 0.5) * 0.3
      const v =
        lift < height
          ? clamp01(0.22 + 0.78 * t + grain)
          : lift - height < 0.16 && hash(j, i) < 0.5
            ? clamp01(0.12 + grain * 0.5)
            : 0
      line += FINE_RAMP[Math.round(v * top)]
    }
    lines.push(line)
  }
  return lines
}

/**
 * One week of the landing's rhythm, as a column of the fine ramp: `height` of `rows` lit from the
 * bottom at `weight` (0–1, how big the night is), with a ragged top that thins out like the
 * field's characters. `seed` keeps each week's grain its own and the same on every render.
 */
export function rhythmColumn(height: number, weight: number, rows: number, cols = 6, seed = 0): string[] {
  const top = FINE_RAMP.length - 1
  const lines: string[] = []
  for (let j = 0; j < rows; j++) {
    // 0 at the bottom row, counting up.
    const lift = rows - 1 - j
    let line = ''
    for (let i = 0; i < cols; i++) {
      const grain = hash(i + seed * 13, j) - 0.5
      let v = 0
      if (lift < height - 1) v = weight * (0.9 + 0.1 * Math.cos(i * 1.3)) + grain * 0.18
      // The top row of a column frays, and a loose glyph or two floats above it.
      else if (lift === height - 1) v = hash(j, i + seed) < 0.75 ? weight * 0.7 + grain * 0.2 : 0
      else if (lift === height && hash(i + seed, j + 5) < 0.3) v = 0.12
      line += FINE_RAMP[Math.round(clamp01(v) * top)]
    }
    lines.push(line)
  }
  return lines
}
