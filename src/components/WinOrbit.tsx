import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react'
import type { Win } from '../../shared/api'
import { asciiWord, hash } from '../lib/glyphArt'
import { onFrame } from '../lib/smoothScroll'
import { useInView } from '../lib/useInView'
import styles from './WinOrbit.module.css'

// A pinned statement with a loose ring of win cards and stamps around it. The ring is really a row
// sliding right to left at twice the scroll: odd items arc over the statement and even items arc
// under it, so the two halves read as one ring turning. Every item is laid out at its largest size
// and scaled down, which keeps photos and glyph art sharp at the top and bottom of the ring.

/** One run of words in the statement. Muted runs are the grey ones. */
export interface OrbitPhrase {
  text: string
  muted?: boolean
}

type OrbitStatement = readonly (readonly OrbitPhrase[])[]

const STATEMENT: OrbitStatement = [
  [{ text: 'Every project here was built' }, { text: 'at a hackathon', muted: true }],
  [{ text: 'and', muted: true }, { text: 'each team took' }, { text: 'a prize', muted: true }, { text: 'home.' }],
]

const NAVY = '#061a2e'
const BLUE = '#7cc7f4'
const GOLD = '#9d8bff'
const RED = '#ff6eb0'
const NEON = '#9df0a8'

type StampMark = 'ring' | 'chevron' | 'prompt'

interface Stamp {
  ground: string
  ink: string
  words: string
  mark: StampMark
}

const STAMPS: readonly Stamp[] = [
  { ground: BLUE, ink: NAVY, words: 'PROTO • PROTO • PROTO • ', mark: 'prompt' },
  { ground: GOLD, ink: NAVY, words: 'PROTO • BOSTON • PROTO • ', mark: 'ring' },
  { ground: RED, ink: NAVY, words: 'PROTO • PROTO • PROTO • ', mark: 'chevron' },
  { ground: NEON, ink: NAVY, words: 'HACK • DEMO • PROTO • ', mark: 'prompt' },
  { ground: NAVY, ink: NEON, words: 'PROTO • PROTO • PROTO • ', mark: 'ring' },
]

/** The ring wants this many cards to feel full, so a short list of wins repeats. */
const MIN_CARDS = 9
/** The pinned distance grows with every item, so only the newest wins ride the ring. */
const MAX_CARDS = 15
/** The first stamp, then one every this many slots: three in a ring of twelve. */
const FIRST_STAMP = 4
const STAMP_EVERY = 3
/** Rests between ±this many degrees. */
const MAX_TILT = 2.9

/** Row pixels per scrolled pixel. */
const ROW_SPEED = 2
/** Where the row starts, in viewport widths: just past the right edge. */
const ROW_START = 1.05
/** A card's pitch over its width. Matches --gap in the stylesheet. */
const PITCH = 13 / 12
/** How far an item's centre travels from the middle, as a share of the viewport's height. */
const REACH = 0.48
/** How far in from the edges an arc starts, as a share of the width. Wider screens leave a margin. */
const EDGE_WIDE = 0.1
const EDGE_NARROW = 0
const NARROW = 768
/** The largest scale on the arc, which is the size items are laid out at. */
const PEAK = 1.45

/** Scale along an arc's first half: dips, swells past the peak of the arc, and settles a little. */
const SCALE_KEYS = [
  { at: 0, scale: 1 },
  { at: 0.27, scale: 0.95 },
  { at: 0.72, scale: PEAK },
  { at: 1, scale: 1.4 },
]

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t))
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function scaleAt(rise: number) {
  const next = SCALE_KEYS.findIndex((key) => key.at >= rise)
  if (next <= 0) return SCALE_KEYS[next < 0 ? SCALE_KEYS.length - 1 : 0].scale
  const from = SCALE_KEYS[next - 1]
  const to = SCALE_KEYS[next]
  return from.scale + (to.scale - from.scale) * easeInOut((rise - from.at) / (to.at - from.at))
}

const tiltAt = (index: number) => (hash(index, 11) * 2 - 1) * MAX_TILT

type Slot = { key: string; win: Win; stamp?: undefined } | { key: string; stamp: Stamp; win?: undefined }

/** The ring's order: cards, with a stamp dropped in at a steady beat. */
function slotsFrom(wins: readonly Win[]): Slot[] {
  const shown = wins.slice(0, MAX_CARDS)
  const cards = Math.max(MIN_CARDS, shown.length)
  const slots: Slot[] = []
  for (let card = 0, stamps = 0; card < cards; ) {
    const beat = slots.length - FIRST_STAMP
    if (beat >= 0 && beat % STAMP_EVERY === 0) {
      slots.push({ key: `stamp-${stamps}`, stamp: STAMPS[stamps % STAMPS.length] })
      stamps += 1
    } else if (shown.length > 0) {
      slots.push({ key: `win-${card}`, win: shown[card % shown.length] })
      card += 1
    } else {
      slots.push({ key: `stamp-${stamps}`, stamp: STAMPS[stamps % STAMPS.length] })
      stamps += 1
      card += 1
    }
  }
  return slots
}

/** The stamp's middle: the site's own ○, > and _, drawn on a 200 square. */
function Mark({ mark }: { mark: StampMark }) {
  if (mark === 'ring') return <circle cx="100" cy="100" r="28" />
  if (mark === 'chevron') return <path d="M84 66l36 34-36 34" />
  return <path d="M68 70l32 30-32 30M108 134h34" />
}

function StampFace({ stamp }: { stamp: Stamp }) {
  const path = useId()
  const style = { '--stamp-ground': stamp.ground, '--stamp-ink': stamp.ink } as CSSProperties
  return (
    <div className={styles.stamp} style={style}>
      <svg className={styles.face} viewBox="0 0 200 200">
        <circle className={styles.keyline} cx="100" cy="100" r="93" />
        <g className={styles.mark}>
          <Mark mark={stamp.mark} />
        </g>
      </svg>
      <svg className={styles.words} viewBox="0 0 200 200">
        <defs>
          <path id={path} d="M100 100m-70 0a70 70 0 1 1 140 0a70 70 0 1 1-140 0" />
        </defs>
        <text>
          <textPath href={`#${path}`} textLength={437} lengthAdjust="spacing">
            {stamp.words}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

const GLYPH_COLS = 104
const GLYPH_ROWS = 35

function WinCard({ win, loaded }: { win: Win; loaded: boolean }) {
  const lines = useMemo(
    () => (loaded && !win.photo ? asciiWord(win.project, GLYPH_COLS, GLYPH_ROWS).join('\n') : ''),
    [loaded, win.photo, win.project],
  )
  return (
    <div className={styles.card}>
      <div className={styles.shot}>
        {win.photo ? (
          loaded && <img src={win.photo} alt="" decoding="async" draggable={false} />
        ) : (
          <pre className={styles.glyphs} data-trail-art>{lines}</pre>
        )}
      </div>
    </div>
  )
}

export function WinOrbit({
  wins,
  statement = STATEMENT,
  spinSeconds = 18,
}: {
  wins: readonly Win[]
  /** The statement's lines, each a run of black and grey phrases. */
  statement?: OrbitStatement
  /** Seconds for a stamp's text to go round once, or 0 to hold it still. */
  spinSeconds?: number
}) {
  // Photos and glyph art wait until the section is a screen away.
  const [rootRef, loaded] = useInView<HTMLElement>('100% 0px 100% 0px')
  const stageRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const slots = useMemo(() => slotsFrom(wins), [wins])

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const ring = ringRef.current
    const spacer = spacerRef.current
    if (!root || !stage || !ring || !spacer) return

    const items = [...ring.children] as HTMLElement[]
    const tilts = items.map((_, index) => tiltAt(index))
    const shown = items.map(() => false)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const size = { top: 0, width: 0, reach: 0, card: 0, box: 0, pitch: 0, start: 0, runway: 0, edge: 0 }
    const state = { onScreen: false, drawn: Number.NaN, stop: undefined as (() => void) | undefined }

    // The only layout reads. They run when something resizes, never per frame.
    const measure = () => {
      const width = stage.clientWidth
      size.width = width
      size.box = items[0]?.offsetWidth ?? 0
      size.card = size.box / PEAK
      size.pitch = size.card * PITCH
      size.start = ROW_START * width
      size.top = root.getBoundingClientRect().top + window.scrollY
      size.runway = spacer.offsetHeight
      size.reach = Math.max(0, REACH * stage.clientHeight - size.card / 2)
      size.edge = (width < NARROW ? EDGE_NARROW : EDGE_WIDE) * width
      state.drawn = Number.NaN
    }

    const draw = () => {
      const scrolled = Math.max(0, Math.min(size.runway, window.scrollY - size.top))
      if (scrolled === state.drawn) return
      state.drawn = scrolled
      const row = size.start - scrolled * ROW_SPEED
      const entry = size.width - size.edge
      const span = entry - size.edge + size.card
      const half = (size.card * PEAK) / 2
      items.forEach((item, index) => {
        const left = row + index * size.pitch
        const middle = left + size.card / 2
        const visible = middle - half < size.width && middle + half > 0
        if (visible !== shown[index]) {
          shown[index] = visible
          item.style.visibility = visible ? 'visible' : 'hidden'
        }
        if (!visible) return
        const travel = clamp01((entry - left) / span)
        const rise = 1 - Math.abs(2 * travel - 1)
        const lift = easeInOut(rise)
        const x = middle - size.box / 2
        const y = (index % 2 === 0 ? -1 : 1) * size.reach * lift
        const tilt = tilts[index] * (1 - 2 * lift)
        const scale = scaleAt(rise) / PEAK
        item.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${tilt.toFixed(3)}deg) scale(${scale.toFixed(4)})`
      })
    }

    const sync = () => {
      state.stop?.()
      state.stop = undefined
      root.dataset.live = String(state.onScreen && !reduced.matches)
      if (reduced.matches) {
        shown.fill(false)
        items.forEach((item) => item.removeAttribute('style'))
        items.forEach((item, index) => item.style.setProperty('--tilt', `${tilts[index]}deg`))
        return
      }
      measure()
      draw()
      if (state.onScreen) state.stop = onFrame(draw)
    }

    const visibility = new IntersectionObserver(([entry]) => {
      state.onScreen = entry?.isIntersecting ?? false
      sync()
    })
    visibility.observe(root)

    // Anything above changing height moves the pin, and it shows up as the body resizing.
    const resized = new ResizeObserver(() => {
      if (reduced.matches) return
      measure()
      draw()
    })
    resized.observe(document.body)
    resized.observe(stage)

    reduced.addEventListener('change', sync)
    sync()
    return () => {
      state.stop?.()
      visibility.disconnect()
      resized.disconnect()
      reduced.removeEventListener('change', sync)
    }
  }, [rootRef, slots])

  const rootStyle = {
    '--count': slots.length,
    '--spin': spinSeconds > 0 ? `${spinSeconds}s` : '0s',
  } as CSSProperties

  return (
    <section ref={rootRef} className={styles.root} style={rootStyle} data-spin={spinSeconds > 0}>
      <div ref={stageRef} className={styles.stage}>
        <h2 className={styles.statement}>
          {statement.map((line, index) => (
            <span key={index} className={styles.line}>
              {line.map((phrase, at) => (
                <span key={at} className={phrase.muted ? styles.muted : undefined}>
                  {phrase.text}{' '}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div ref={ringRef} className={styles.ring} aria-hidden="true">
          {slots.map((slot, index) => (
            <div key={slot.key} className={styles.item} style={{ '--tilt': `${tiltAt(index)}deg` } as CSSProperties}>
              {slot.stamp ? <StampFace stamp={slot.stamp} /> : <WinCard win={slot.win} loaded={loaded} />}
            </div>
          ))}
        </div>
      </div>
      <div ref={spacerRef} className={styles.spacer} />
    </section>
  )
}
