// The seam where the hero's light gives way to the page, after contentarchitecture.dev's: a band of
// text cells across the fold. Above a wandering line the cells let the light behind show through;
// below it they're the page's black. Near the line, cells flip to the other side, so the edge breaks
// up into a skyline of solid cells, most of them carrying a letter of the phrase in the colour they
// left; and letters scatter about it as dust, brighter the nearer the line they fall. Scrolling moves
// the line and reshapes it a row at a time, and every so often a few cells by it re-roll, so the edge
// never quite sits still.
//
// A 2D canvas that only redraws the cells that change.

/** A row's height in CSS px, a column's width against it, and the letters' size in CSS px. */
const ROW_CSS = 14
const COLUMN = 0.55
const FONT_CSS = 10.36
/** What the cells spell, row after row, each row starting somewhere of its own. */
const PHRASE =
  'BU PROTO · HACK NIGHT · BUILD · SHIP · DEMO NIGHT · HACKATHONS · GRANTS · WINS · EVENTS · REPEAT · THE HOME BASE FOR BUILDING THINGS AT BU · '
/** The line's wander, coarse to fine: [frequency a column, reach as a share of the rows]. */
const WANDER = [
  [0.045, 0.07],
  [0.12, 0.04],
  [0.33, 0.02],
] as const
/** How far the line travels each way while the seam crosses the screen, as a share of the rows. */
const TRAVEL = 0.26
/** The rows at the band's top and bottom that stay plain, so it meets what's either side, as a share. */
const TAPER = 0.14
/** How many cells flip, and how far from the line they can, as a share of the rows. */
const FLIPS = 0.4
const FLIP_REACH = 0.085
/** The same for the dust, and the share of flipped cells that carry a letter. */
const DUST = 0.62
const DUST_REACH = 0.1
const LETTERED = 0.82
/** Each re-roll: how many cells, picked from how far either side of the line, as a share of the rows. */
const GLITCHES = 12
const GLITCH_SPAN = 0.4
const MAX_DPR = 2
/**
 * Seeds for the noise behind the flips, the dust and the line. Any seeds make the same kind of seam;
 * these draw one as busy as contentarchitecture.dev's, measured frame by frame across a scroll: about
 * 150 flipped cells and 490 dusted at a time, and a line as rough, on a 168-column band.
 */
const FLIP_SEED = 47
const DUST_SEED = 208
const LINE_SEED = 46

/**
 * The light's colour where it's a solid cell: the rings' own full blocks of the bloom's deep and sky
 * blues (see ringField), drifting across the band, so a flipped cell is the same light as the pool.
 */
const LIGHT_A = [85, 131, 159]
const LIGHT_B = [86, 154, 174]

/** What shows behind a cell: the light behind the band, the page's black, or a solid cell of light. */
const SHOWS_LIGHT = 0
const BLACK = 1
const LIT = 2
/** What's written in a cell: nothing, its letter at full strength, or its letter as dust. */
const LETTER = 1
const DUSTED = 2

function hash(a: number, b: number, c: number) {
  let h = Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x9e3779b1)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const ease = (t: number) => t * t * (3 - 2 * t)
const smoothstep = (from: number, to: number, x: number) => ease(Math.min(1, Math.max(0, (x - from) / (to - from))))

function noise1(x: number, seed: number) {
  const i = Math.floor(x)
  const a = hash(i, 0, seed)
  return a + (hash(i + 1, 0, seed) - a) * ease(x - i)
}

function noise2(x: number, y: number, seed: number) {
  const i = Math.floor(x)
  const j = Math.floor(y)
  const fx = ease(x - i)
  const top = hash(i, j, seed) + (hash(i + 1, j, seed) - hash(i, j, seed)) * fx
  const bottom = hash(i, j + 1, seed) + (hash(i + 1, j + 1, seed) - hash(i, j + 1, seed)) * fx
  return top + (bottom - top) * ease(y - j)
}

/** How far from the line a cell still reacts: none above the threshold, further the further below. */
const reach = (value: number, threshold: number, scale: number) => (value < threshold ? -scale * Math.log(value / threshold) : -1)

export interface GlyphSeam {
  /** The band's size in CSS px, and how far it has crossed the screen (0 to 1) to draw it at. */
  resize(width: number, height: number, crossed: number): void
  /** How far the band has crossed the screen: 0 as its top comes up, 1 as its bottom leaves. */
  scrolled(crossed: number): void
  /** Boxes, in CSS px from the band's top left, where the cells stay plain: the hero's words. */
  keepClear(boxes: readonly DOMRect[]): void
  /** Re-rolls a few cells by the line. */
  glitch(): void
}

export function createGlyphSeam(canvas: HTMLCanvasElement): GlyphSeam | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const seam = {
    dpr: 1, cols: 0, rows: 0, cellH: 1, step: 0,
    xs: new Int32Array(1),
    light: [] as string[],
    ink: [] as string[],
    /** The distances from the line within which each cell flips, or turns to dust, or brightens. */
    flip: new Float32Array(0),
    dust: new Float32Array(0),
    levels: [0, 0, 0, 0],
    lettered: new Uint8Array(0),
    letter: new Uint16Array(0),
    phase: new Uint8Array(0),
    plain: new Uint8Array(0),
    drawn: new Int16Array(0),
  }

  const settle = (col: number, row: number) => {
    const { rows, cols } = seam
    const i = row * cols + col
    const phase = seam.phase[i]
    const taper = smoothstep(0, TAPER * rows, Math.min(row, rows - 1 - row))
    const flipNoise = 0.86 * noise2(0.09 * col, 0.8 * row, FLIP_SEED) + 0.14 * hash(col, row, FLIP_SEED + 1 + phase)
    const dustNoise = 0.8 * noise2(0.2 * col, row, DUST_SEED) + 0.2 * hash(col, row, DUST_SEED + 1 + phase)
    const letter = (col + Math.floor(hash(row, 0, 5) * PHRASE.length) + 7 * phase) % PHRASE.length
    const blank = PHRASE[letter] === ' '
    seam.flip[i] = reach(1 - flipNoise, FLIPS * taper, FLIP_REACH * rows)
    seam.dust[i] = blank ? -1 : reach(dustNoise, DUST * taper, DUST_REACH * rows)
    seam.lettered[i] = !blank && hash(col, row, 8) < LETTERED ? 1 : 0
    seam.letter[i] = letter
  }

  /** Where the line crosses a column, in rows from the band's top. */
  const lineAt = (col: number) => {
    const { rows, step } = seam
    let line = rows / 2 + step / 2
    WANDER.forEach(([frequency, spread], octave) => {
      line += (noise1(col * frequency + 0.045 * step * octave, LINE_SEED + octave) - 0.5) * 2 * spread * rows
    })
    return Math.min(Math.max(line, TAPER * rows), (1 - TAPER) * rows)
  }

  /** A cell's look, packed: what shows behind it, what's written in it, and how bright its dust is. */
  const lookOf = (col: number, row: number, line: number) => {
    const i = row * seam.cols + col
    const away = Math.abs(row + 0.5 - line)
    const above = row + 0.5 < line
    if (seam.plain[i]) return above ? SHOWS_LIGHT : BLACK
    const flipped = away < seam.flip[i]
    const light = flipped ? !above : above
    let written = 0
    let level = 0
    if (flipped) written = seam.lettered[i] ? LETTER : 0
    else if (away < seam.dust[i]) {
      written = DUSTED
      while (level < 4 && away < seam.levels[level]) level++
    }
    const ground = light ? (above ? SHOWS_LIGHT : LIT) : BLACK
    return ground | (written << 2) | (level << 4)
  }

  const paint = (col: number, row: number, look: number) => {
    const x = seam.xs[col]
    const width = seam.xs[col + 1] - x
    const y = row * seam.cellH
    const ground = look & 3
    const written = (look >> 2) & 3
    ctx.globalAlpha = 1
    if (ground === SHOWS_LIGHT) ctx.clearRect(x, y, width, seam.cellH)
    else {
      ctx.fillStyle = ground === BLACK ? '#000' : seam.light[col]
      ctx.fillRect(x, y, width, seam.cellH)
    }
    if (!written) return
    ctx.globalAlpha = written === DUSTED ? 0.28 + (((look >> 4) & 7) / 4) * 0.72 : 1
    // A letter takes the colour of the side its cell isn't: light on the black, black on the light.
    ctx.fillStyle = ground === BLACK ? seam.ink[col] : '#000'
    ctx.fillText(PHRASE[seam.letter[row * seam.cols + col]], x + width / 2, y + 0.58 * seam.cellH)
  }

  const paintAll = () => {
    const { cols, rows } = seam
    for (let col = 0; col < cols; col++) {
      const line = lineAt(col)
      for (let row = 0; row < rows; row++) {
        const look = lookOf(col, row, line)
        const i = row * cols + col
        if (look === seam.drawn[i]) continue
        seam.drawn[i] = look
        paint(col, row, look)
      }
    }
  }

  const stepFor = (crossed: number) => Math.round((0.5 - crossed) * TRAVEL * 2 * seam.rows)

  return {
    resize(width, height, crossed) {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const cellH = Math.max(1, Math.round(ROW_CSS * dpr))
      const cols = Math.max(8, Math.round(width / (ROW_CSS * COLUMN)))
      const rows = Math.max(1, Math.ceil((height * dpr) / cellH))
      Object.assign(seam, { dpr, cellH, cols, rows })
      seam.xs = Int32Array.from({ length: cols + 1 }, (_, col) => Math.round((col * width * dpr) / cols))
      const cells = cols * rows
      seam.flip = new Float32Array(cells)
      seam.dust = new Float32Array(cells)
      seam.lettered = new Uint8Array(cells)
      seam.letter = new Uint16Array(cells)
      seam.phase = new Uint8Array(cells)
      seam.plain = new Uint8Array(cells)
      seam.drawn = new Int16Array(cells).fill(-1)
      // Dust brightens in four steps toward the line.
      seam.levels = [0, 1, 2, 3].map((level) => -0.1 * rows * Math.log(((level + 0.5) / 4) ** (1 / 0.7)))
      seam.light = []
      seam.ink = []
      for (let col = 0; col < cols; col++) {
        const t = noise1(col * 0.03, 21)
        const [r, g, b] = LIGHT_A.map((value, k) => Math.round(value + (LIGHT_B[k] - value) * t))
        seam.light.push(`rgb(${r} ${g} ${b})`)
        // On the black, letters are paler, as the old hero's brightest blocks were.
        seam.ink.push(`rgb(${Math.round(r + (235 - r) * 0.45)} ${Math.round(g + (245 - g) * 0.45)} ${Math.round(b + (250 - b) * 0.45)})`)
      }
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) settle(col, row)

      canvas.width = Math.round(width * dpr)
      canvas.height = rows * cellH
      canvas.style.width = `${width}px`
      canvas.style.height = `${canvas.height / dpr}px`
      const face = getComputedStyle(document.documentElement).getPropertyValue('--font-art').trim() || 'ui-monospace, monospace'
      ctx.font = `500 ${Math.floor(FONT_CSS * dpr)}px ${face}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      seam.step = stepFor(crossed)
      paintAll()
    },
    scrolled(crossed) {
      if (!seam.rows) return
      const step = stepFor(crossed)
      if (step === seam.step) return
      seam.step = step
      paintAll()
    },
    keepClear(boxes) {
      if (!seam.rows) return
      const { cols, rows, xs, cellH, dpr } = seam
      seam.plain.fill(0)
      const margin = 10
      for (const box of boxes) {
        for (let row = 0; row < rows; row++) {
          const top = (row * cellH) / dpr
          if (top + cellH / dpr < box.top - margin || top > box.bottom + margin) continue
          for (let col = 0; col < cols; col++) {
            const left = xs[col] / dpr
            if (left + (xs[col + 1] - xs[col]) / dpr < box.left - margin || left > box.right + margin) continue
            seam.plain[row * cols + col] = 1
          }
        }
      }
      paintAll()
    },
    glitch() {
      const { cols, rows } = seam
      if (!rows) return
      for (let n = 0; n < GLITCHES; n++) {
        const col = Math.floor(Math.random() * cols)
        const line = lineAt(col)
        const row = Math.round(line + (Math.random() - 0.5) * rows * GLITCH_SPAN)
        if (row < 0 || row >= rows) continue
        const i = row * cols + col
        seam.phase[i] = (seam.phase[i] + 1) % 251
        settle(col, row)
        const look = lookOf(col, row, line)
        seam.drawn[i] = look
        paint(col, row, look)
      }
    },
  }
}
