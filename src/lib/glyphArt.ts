// Static art in the field's own halftone, for the solid grounds around it: the seams where the
// field meets a ground, and a quiet tile of dots for a ground's texture. Drawn to canvas once and
// cached as data URLs.

/** A stable 0–1 value per integer pair, so the art never reshuffles between renders. */
export function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export type EdgeMode = 'dissolve' | 'steps'

/** Which of the four 2×2 pixels a shade fills: ░ one, ▒ two (a checker), ▓ three, █ all. */
const SHADE_PIXELS = [[], [[0, 0]], [[0, 0], [1, 1]], [[0, 0], [1, 1], [1, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]]]

const edgeCache = new Map<string, string>()

/**
 * A halftone dot for cell (x, y) of size `cell`, its area following `v` from 0 to 1, as the
 * field's own dots do. The seams and textures below are drawn in these, not in characters.
 */
function dotAt(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, v: number): void {
  if (v <= 0) return
  ctx.beginPath()
  ctx.arc(x + cell / 2, y + cell / 2, (cell / 2) * 0.94 * Math.sqrt(Math.min(1, v)), 0, Math.PI * 2)
  ctx.fill()
}

/**
 * A strip, as a data URL to repeat across a band's edge, where `color` goes from solid at the
 * bottom to nothing at the top. `dissolve` breaks up into the field's dots; `steps` runs a
 * dithered fade in even rows. Cells are `cell` px, drawn at 2×.
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
        // The far edge: a few loose dots, so the band frays into the field's halftone.
        if (mode === 'dissolve' && hash(j, i) < depth * 0.55) dotAt(ctx, x0, y0, cell, 0.1 + hash(i + 7, j) * 0.35)
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
 * rises under the field row by row, but it leaves dots cut out of it, so the wash drains away and
 * the dots stay lit by the live field behind; then the dots shrink and thin out until only the
 * ground is left. `towards` is the side the solid ground is on. Cells are square, `cell` px,
 * like the field's halftone.
 */
export function drainStrip(color: string, rows = 32, cell = 10, towards: 'top' | 'bottom' = 'bottom', cols = 320): string {
  const key = `${color}|${rows}|${cell}|${towards}|${cols}`
  const cached = drainCache.get(key)
  if (cached) return cached
  if (typeof document === 'undefined') return ''
  const scale = 2
  // Square cells, like the field's halftone.
  const cw = cell
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cols * cw * scale)
  canvas.height = rows * cell * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.scale(scale, scale)
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
    // Then the dots, cut out of the ground so the field shows through them, shrinking as it goes.
    const thin = clamp01((depth - 0.1) / 0.86)
    if (thin >= 1) continue
    ctx.globalCompositeOperation = 'destination-out'
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000'
    for (let i = 0; i < cols; i++) {
      if (hash(i + 3, j * 7) > (1 - thin) ** 0.7 * 1.05) continue
      dotAt(ctx, i * cw, y, cell, clamp01((1 - thin) ** 1.1 + (hash(i, j) - 0.5) * 0.3))
    }
  }
  const url = canvas.toDataURL('image/png')
  drainCache.set(key, url)
  return url
}

const textureCache = new Map<string, string>()

/**
 * A quiet tile of halftone dots for a solid ground: dot size follows slow waves, like the field
 * frozen and turned almost all the way down. Tiles seamlessly; `color` should be faint.
 */
export function glyphTexture(color: string, cols = 96, rows = 40, cell = 10): string {
  const key = `${color}|${cols}|${rows}|${cell}`
  const cached = textureCache.get(key)
  if (cached) return cached
  if (typeof document === 'undefined') return ''
  const scale = 2
  const cw = cell
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cols * cw * scale)
  canvas.height = rows * cell * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.scale(scale, scale)
  ctx.fillStyle = color
  const tau = Math.PI * 2
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      // Whole periods across the tile, so its edges meet.
      const wave =
        0.5 +
        0.28 * Math.sin((i / cols) * tau * 2 + (j / rows) * tau) +
        0.22 * Math.sin((j / rows) * tau * 2 - (i / cols) * tau)
      const v = clamp01(wave * 0.8 + (hash(i, j) - 0.5) * 0.35)
      dotAt(ctx, i * cw, j * cell, cell, v ** 1.6)
    }
  }
  const url = canvas.toDataURL('image/png')
  textureCache.set(key, url)
  return url
}
