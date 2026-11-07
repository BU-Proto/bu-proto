import type { WarpField } from './renderer'

/**
 * The trail layer's latest warp: how far the cursor's wind has carried the characters, on the
 * fluid's grid over the viewport (CSS px). Art that draws its own glyphs reads it to slide them
 * the same way. `current` is null while nothing has moved; `version` counts each new frame of it.
 */
export const trailWarp: { current: WarpField | null; version: number } = { current: null, version: 0 }
