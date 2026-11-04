// Which ground each page stands on. The ASCII field stays mounted behind every page; each kind of
// page tunes it differently (ramp, glyph size, ribbing, wash, hue), so moving around the site
// feels like moving between rooms of the same building rather than scrolling one wallpaper.

import { DEFAULT_FIELD_SETTINGS, type FieldSettings } from '../ascii-field'

/** Solid grounds, for canvas-drawn edges and textures. Kept in step with the tokens in index.css. */
export const GROUND = {
  ink: '#03111f',
  paper: '#e3eaf0',
  red: '#cc0000',
} as const

export type GroundName = 'home' | 'events' | 'hackathons' | 'record' | 'reading' | 'membership' | 'legal'

export interface PageGround {
  name: GroundName
  field: FieldSettings
  /**
   * A CSS filter on the field's canvas, as hue turn (deg), saturation and brightness. The field's
   * gradient is baked in, so this is how a page gets its own light without touching the renderer.
   * Always all three, so the browser can tween from one page's light to the next.
   */
  light: readonly [hue: number, saturate: number, brightness: number]
  /**
   * `full`: the field runs behind the whole page. `top`: it shows behind the page header, then a
   * solid ground with a faint glyph texture takes over, for pages people read at length.
   */
  reach: 'full' | 'top'
}

const field = (overrides: Partial<FieldSettings>): FieldSettings => ({ ...DEFAULT_FIELD_SETTINGS, ...overrides })

export const GROUNDS: Record<GroundName, PageGround> = {
  // The hero's field, untouched.
  home: { name: 'home', field: DEFAULT_FIELD_SETTINGS, light: [0, 1, 1], reach: 'full' },
  // Events: the trail's own sparse ramp in bigger cells, ribs pronounced, blues turned to sea green.
  events: {
    name: 'events',
    field: field({ ramp: 'codex', cellSize: 11, ribbing: 0.8, glyphContrast: 0.75, drift: 1.3 }),
    light: [-28, 1.05, 0.95],
    reach: 'full',
  },
  // Hackathons: chunky block shades, the pinks pushed to coral and the blues to indigo.
  hackathons: {
    name: 'hackathons',
    field: field({ ramp: 'blocks', cellSize: 12, ribbing: 0.35, glyphContrast: 0.5, baseColor: 0.8 }),
    light: [38, 1.15, 0.95],
    reach: 'full',
  },
  // Wins and the track record: the classic ramp in fine cells, deep fluting, in trophy gold and teal.
  record: {
    name: 'record',
    field: field({ ramp: 'classic', cellSize: 8, ribbing: 1, glyphContrast: 0.7, baseColor: 0.6, drift: 0.7 }),
    light: [-150, 1, 0.72],
    reach: 'full',
  },
  // Resources and guides: long reading, so the field quiets down and only frames the header.
  reading: {
    name: 'reading',
    field: field({ cellSize: 8, baseColor: 0.55, glyphContrast: 0.4, ribbing: 0.25, drift: 0.4 }),
    light: [-200, 0.5, 0.9],
    reach: 'top',
  },
  // Join, the fund and the board: the wash nearly off, so the gradient lives only in the glyphs,
  // bright on navy, like the field after dark. Forms sit calmly on it.
  membership: {
    name: 'membership',
    field: field({ ramp: 'classic', cellSize: 10, baseColor: 0.3, glyphContrast: 0.85, ribbing: 0.65, drift: 0.6 }),
    light: [-12, 1.1, 1],
    reach: 'full',
  },
  // Legal: the quietest. A faint field over the header, then plain ink.
  legal: {
    name: 'legal',
    field: field({ cellSize: 7, baseColor: 0.35, glyphContrast: 0.3, ribbing: 0.15, drift: 0.2, push: 0.1 }),
    light: [0, 0.25, 0.8],
    reach: 'top',
  },
}

/** Path prefixes to grounds, first match wins. Anything unlisted (the 404) gets the home field. */
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
  return GROUNDS[match ? match[1] : 'home']
}

export const lightFilter = ([hue, saturate, brightness]: PageGround['light']) =>
  `hue-rotate(${hue}deg) saturate(${saturate}) brightness(${brightness})`
