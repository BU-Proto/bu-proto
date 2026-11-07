# Topic 21: current ASCII tools and what they lack

Evidence quality: softsyntax.xyz and uxpilot.ai/labs/ascii-art-generator are JS apps. Fetch returned only a title and a cookie link, so feature lists below come from the BRIEF's reading of the screenshots, not from page text. Aino returned no search hits; treat it as unverified.

## What each tool does (and lacks)
- Soft Syntax (https://www.softsyntax.xyz/): char sets, colour modes, edge detection, reveal, blending. Lacks: colour is per-glyph sampled from the source, never a designed ramp. No gradient as light.
- UX Pilot ASCII Art Lab (https://uxpilot.ai/labs/ascii-art-generator): styles (characters, blocks, mixed, lines, diagonal, cross, diamond, braille), dark cut-off, blend modes, glow, RGB split, blurred backdrop. Lacks: the gradient is the photo's own colour. No gradient-map stage, no palette lock, no motion.
- Figma ASCII Studio Image (https://www.figma.com/community/plugin/1600856162777736392/ascii-studio-image): static export into frames. Lacks: animation, shader-grade colour.
- Oxide Mitos (https://github.com/oxidecomputer/mitos): internal brand-asset generator, built on play.core, a GLSL-flavoured ASCII library. Closest to our need: per-cell function of (uv, time). Tightly coupled to Oxide's design system, so it is not reusable. Idea to take: write the field as a cell shader.
- Ghostty shaders, e.g. Chromadrift (https://github.com/mfelix/chromadrift): full-screen gradient with noise dithering, needs custom-shader-animation = always. Gradient is behind text, never tinting glyphs.
- ascii-gradient-art (https://pypi.org/project/ascii-gradient-art/): colours text with gradient themes, terminal only, horizontal sweep.

## Common gap
All map luminance to a glyph, then colour the glyph by the photo. None run a gradient map first (luma -> palette ramp) and then pick glyph and hue from separate signals.

## Techniques to build
1. Gradient map: t = smoothstep(lo, hi, luma); colour = ramp(t) with stops harbor, cerulean, sky, iris, rose, peach. Interpolate in OKLab/OKLCH, or insert iris deep as a mid stop so the middle never greys.
2. Glyph from density: index = floor(t * (N-1)) into a ramp such as " .:+x#". Separate glyph hue: hue = ramp(fract(t + 0.5)) (complement, as in the cat reference) for contrast.
3. Cell shader: cell = floor(fragCoord / cellSize); sample the field at cell centre (not per pixel) so colour is flat per glyph; look the glyph up in an atlas texture with the sub-cell uv.
4. Blow-out: where t > 0.9, draw a solid block in frost; add a rim by thresholding the gradient magnitude of t and colouring it lagoon.
5. Stretched cells (57.png look): cell size (w, h) with h/w about 0.3, and a dash glyph; density falls off with t so the gradient dissolves into the ground.
6. Meaning-by-size: sky for small glyphs, iris medium, rose big, by mapping glyph scale tier to hue band.

## Most useful idea
Decouple three signals per cell: shape from a luminance field, colour from a designed gradient map, hue offset from the complement. That is the unclaimed gap.
