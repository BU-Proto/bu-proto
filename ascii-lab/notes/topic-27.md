# Topic 27: Performance budgets for full-screen glyph shaders (laptops, phones)

Caveat: sources are blogs and docs, no official numeric budget exists. Treat figures as starting points, then measure.

## Core idea: shade per cell, not per pixel
An ASCII field is a low-resolution image. Cost should scale with cell count, not screen pixels.
- Cell grid: cols = ceil(w / cellW), rows = ceil(h / cellH). At 8x16 css px on a 390x844 phone that is ~49x53 = 2.6k cells. On a 1440x900 laptop ~180x56 = 10k cells.
- Compute colour and brightness ONCE per cell (sample the gradient at cell centre), then only look up the glyph coverage per pixel. In GLSL: `vec2 cell = floor(fragCoord / cellPx); vec2 uv = (cell + .5) * cellPx / res; vec2 local = fract(fragCoord / cellPx);` then `glyphIdx = int(lum * float(N-1))`, sample atlas at `vec2((glyphIdx + local.x) / N, local.y)`.
- Better still: render the cell field into a tiny texture (one texel per cell, or compute on CPU) and let a cheap second pass expand it. The beamterm WebGL2 renderer reports under 1 ms for ~16k cells in one instanced draw call, using packed per-cell data and a texture-array atlas: https://docs.rs/crate/beamterm-core/latest

## Pixel budget
- Cap DPR. Most sources say min(dpr, 2); shader-background guides go to 1.5 or render at half res and CSS-upscale. Dropping DPR 3 to 2 cuts fragments by ~55% ((2/3)^2 = 0.44). Glyphs are hard-edged and cell-quantised, so DPR 1 to 1.5 usually looks fine with a good atlas.
  - https://salivity.github.io/three.js/article/three-js-mobile-performance-limit-device-pixel-ratio
  - https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/
  - https://www.mintlify.com/paper-design/shaders/concepts/performance
- Rule of thumb budget: aim for fewer than ~2-3 million fragments per frame at 60 fps on phones, with under ~30 ALU ops and 1-3 texture reads per fragment. Mine, not sourced.

## Adaptive loop (cheap to build)
1. Time 30 frames with performance.now(). If the average exceeds ~20 ms, drop the resolution scale by 0.25 (floor 0.5). Recover slowly.
2. Pause the loop with IntersectionObserver when the hero is offscreen and on document.hidden.
3. Under prefers-reduced-motion render one frame and stop.
4. Gradient motion rarely needs 60 fps: update the colour field at 30 fps, keep cursor response at 60.

## Shader hygiene
- Avoid per-fragment loops (noise octaves): 2 octaves max on mobile, or bake noise into a 256x256 tileable texture and scroll it.
- Use mediump for colour maths, highp only for coordinates. Guard with `#ifdef GL_FRAGMENT_PRECISION_HIGH` in WebGL1 (WebGL2 guarantees highp): https://macmyths.com/how-to-optimize-webgl-shader-performance-on-mobile/
- No dependent-texture chains, no discard, no transparent overdraw: one opaque full-screen triangle. Overdraw of 3-4 layers can halve the frame rate (https://abratabia.com/webgl/webgl-mobile.php).
- Palette as a 1D lookup texture (OKLCH-baked blue to violet to rose) instead of per-pixel OKLCH maths.
- Glyph atlas: one 2D texture of ~10-16 glyphs ordered by ink density, 64x64 per glyph at most; a few KB to <1 MB.

## Fallback tiers
Tier A: full shader, DPR 1.5. Tier B: 0.75 scale, 30 fps. Tier C: static pre-rendered frame.
