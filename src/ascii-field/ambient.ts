import { FIELD } from './settings'

const TAU = Math.PI * 2

/** Phases of the gradient's sway at `time` seconds, wrapped so they stay precise for hours. */
export function swayPhases(time: number): [number, number] {
  return [(time * FIELD.SWAY_X_SPEED) % TAU, (time * FIELD.SWAY_Y_SPEED) % TAU]
}

/** Horizontal sway (fraction of the width) for a point at `y` CSS px. */
export function swayU(y: number, phase: number): number {
  return FIELD.SWAY_X * Math.sin(y * FIELD.SWAY_X_FREQ + phase)
}

/** Vertical sway (fraction of the height) for a point at `x` CSS px. */
export function swayV(x: number, phase: number): number {
  return FIELD.SWAY_Y * Math.sin(x * FIELD.SWAY_Y_FREQ + phase)
}

/** How far a glyph on a color of luminance `lum` (0–1) is lifted toward white. */
export function tintLift(lum: number, glyphContrast: number): number {
  let light = (lum - FIELD.LIGHT_FROM) / FIELD.LIGHT_SPAN
  light = light < 0 ? 0 : light > 1 ? 1 : light
  return Math.min(1, (FIELD.LIFT + FIELD.LIFT_LIGHT * light) * glyphContrast)
}
