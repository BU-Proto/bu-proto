// Which ground each page stands on. The ASCII field stays mounted behind every page; each kind of
// page tunes it differently (ramp, glyph size, ribbing, wash, how far down it reaches), so moving
// around the site feels like moving between rooms of the same building. The rooms share one light:
// the field's own gradient is never hue-shifted, so every page is in the site's one palette. Each
// room catches that light in its own shape (see ascii-field/shapes.ts); the landing's is the bloom.

import { DEFAULT_FIELD_SETTINGS, type FieldSettings } from '../ascii-field'

/** Solid grounds, for canvas-drawn edges and textures. Kept in step with the tokens in index.css. */
export const GROUND = {
  harbor: '#061a2e',
  paper: '#f0f1fa',
  /** Frost, faint: the frozen glyph texture on harbor. */
  texture: 'rgba(246, 251, 255, 0.06)',
  /** The same glyph tile drawn solid, for a mask: the field's sweep shows through its glyphs, so
      the frozen texture keeps the field's colour. */
  textureMask: '#ffffff',
} as const

export type GroundName = 'home' | 'events' | 'hackathons' | 'record' | 'reading' | 'membership' | 'legal'

export interface PageGround {
  name: GroundName
  field: FieldSettings
  /**
   * A CSS filter on the field's canvas, as saturation and brightness: a page can turn the field
   * down, but not recolour it. Always both, so the browser can tween from one page's to the next.
   */
  light: readonly [saturate: number, brightness: number]
  /**
   * How far down the page the field runs. `full`: behind the whole page (the landing, which
   * draws its own grounds). `veil`: the field frames the header, then drains into harbor and stays
   * faintly visible under it, for lists people scan. `top`: the field frames the header, then
   * drains into solid harbor, for pages people read or fill in.
   */
  reach: 'full' | 'veil' | 'top'
}

const field = (overrides: Partial<FieldSettings>): FieldSettings => ({ ...DEFAULT_FIELD_SETTINGS, ...overrides })

export const GROUNDS: Record<GroundName, PageGround> = {
  // The landing: the original blue-to-pink bloom, the hero's words below it. Slower waves, softer
  // glyphs, shallower ribs, in slightly bigger cells.
  home: {
    name: 'home',
    field: field({ shape: 'bloom', cellSize: 10, baseColor: 0.82, glyphContrast: 0.42, ribbing: 0.3, drift: 0.55 }),
    light: [1, 1],
    reach: 'full',
  },
  // Events: the trail's own sparse ramp in bigger cells, the ribs pronounced.
  events: {
    name: 'events',
    field: field({ shape: 'ripple', ramp: 'codex', cellSize: 11, ribbing: 0.6, glyphContrast: 0.5, baseColor: 0.75, drift: 0.8 }),
    light: [1, 0.95],
    reach: 'veil',
  },
  // Hackathons: chunky block shades, like a departures board.
  hackathons: {
    name: 'hackathons',
    field: field({ shape: 'strata', ramp: 'blocks', cellSize: 12, ribbing: 0.3, glyphContrast: 0.4, baseColor: 0.75, drift: 0.7 }),
    light: [1, 0.95],
    reach: 'veil',
  },
  // Wins and the track record: the classic ramp in fine cells, deep fluting, a little dimmer.
  record: {
    name: 'record',
    field: field({ shape: 'rays', ramp: 'classic', cellSize: 8, ribbing: 0.8, glyphContrast: 0.55, baseColor: 0.6, drift: 0.6 }),
    light: [0.9, 0.85],
    reach: 'veil',
  },
  // Resources and guides: long reading, so the field quiets down and only frames the header.
  reading: {
    name: 'reading',
    field: field({ shape: 'aurora', cellSize: 8, baseColor: 0.55, glyphContrast: 0.35, ribbing: 0.25, drift: 0.4 }),
    light: [0.7, 0.9],
    reach: 'top',
  },
  // Join, the fund and the board: forms and names, so the field frames the header and the
  // form stands on solid harbor.
  membership: {
    name: 'membership',
    field: field({ shape: 'eclipse', ramp: 'classic', cellSize: 10, baseColor: 0.6, glyphContrast: 0.45, ribbing: 0.5, drift: 0.5 }),
    light: [1, 0.95],
    reach: 'top',
  },
  // Legal: the quietest. A faint field over the header, then plain harbor.
  legal: {
    name: 'legal',
    field: field({ cellSize: 7, baseColor: 0.35, glyphContrast: 0.3, ribbing: 0.15, drift: 0.2, push: 0.1 }),
    light: [0.4, 0.8],
    reach: 'top',
  },
}

/** Path prefixes to grounds, first match wins. The landing gets the home field; anything else
    unlisted (the 404) gets the reading ground, so its links stand on harbor. */
const ROUTES: readonly [prefix: string, ground: GroundName][] = [
  ['/events', 'events'],
  ['/hackathons', 'hackathons'],
  ['/wins', 'record'],
  ['/track-record', 'record'],
  ['/resources', 'reading'],
  ['/join', 'membership'],
  ['/grants', 'membership'],
  ['/board', 'membership'],
  ['/privacy', 'legal'],
  ['/terms', 'legal'],
]

export function groundFor(pathname: string): PageGround {
  const match = ROUTES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (match) return GROUNDS[match[1]]
  return GROUNDS[pathname === '/' ? 'home' : 'reading']
}

export const lightFilter = ([saturate, brightness]: PageGround['light']) =>
  `saturate(${saturate}) brightness(${brightness})`
