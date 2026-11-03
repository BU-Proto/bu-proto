/** Character ramps for the background field, from empty to dense. */
export const RAMPS = {
  classic: ' .:-=+*#%@',
  fine: " .,:;'-~=+<>*xo%#@",
  codex: ' ._-+>o',
  blocks: ' ░▒▓█',
} as const

export type RampName = keyof typeof RAMPS

export const RAMP_LABELS: Record<RampName, string> = {
  classic: '.:-=+*#%@',
  fine: 'fine (18 steps)',
  codex: '._-+>o',
  blocks: '░▒▓█',
}

/** Colors for the cursor trail's glyphs. */
export const TRAIL_COLORS = {
  white: '#ffffff',
  navy: '#0b2a46',
  green: '#55fa63',
} as const

export type TrailColor = keyof typeof TRAIL_COLORS

export const TRAIL_COLOR_LABELS: Record<TrailColor, string> = {
  white: 'White',
  navy: 'Navy',
  green: 'Terminal green',
}

/** Everything a viewer can tune from the panel. */
export interface FieldSettings {
  /** Background glyph size in px (also the row height). */
  cellSize: number
  /** How strongly the gradient washes the dark ground behind the glyphs, 0–1. */
  baseColor: number
  /** How far background glyphs are lifted toward white, roughly 0.2–1.6. */
  glyphContrast: number
  /** Multiplier on the force the cursor puts into the fluid. */
  wind: number
  /** Multiplier on how long the cursor trail lingers. */
  trailLength: number
  /** Strength of the fluted-glass column modulation, 0–1. */
  ribbing: number
  ramp: RampName
  trailColor: TrailColor
}

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  cellSize: 13,
  baseColor: 0.9,
  glyphContrast: 1,
  wind: 1,
  trailLength: 1,
  ribbing: 0.5,
  ramp: 'classic',
  trailColor: 'white',
}

export const MONO_FAMILY = '"JetBrains Mono"'
export const MONO_STACK = `${MONO_FAMILY}, ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace`

/** The background field: a glyph per cell, tinted by the flowing gradient. */
export const FIELD = {
  /** Dark ground under the gradient wash (#061a2e). */
  BASE_RGB: [6, 26, 46] as const,
  /** Brightness window mapped onto the ramp. */
  DENSITY_LO: 0.4,
  DENSITY_HI: 0.82,
  /** The reference has a 12px rib on a 783px-wide hero: about 67 ribs across. */
  RIBS_ACROSS: 67,
  /** How quickly the stirred gradient relaxes back to its resting layout (1/s). */
  GRADIENT_RELAX: 0.9,
  /** px of glyph offset per px/s of local wind, capped at 0.7 of a cell. */
  WIND_NUDGE: 0.03,
} as const

/**
 * The cursor trail: a Stable-Fluids fog drawn with the glyphs ○ > _.
 * Density decides whether there is fog at all (glyphs are born and die with the fluid);
 * a slowly scrolling noise texture decides which glyph shows. Values follow the
 * Codex-style fog it imitates, with the viscosity scale calibrated so the fog hugs the path.
 */
export const FOG = {
  CELL_X: 12,
  CELL_Y: 13,
  FONT_PX: 13,
  ALPHA: 0.92,
  /** Fluid grid resolution relative to the fog's glyph grid. */
  RES_SCALE: 1.3,
  /** Pointer velocity (px/s) to force, brush radius (px), speed-based brush growth. */
  FORCE_SCALE: 0.5,
  FORCE_MAX: 70,
  HOVER_RADIUS: 13,
  DRAG_SCALE: 0.015,
  DRAG_MAX: 14,
  /** Velocity diffusion (viscosity) and solver iterations. */
  DIFFUSION: 0.7,
  VISCOSITY_SCALE: 200,
  ITERATIONS: 5,
  PROJECT_ITERS: 10,
  /** exp(-k·dt) decay: the wind lingers, the fog fades in about a second. */
  VEL_DISSIP: 0.3,
  DEN_DISSIP: 1.2,
  /** Density deposited by a stroke, and the ceilings for strokes and clicks. */
  STRENGTH: 1.15,
  MOVE_CAP: 1.4,
  SPLASH_CAP: 1.8,
  /** Click shockwave: four staggered rings that ease outward and fade. */
  SPLASH_RANGE: 170,
  SPLASH_THICKNESS: 90,
  SPLASH_RINGS: 4,
  SPLASH_STAGGER: 0.045,
  SPLASH_LIFE: 0.4,
  SPLASH_DEPOSIT: 0.15,
  SPLASH_FORCE_MAG: 2.5,
  SPLASH_TRAVEL_EASE: 2.5,
  SPLASH_DEN_DECAY: 2,
  SPLASH_FORCE_DECAY: 1.2,
  /** Value-noise texture that picks ○ vs > inside the fog. */
  NOISE_N: 64,
  TEX_SCALE: 0.06,
  TEX_FLOW: 0.16,
  TEX_FLOOR: 0.42,
  TEX_SHAPE: 1.8,
  /** luma -> contrast -> gamma -> invert -> quantize into ○ > _ (space). */
  CONTRAST: 2,
  GAMMA: 0.5,
  /** The fog steps back where it crosses elements marked data-fog-clear. */
  CLEAR_GAIN: 2.4,
  CLEAR_PAD: 5,
  CLEAR_BLUR: 2,
} as const

export const FOG_GLYPHS = ['○', '>', '_'] as const
