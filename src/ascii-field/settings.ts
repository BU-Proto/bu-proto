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
  /** Glyph size in px (also the row height). The trail is drawn in the same grid. */
  cellSize: number
  /** How strongly the gradient washes the dark ground behind the glyphs, 0–1. */
  baseColor: number
  /** How far background glyphs are lifted toward white, roughly 0.2–1.6. */
  glyphContrast: number
  /** Multiplier on the force the cursor puts into the fluid. */
  wind: number
  /** Multiplier on how long the cursor trail lingers. */
  trailLength: number
  /** Fraction of the wind that slides the background's characters, 0–1 (0 keeps them still). */
  push: number
  /** Strength of the fluted-glass column modulation, 0–1. */
  ribbing: number
  /** Strength of the waves that roll through the background's characters; 0 turns them off. */
  drift: number
  ramp: RampName
  trailColor: TrailColor
}

export const DEFAULT_FIELD_SETTINGS: FieldSettings = {
  cellSize: 9,
  baseColor: 0.9,
  glyphContrast: 0.6,
  wind: 1,
  trailLength: 1,
  push: 0.25,
  ribbing: 0.5,
  drift: 1,
  ramp: 'fine',
  trailColor: 'white',
}

export const MONO_FAMILY = '"JetBrains Mono"'
export const MONO_STACK = `${MONO_FAMILY}, ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace`

/** The background field: a glyph per cell, tinted by the gradient. */
export const FIELD = {
  /** Dark ground under the gradient wash (#061a2e). */
  BASE_RGB: [6, 26, 46] as const,
  /** Brightness window mapped onto the ramp. */
  DENSITY_LO: 0.4,
  DENSITY_HI: 0.82,
  /** The reference has a 12px rib on a 783px-wide hero: about 67 ribs across. */
  RIBS_ACROSS: 67,
  /**
   * Ambient life: the gradient sways slowly (amplitude as a fraction of the viewport, spatial
   * frequency per px, phase speed in rad/s) and each glyph shimmers faintly.
   */
  SWAY_X: 0.01,
  SWAY_X_FREQ: 0.0149,
  SWAY_X_SPEED: 0.33,
  SWAY_Y: 0.008,
  SWAY_Y_FREQ: 0.0123,
  SWAY_Y_SPEED: -0.27,
  SHIMMER: 0.015,
  SHIMMER_SPEED: 1.3,
  /**
   * Ambient waves in the characters: two layers of value noise swing each cell's density by up
   * to DRIFT_AMOUNT × the `drift` setting, and the fluted-glass ribs slide at RIB_SPEED rad/s.
   * DRIFT_SCALE is noise cells per px and DRIFT_FLOW is noise cells travelled per second.
   */
  DRIFT_AMOUNT: 0.16,
  DRIFT_SCALE: 0.0065,
  DRIFT_FLOW: 0.22,
  RIB_SPEED: 0.9,
  /** Glyphs are lifted toward white by LIFT (more on light colors) × glyph contrast. */
  LIFT: 0.5,
  LIFT_LIGHT: 0.35,
  LIGHT_FROM: 0.55,
  LIGHT_SPAN: 0.25,
  /**
   * The cursor moves the characters, not the colors: the glyphs slide with a fraction of the
   * wind (the `push` setting) and ease back home at PUSH_RELAX per second. The slide is
   * blurred over about WARP_BLUR px so the glyphs move as one smooth sheet, and where the
   * wind shears hard it is scaled back so a glyph stretches by at most WARP_LIMIT and the
   * grid never folds.
   */
  PUSH_RELAX: 2.5,
  WARP_BLUR: 20,
  WARP_LIMIT: 0.4,
  /** Extra damping (per second) on the wind from CALM_AFTER seconds after the pointer stops. */
  CALM_AFTER: 0.5,
  CALM_DAMPING: 1.5,
  /**
   * Ambient breathing: every GUST_EVERY seconds or so, a patch about GUST_RADIUS px across
   * slides up to GUST_SLIDE px over GUST_LIFE seconds and eases back.
   */
  GUST_EVERY: 2.4,
  GUST_RADIUS: 150,
  GUST_SLIDE: 14,
  GUST_LIFE: 1.8,
} as const

/**
 * The cursor trail: a Stable-Fluids fog drawn with ○ > _ inside the background's own
 * character grid. Constants and formulas follow the reference fog (fluid-simulation.js).
 * Its characters sit on an 11px grid (REF_CELL); lengths below are px at that size and scale
 * with the glyph size, so the trail keeps the same proportions at any setting.
 */
export const FOG = {
  REF_CELL: 11,
  /**
   * Fluid grid resolution relative to a grid of square cells one glyph tall, capped at
   * MAX_NODES so very large screens stay smooth (the trail just gets slightly softer there).
   */
  RES_SCALE: 1.3,
  MAX_NODES: 50000,
  /** Pointer velocity (px/s) to force, brush radius (px), speed-based brush growth. */
  FORCE_SCALE: 0.5,
  HOVER_RADIUS: 13,
  DRAG_SCALE: 0.015,
  DRAG_MAX: 14,
  /** Velocity diffusion per step and solver iterations. */
  DIFFUSION: 0.7,
  ITERATIONS: 5,
  PROJECT_ITERS: 10,
  /** exp(-k·dt) decay: the wind lingers, the fog fades in about a second. */
  VEL_DISSIP: 0.3,
  DEN_DISSIP: 1.2,
  /** Density a stroke deposits, and the ceilings for strokes and clicks. */
  STRENGTH: 1.15,
  MOVE_CAP: 1.4,
  SPLASH_CAP: 1.8,
  /** Click shockwave: four rings that ease outward and fade. */
  SPLASH_RANGE: 170,
  SPLASH_THICKNESS: 90,
  SPLASH_RINGS: 4,
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
  /** luma -> contrast -> gamma -> invert -> quantize into ○ > _ (blank). */
  CONTRAST: 2,
  GAMMA: 0.5,
  /** Cells below this density are untouched by the fog. */
  MIN_DENSITY: 0.02,
  /**
   * Under the fog the background characters dim (by up to VEIL, between these densities) so
   * the trail's glyphs read clearly without cutting a hole in the art.
   */
  VEIL_LO: 0.08,
  VEIL_HI: 0.6,
  VEIL: 0.6,
  ALPHA: 0.95,
  /** The fog steps back where it crosses elements marked data-fog-clear. */
  CLEAR_GAIN: 2.4,
  CLEAR_PAD: 5,
  CLEAR_BLUR: 2,
} as const

export const FOG_GLYPHS = ['○', '>', '_'] as const
