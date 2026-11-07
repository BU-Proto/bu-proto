# Topic 26: stretched-cell / dissolve-edge gradient (ref "this", 57.png) and pixel sorting

## The look, decomposed
Reference 57: a gradient quantised into wide rectangular cells (aspect roughly 4:1 to 8:1), whose edge dissolves into the harbor ground as sparse horizontal dashes. Three separable ideas:
1. Anisotropic grid: cell = (cw, ch) with cw >> ch. Snap uv: `c = floor(uv*grid)`, grid.x small, grid.y large.
2. Threshold dissolve: per-cell `d = bayer(c) or hash(c)`; draw cell only if `coverage(x) > d`, where coverage falls from 1 to 0 across the dissolve edge. Animate by sliding the edge, not by re-rolling noise.
3. Glyph degradation: as coverage drops, swap block, then `=`, then `-`, then `.`/blank. The dash is simply the low-density glyph of a horizontal-biased ramp.

## Formulas (own words)
- Edge coverage: `cov = 1.0 - smoothstep(e0, e1, dist)`, `dist` = signed distance to a shape or a x-axis ramp. Dissolve width `e1-e0` about 0.25 of the shape.
- Ordered dither threshold, 4x4 Bayer, normalised `(M[y%4][x%4]+0.5)/16`. On stretched cells, index Bayer with cell coords, so the pattern stretches too, which reads as dashes. Source of Bayer shader examples: https://docs.rs/crate/par-term/latest/source/shaders/dither.glsl (CC BY-NC-SA, study only, do not copy). Matrix sizes 2x2 to 64x64: https://git.bendn.org/remapper/plain/src/ordered.rs
- Glyph pick: `idx = floor(clamp(cov - d + 0.5, 0., .999) * N)` into a ramp atlas.
- Colour: sample gradient by x-ramp t, mixed in OKLCH through iris. Dissolve fades alpha only. Do not fade to grey or black.
- Row jitter: offset the threshold per row, `d += (hash(row)-.5)*0.3`, so dashes break into ragged horizontal streaks.

## Pixel sorting
Classic sort: select runs of pixels whose luminance sits inside a [lo, hi] window, sort each run by a key (luminance default), ascending or descending. Window and key conventions: https://docs.beutl.beditor.net/reference/library/filter-effects/pixel-sort
- Fragment shaders cannot sort a row directly. Approximate with odd-even compare-and-swap passes on ping-pong framebuffers, alternating odd/even each pass, with the threshold window gating swaps. Reference implementation (Godot, per-channel lo/hi, no diagonals): https://remotebranch.eu/ChaoticByte/Fragmented/src/branch/main/shaderlib/pixelsort.gdshaderinc
- Real per-row sorting needs compute shaders or CPU (https://beatsyncpro.ai/glossary/pixel-sort.html).
- Cheap canvas route for our grid: the field is only about 120x50 cells. Sort cells on the CPU per row, once per second, or per frame on a few rows. Cost is trivial.

## Design ideas for BU Proto
- Sort the gradient columns, not a photo: take the stretched cell field, sort each row's runs by hue-key (sky < iris < rose). Rose streaks drag rightward into the ground like a smear, a signature "never seen" move.
- Dissolve edge as the sort boundary: runs above the window stay crisp, below it become dashes.
- Mushroom: sort only the highlight pass so glow streaks off the cap, keep rim cerulean.
- Mint reserved for one live cell.
- Reduced motion: freeze the edge at t=0.6.

Not verified: ciphrd.com sorting article (cited by the Godot lib), not fetched.
