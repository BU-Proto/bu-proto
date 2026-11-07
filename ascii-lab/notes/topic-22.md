# Topic 22: award-site text-mode visuals since 2023, and what reads as premium

Honesty first: search did not confirm any Awwwards or FWA honor for an ASCII-led site. What it did find is the technique appearing as gallery "elements", so treat these as named examples of the look, not proven winners.

## Named examples (Awwwards inspiration entries)
- Aino, "ASCII Physics" (physics-driven glyphs, with a textmode variant): https://www.awwwards.com/inspiration/ascii-physics-aino-1
- Kostya Farber, ASCII loading animation: https://www.awwwards.com/inspiration/ascii-loading-animation-kostya-farbers-website
- Lumena ASCII: https://www.awwwards.com/inspiration/ascii-lumena
- 0+X ASCII photo: https://www.awwwards.com/inspiration/ascii-photo-0-x

Pattern across them: ASCII is used for a moment (loader, intro, one hero object), not the whole site. Restraint reads as premium. Worth a manual visit to confirm colour use; the summaries did not say whether any tint glyphs with a gradient.

## Techniques worth borrowing
1. Shape-aware glyph choice, not a luminance ramp. A ramp falls apart at edges. Codrops describes one fragment per cell, scoring each glyph against the cell's pixels and writing the best index; atlas is 6x95 single-channel, one row per glyph, read with texelFetch. https://tympanus.net/codrops/2026/09/04/beyond-the-luminance-ramp-a-shape-aware-ascii-renderer-in-three-js/
   For us: this is the mushroom look. Pick line glyphs (/ | + x) by edge direction, blocks by bright mass.
2. Per-cell ordered dither. Bayer 4x4 threshold added to luminance before quantising, applied per cell so each glyph stays whole; short ramps then show smooth gradients, not bands. https://amagi.dev/vfx-js/docs/types/_vfx-js_effects.AsciiParams.html
   Sketch: `l = lum(cell) + (bayer4(cellXY) - 0.5) / rampLen; idx = floor(clamp(l,0,1) * rampLen);`
3. Everything per cell on the GPU: sample the source once at cell centre, so colour is constant across the glyph. Efecto uses 0.299r + 0.587g + 0.114b luma and draws glyphs procedurally in GLSL. https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders
   Error-diffusion dither is sequential, so keep it off the GPU path; Bayer is the right fit.

## What makes it feel premium
- Strict grid, one monospace face, no jitter.
- Few glyph classes per image; density carries the form.
- Colour comes from the underlying light, glyph hue lifted or complemented, highlights blown to near white.
- Motion is slow and local (ripple, scan), with a still frame for reduced motion.

## Suggestions for BU Proto
- Interpolate gradient in OKLCH via iris mid stop; drive glyph tint from the gradient sample at the cell centre.
- Map glyph size/weight to the sky/iris/rose meaning (small/medium/big).
- Let density fall off into harbor ground as sparse dashes (reference 57), not a hard mask.
