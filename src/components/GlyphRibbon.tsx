import { useEffect, useRef } from 'react'
import { FINE_RAMP, hash } from '../lib/glyphArt'
import { onFrame } from '../lib/smoothScroll'
import { reducedMotion } from '../lib/useInView'
import styles from './GlyphRibbon.module.css'

const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace'
/** The heavier of the two weights the site loads: at this size the regular is too thin to hold a tone. */
const WEIGHT = 500

/** A cell is this share of the element's width tall, held between the two sizes (CSS px). */
const CELL_DIVISOR = 190
const CELL_MIN = 7
const CELL_MAX = 10
/** A cell's width over its height: JetBrains Mono's advance, as in the site's other glyph art. */
const CELL_ASPECT = 0.62
/** Centre to rim is never fewer cell heights than this, or on a phone the tube would be a line. */
const MIN_RADIUS_CELLS = 1.5
/** The gap an over-strand keeps clear around itself where it crosses the curve, in cell heights. */
const MOAT_CELLS = 0.9
/** Distance between samples along the curve, in cell widths. */
const SAMPLE_STEP = 0.5

/** Where the light comes from: up and to the left, and out of the screen toward the viewer. */
const LIGHT = normalize(-0.22, -0.3, 0.93)
/** Halfway between the light and the eye, for the glossy streak. */
const HALF = normalize(LIGHT[0], LIGHT[1], LIGHT[2] + 1)
/** Light on the side turned away, so the far rim still has an edge. */
const AMBIENT = 0.26
/** How dark the surface gets as it turns away at either rim: what makes the band read as round. */
const RIM_SHADE = 0.25
/** How tight the streak is (higher is narrower) and how much it adds. */
const SPECULAR_POWER = 26
const SPECULAR = 0.3
/** Per-cell grain in the glyph choice, so the bands across the tube don't read as stripes. */
const GRAIN = 0.06
/** The sparsest character the tube uses (an index into the ramp): below this a rim cell is dust. */
const GLYPH_FLOOR = 6
/** A faint fill of the hue under each character, so the tube holds together between glyphs. 0 for none. */
const WASH = 0.36
/** How far back from its leading edge the moving head rounds off into shade, in radii. */
const HEAD_DOME = 1
/** Opacity at the dimmest cell and at the highlight. */
const RIM_ALPHA = 0.35
const PEAK_ALPHA = 0.9
/** How far the streak's colour lifts from the hue toward frost. */
const FROST_LIFT = 0.5

/** Share of the remaining distance the head covers per 60Hz frame. */
const EASE = 0.12
/** How far outside the viewport the ribbon still counts as on screen. */
const ROOT_MARGIN = '50% 0px 50% 0px'
/** Past this many canvas pixels the resolution drops instead. */
const MAX_PIXELS = 6_000_000
/** How long the first draw waits for the font before going ahead in the fallback. */
const FONT_WAIT_MS = 1500

const RAMP_TOP = FINE_RAMP.length - 1
const TONES = 24
const STREAKS = 4

/** A colour as r, g, b, or a direction as x, y, z. */
type Triple = readonly [number, number, number]

export interface GlyphRibbonProps {
  /** SVG path data in the coordinate space of `box`. */
  path: string
  /** The path's coordinate space, [width, height]. x maps 0..width onto the element's full width; y uses the same scale (uniform), from the element's top. */
  box: readonly [number, number]
  /** sky | iris | rose: the site's three hues. */
  hue: 'sky' | 'iris' | 'rose'
  /** Tube thickness in `box` units (same scale as the path). */
  thickness: number
  /** Viewport line the drawing follows, as a fraction of viewport height (default 0.72): the ribbon starts as the curve's top rises past that line and is whole once its bottom has, evenly in between. */
  lead?: number
  className?: string
}

/**
 * Everything about one size of the ribbon, worked out once: a list of cells in the order the
 * head reaches them, each with how it's lit. Where the curve crosses itself a grid position has
 * two entries, and the later one points at the one it covers.
 */
interface Ribbon {
  /** Canvas position and size inside the element, in CSS pixels. */
  left: number
  top: number
  width: number
  height: number
  dpr: number
  cell: number
  /** Device-pixel edges of each column and row, so cells tile without gaps or overlap. */
  xs: Int32Array
  ys: Int32Array
  cols: number
  /** The curve's top and height inside the element: the stretch of scroll the drawing covers. */
  yMin: number
  ySpan: number
  count: number
  /** How far behind its leading edge the moving head is still shaded as a dome, in pixels. */
  soft: number
  /** How far the head travels from nothing drawn to everything drawn, in pixels. */
  span: number
  /** Ascending: an entry shows once the head has travelled this many pixels. */
  keys: Float32Array
  cells: Int32Array
  /** How lit the cell is, 0..1; below 0 it's the blank moat round an over-strand. */
  lits: Float32Array
  /** How much of the glossy streak falls on it, 0..1. */
  streaks: Float32Array
  /** The cell's own nudge up or down the ramp. */
  grains: Float32Array
  /** The entry this one covers, or -1. */
  under: Int32Array
  palette: string[]
  washes: string[]
}

function normalize(x: number, y: number, z: number): Triple {
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

const clamp = (v: number, low: number, high: number) => (v < low ? low : v > high ? high : v)

/** How much light is left where the surface faces `z` toward the viewer: 1 face on, RIM_SHADE edge on. */
const rimShade = (z: number) => RIM_SHADE + (1 - RIM_SHADE) * z

const mix = (a: Triple, b: Triple, t: number): Triple => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** A space-separated "r g b" custom property off the element, so the palette stays in CSS. */
function cssTriple(style: CSSStyleDeclaration, name: string, fallback: Triple): Triple {
  const parts = style.getPropertyValue(name).trim().split(/[\s,]+/).map(Number)
  return parts.length === 3 && parts.every(Number.isFinite) ? [parts[0]!, parts[1]!, parts[2]!] : fallback
}

const rgba = ([r, g, b]: Triple, alpha: number) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha.toFixed(3)})`

/**
 * One glyph colour per tone and streak level (deep hue in the shade, the light hue lit, frost in
 * the streak) and one wash per tone.
 */
function buildPalette(root: HTMLElement) {
  const style = getComputedStyle(root)
  const frost = cssTriple(style, '--frost-rgb', [246, 251, 255])
  const light = cssTriple(style, '--hue-rgb', frost)
  const deep = cssTriple(style, '--hue-deep-rgb', light)
  const palette: string[] = []
  const washes: string[] = []
  for (let tone = 0; tone < TONES; tone++) {
    const lit = tone / (TONES - 1)
    // The hue turns from deep to light a little before the brightness peaks.
    const base = mix(deep, light, clamp((lit - 0.1) / 0.55, 0, 1))
    const alpha = RIM_ALPHA + (PEAK_ALPHA - RIM_ALPHA) * lit
    // Strongest under the highlight and next to nothing at the rims, so the grid's steps don't show there.
    washes.push(rgba(mix(deep, light, lit * 0.5), WASH * lit * lit))
    for (let streak = 0; streak < STREAKS; streak++) {
      palette.push(rgba(mix(base, frost, (streak / (STREAKS - 1)) * FROST_LIFT), alpha))
    }
  }
  return { palette, washes }
}

/**
 * Lays the curve over a grid of character cells and shades it as a cylinder. Walks the curve from
 * its start, so where it comes back over itself the later stretch claims those cells again, with
 * a blank ring just outside its rim: that's what makes a crossing read as over and under.
 */
function buildRibbon(root: HTMLElement, path: string, boxWidth: number, thickness: number): Ribbon | null {
  const width = root.clientWidth
  if (width === 0 || !(boxWidth > 0)) return null
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  node.setAttribute('d', path)
  const length = node.getTotalLength()
  if (!(length > 0)) return null

  const scale = width / boxWidth
  const ch = clamp(width / CELL_DIVISOR, CELL_MIN, CELL_MAX)
  const cw = ch * CELL_ASPECT
  const radius = Math.max((thickness * scale) / 2, ch * MIN_RADIUS_CELLS)
  const reach = radius + ch * MOAT_CELLS
  const lengthPx = length * scale

  // The curve as points an even distance apart.
  const n = Math.max(2, Math.ceil(lengthPx / (cw * SAMPLE_STEP)) + 1)
  const step = lengthPx / (n - 1)
  const px = new Float32Array(n)
  const py = new Float32Array(n)
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let i = 0; i < n; i++) {
    const point = node.getPointAtLength((length * i) / (n - 1))
    const x = point.x * scale
    const y = point.y * scale
    px[i] = x
    py[i] = y
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  // The grid: lined up with the element's own, and no wider than the element, so a curve that
  // runs off the side is cut there instead of widening the page.
  const gx0 = Math.floor(Math.max(0, minX - reach) / cw)
  const gx1 = Math.ceil(Math.min(width, maxX + reach) / cw)
  const gy0 = Math.floor((minY - reach) / ch)
  const gy1 = Math.ceil((maxY + reach) / ch)
  const cols = gx1 - gx0
  const rows = gy1 - gy0
  if (cols <= 0 || rows <= 0) return null

  // One entry per stretch of curve that passes a cell. Samples from the same stretch arrive in
  // a run; a sample arriving long after the last one is the curve coming back over itself.
  const gap = Math.ceil((reach * 4) / step)
  const topEntry = new Int32Array(cols * rows).fill(-1)
  const eCell: number[] = []
  const eSample: number[] = []
  const eDistance: number[] = []
  const eLast: number[] = []
  const eUnder: number[] = []
  for (let i = 0; i < n; i++) {
    const sx = px[i]!
    const sy = py[i]!
    const x0 = Math.max(0, Math.floor((sx - reach) / cw) - gx0)
    const x1 = Math.min(cols - 1, Math.floor((sx + reach) / cw) - gx0)
    const y0 = Math.max(0, Math.floor((sy - reach) / ch) - gy0)
    const y1 = Math.min(rows - 1, Math.floor((sy + reach) / ch) - gy0)
    for (let y = y0; y <= y1; y++) {
      const dy = (gy0 + y + 0.5) * ch - sy
      for (let x = x0; x <= x1; x++) {
        const dx = (gx0 + x + 0.5) * cw - sx
        const distance = Math.hypot(dx, dy)
        if (distance > reach) continue
        const cell = y * cols + x
        const entry = topEntry[cell]!
        if (entry === -1 || i - eLast[entry]! > gap) {
          topEntry[cell] = eCell.length
          eCell.push(cell)
          eSample.push(i)
          eDistance.push(distance)
          eLast.push(i)
          eUnder.push(entry)
        } else {
          eLast[entry] = i
          if (distance < eDistance[entry]!) {
            eDistance[entry] = distance
            eSample[entry] = i
          }
        }
      }
    }
  }

  // Shade each entry. `kept` maps an entry to its place in the lists below, or for a dropped
  // one (a moat cell with no tube under it) to whatever it sat on.
  const total = eCell.length
  const kept = new Int32Array(total)
  const keys: number[] = []
  const cells: number[] = []
  const lits: number[] = []
  const streaks: number[] = []
  const grains: number[] = []
  const under: number[] = []
  for (let e = 0; e < total; e++) {
    const below = eUnder[e]! === -1 ? -1 : kept[eUnder[e]!]!
    const distance = eDistance[e]!
    const sample = eSample[e]!
    const cell = eCell[e]!
    if (distance > radius) {
      // Moat: only worth an entry where it blanks a tube cell of the strand underneath.
      if (below === -1 || lits[below]! < 0) {
        kept[e] = below
        continue
      }
      kept[e] = keys.length
      keys.push(sample * step + radius)
      cells.push(cell)
      lits.push(-1)
      streaks.push(0)
      grains.push(0)
      under.push(below)
      continue
    }

    const x = cell % cols
    const y = (cell - x) / cols
    // From the nearest point of the curve out to the cell, as a share of the radius: along the
    // tube that's straight across it (the curve's normal), and round an end it fans out, so the
    // ends shade as domes. The surface there leans that way and, for the rest, out of the screen.
    const ox = ((gx0 + x + 0.5) * cw - px[sample]!) / radius
    const oy = ((gy0 + y + 0.5) * ch - py[sample]!) / radius
    const z = Math.sqrt(Math.max(0, 1 - ox * ox - oy * oy))
    const lambert = Math.max(0, ox * LIGHT[0] + oy * LIGHT[1] + z * LIGHT[2])
    const streak = Math.max(0, ox * HALF[0] + oy * HALF[1] + z * HALF[2]) ** SPECULAR_POWER

    // The head is round: cells on the centre line show a radius ahead of the ones at the rim.
    const cap = Math.sqrt(Math.max(0, radius * radius - distance * distance))
    kept[e] = keys.length
    keys.push(sample * step - cap + radius)
    cells.push(cell)
    lits.push((AMBIENT + (1 - AMBIENT) * lambert) * rimShade(z))
    streaks.push(streak)
    grains.push((hash(gx0 + x, gy0 + y) - 0.5) * GRAIN * 2)
    under.push(below)
  }

  // Into the order the head reaches them. An entry always comes after the one it covers.
  const count = keys.length
  const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => keys[a]! - keys[b]! || a - b)
  const place = new Int32Array(count)
  order.forEach((from, to) => {
    place[from] = to
  })

  const cssWidth = cols * cw
  const cssHeight = rows * ch
  let dpr = Math.min(2, window.devicePixelRatio || 1)
  if (cssWidth * cssHeight * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (cssWidth * cssHeight))

  return {
    left: gx0 * cw,
    top: gy0 * ch,
    width: cssWidth,
    height: cssHeight,
    dpr,
    cell: ch,
    xs: Int32Array.from({ length: cols + 1 }, (_, i) => Math.round(i * cw * dpr)),
    ys: Int32Array.from({ length: rows + 1 }, (_, i) => Math.round(i * ch * dpr)),
    cols,
    yMin: minY,
    ySpan: Math.max(1, maxY - minY),
    count,
    soft: radius * HEAD_DOME,
    // The last cells show a little before the end, and the head's dome has run off them by the end.
    span: lengthPx + radius * (1 + HEAD_DOME) + 1,
    keys: Float32Array.from(order, (from) => keys[from]!),
    cells: Int32Array.from(order, (from) => cells[from]!),
    lits: Float32Array.from(order, (from) => lits[from]!),
    streaks: Float32Array.from(order, (from) => streaks[from]!),
    grains: Float32Array.from(order, (from) => grains[from]!),
    under: Int32Array.from(order, (from) => (under[from]! === -1 ? -1 : place[under[from]!]!)),
    ...buildPalette(root),
  }
}

/**
 * A thick tube drawn in glyphs along a curve, shaded like a lit cylinder in one hue, that draws
 * itself as the page scrolls: the further its curve has risen past the `lead` line, the more of
 * it is there, and scrolling back takes it away again. Only the cells the head passes are
 * touched each frame, and nothing runs while it's off screen or the head has caught up. Under
 * reduced motion it's simply drawn whole.
 */
export function GlyphRibbon({ path, box, hue, thickness, lead = 0.72, className }: GlyphRibbonProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxWidth = box[0]

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!root || !canvas || !context) return

    const still = reducedMotion()
    const state = {
      ribbon: null as Ribbon | null,
      width: -1,
      /** Progress along the curve as drawn, and how many entries that has put on the canvas. */
      shown: still ? 1 : 0,
      drawn: 0,
      /** How many of those, from the start, are in their own shading; the rest are in the head's dome. */
      firm: 0,
      fontReady: false,
      onScreen: false,
      last: 0,
      stop: null as (() => void) | null,
      alive: true,
    }

    /**
     * Clears the entry's cell and, with `fade` above 0, draws its wash and character there. `fade`
     * is how far the cell is out of the moving head's dome: 1 is the tube's own shading, and toward
     * 0 the cell darkens as a rim would, so the head reads as a rounded end and not a cut.
     */
    const paint = (ribbon: Ribbon, entry: number, fade: number) => {
      const cell = ribbon.cells[entry]!
      const x = cell % ribbon.cols
      const y = (cell - x) / ribbon.cols
      const left = ribbon.xs[x]!
      const right = ribbon.xs[x + 1]!
      const top = ribbon.ys[y]!
      const bottom = ribbon.ys[y + 1]!
      context.clearRect(left, top, right - left, bottom - top)
      let lit = ribbon.lits[entry]!
      if (fade <= 0 || lit < 0) return
      let streak = ribbon.streaks[entry]!
      if (fade < 1) {
        const dome = rimShade(Math.sqrt(1 - (1 - fade) ** 2))
        lit *= dome
        streak *= dome
      }
      const value = clamp(lit * (1 - SPECULAR) + streak * SPECULAR + ribbon.grains[entry]!, 0, 1)
      const tone = Math.round(clamp(lit, 0, 1) * (TONES - 1))
      if (WASH > 0) {
        context.fillStyle = ribbon.washes[tone]!
        context.fillRect(left, top, right - left, bottom - top)
      }
      // Clipped to the cell: a stroke's soft edge over the line would outlive the cell's own clearing.
      context.save()
      context.beginPath()
      context.rect(left, top, right - left, bottom - top)
      context.clip()
      context.fillStyle = ribbon.palette[tone * STREAKS + Math.round(clamp(streak, 0, 1) * (STREAKS - 1))]!
      context.fillText(FINE_RAMP[Math.round(GLYPH_FLOOR + (RAMP_TOP - GLYPH_FLOOR) * value)]!, (left + right) / 2, (top + bottom) / 2)
      context.restore()
    }

    /**
     * Brings the canvas to `progress`. Entries the head has left are taken back, the ones it has
     * reached are drawn, and the last stretch behind its leading edge is redrawn in the dome's
     * shading for where the head is now. Everything further back is left alone.
     */
    const reveal = (progress: number) => {
      const ribbon = state.ribbon
      if (!ribbon || !state.fontReady) return
      const { keys, under, count, soft } = ribbon
      const head = progress * ribbon.span
      let drawn = state.drawn
      // Backwards, latest first, so each cell is left showing whatever that entry had covered.
      while (drawn > 0 && keys[drawn - 1]! >= head) {
        drawn--
        paint(ribbon, drawn, 0)
        if (under[drawn]! !== -1) paint(ribbon, under[drawn]!, 1)
      }
      let firm = Math.min(state.firm, drawn)
      while (drawn < count && keys[drawn]! < head) drawn++
      // What the dome has moved off gets its own shading, once. An over-strand's cell lands
      // after the under-strand's, and painting clears first, so it replaces it.
      while (firm < drawn && keys[firm]! <= head - soft) paint(ribbon, firm++, 1)
      while (firm > 0 && keys[firm - 1]! > head - soft) firm--
      for (let entry = firm; entry < drawn; entry++) paint(ribbon, entry, (head - keys[entry]!) / soft)
      state.drawn = drawn
      state.firm = firm
    }

    /** How much of the curve should be drawn for where the page is: linear over the curve's height. */
    const goal = () => {
      const ribbon = state.ribbon
      if (still || !ribbon) return 1
      const top = root.getBoundingClientRect().top
      return clamp((lead * window.innerHeight - top - ribbon.yMin) / ribbon.ySpan, 0, 1)
    }

    const sleep = () => {
      state.stop?.()
      state.stop = null
    }

    const frame = (time: number) => {
      const target = goal()
      const dt = state.last ? Math.min(64, time - state.last) : 16.67
      state.last = time
      state.shown += (target - state.shown) * (1 - (1 - EASE) ** (dt / 16.67))
      // Within a pixel or so of the curve: call it there, and stop until the page moves again.
      if (Math.abs(target - state.shown) < 0.0004) state.shown = target
      reveal(state.shown)
      if (state.shown === target) sleep()
    }

    /** Starts following the page, if there's anything to follow. A scroll or a resize calls this. */
    const wake = () => {
      if (state.stop || still || !state.onScreen || !state.ribbon || !state.fontReady) return
      state.last = 0
      state.stop = onFrame(frame)
    }

    /** Measures, sizes the canvas (which clears it) and draws as far as the head is now. */
    const rebuild = () => {
      state.width = root.clientWidth
      const ribbon = buildRibbon(root, path, boxWidth, thickness)
      state.ribbon = ribbon
      state.drawn = 0
      state.firm = 0
      if (!ribbon) {
        canvas.width = 0
        canvas.height = 0
        return
      }
      canvas.style.left = `${ribbon.left}px`
      canvas.style.top = `${ribbon.top}px`
      canvas.style.width = `${ribbon.width}px`
      canvas.style.height = `${ribbon.height}px`
      canvas.width = Math.round(ribbon.width * ribbon.dpr)
      canvas.height = Math.round(ribbon.height * ribbon.dpr)
      context.font = `${WEIGHT} ${ribbon.cell * ribbon.dpr}px ${MONO}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      // Nobody saw the old size's head, so the new one starts where the page says it is.
      state.shown = goal()
      reveal(state.shown)
    }

    /** Wipes the canvas and draws what's shown again: for a font that arrived after the first draw. */
    const repaint = () => {
      state.fontReady = true
      if (state.ribbon) context.clearRect(0, 0, canvas.width, canvas.height)
      state.drawn = 0
      state.firm = 0
      reveal(state.shown)
      wake()
    }

    rebuild()

    // The first draw waits for the mono font, but not for long; if it turns up late, draw again.
    const fontTimer = window.setTimeout(() => {
      if (state.alive && !state.fontReady) repaint()
    }, FONT_WAIT_MS)
    document.fonts.load(`${WEIGHT} 10px "JetBrains Mono"`).then(
      () => {
        window.clearTimeout(fontTimer)
        if (state.alive) repaint()
      },
      () => undefined,
    )

    const resize = new ResizeObserver(() => {
      if (root.clientWidth === state.width) return
      rebuild()
      wake()
    })
    resize.observe(root)

    if (still) {
      return () => {
        state.alive = false
        window.clearTimeout(fontTimer)
        resize.disconnect()
      }
    }

    const visible = new IntersectionObserver(
      (entries) => {
        const onScreen = entries.at(-1)?.isIntersecting ?? false
        if (onScreen === state.onScreen) return
        state.onScreen = onScreen
        // Out of sight either way, coming or going: level with the page, there's no glide to show.
        state.shown = goal()
        reveal(state.shown)
        if (!onScreen) sleep()
      },
      { rootMargin: ROOT_MARGIN },
    )
    visible.observe(root)
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake, { passive: true })

    return () => {
      state.alive = false
      sleep()
      window.clearTimeout(fontTimer)
      resize.disconnect()
      visible.disconnect()
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', wake)
    }
  }, [path, boxWidth, thickness, hue, lead])

  return (
    <div ref={rootRef} className={className ? `${styles.ribbon} ${className}` : styles.ribbon} data-hue={hue} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
