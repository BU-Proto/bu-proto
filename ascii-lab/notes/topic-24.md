# Depth in text-mode: layered glyph planes, parallax, fog, focus by glyph density

Search found no source covering fog or multi-layer glyph compositing in a WebGL ASCII shader. Treat the recipes below as our own construction, built from the cited partial precedents.

## Core idea: one depth value d in [0,1] drives every cue
Matrix-rain WebGPU write-up derives a per-column depth and uses it for speed, brightness and edge softness. Far = slow, dim, soft. Near = fast, bright, crisp. Setting depth to a constant flattens the field, so it doubles as an off-switch.
https://chicio.github.io/matrix-rain-webgpu/how-it-works/parallax/

## Layered glyph planes
- Run 3 to 4 planes (far, mid, near), each its own cell grid with a different cell size. Far cells are small, near cells are large. Scale alone sells depth.
- Per plane, sample the glyph atlas at cell centre, then composite far to near: `col = mix(col, planeCol, planeCoverage)`.
- Parallax: offset each plane's grid by `scroll * k * (1.0 - d)` or by pointer, `uv += (mouse - 0.5) * k / depthScale`. Snap offsets to whole cells so glyphs never smear.
- Map the meaning rule to depth: sky glyphs far and small, iris mid, rose near and large.

## Fog
- Exponential fog: `f = 1.0 - exp(-density * d)`. Optionally start at a near depth, as in ZFogExponential: https://docs.yuelili.com/en/sapphire/other-stylize/zfogexponential
- Fog does two things. It tints toward the ground, `col = mix(col, harbor, f)`. It also thins density, so the glyph ramp index is lowered: `idx = floor(lum * (1.0 - f) * N)`. Far glyphs shrink to `.` and `,`, then vanish into #061a2e.
- Tint fog toward iris deep, not grey, so the middle never dulls. Keep rose as the near light.

## Focus by glyph density
- Define a focal depth `z0`. Blur amount: `c = clamp(abs(d - z0) * aperture, 0, 1)`. The D5 depth-of-field write-up describes blur growing with distance from focus: https://www.d5render.com/ja/posts/whats-z-depth-and-how-to-use-it/
- Text-mode blur, no real blur pass. In focus: the full ramp (` .:-=+*#%@`) and crisp glyphs. Out of focus: collapse to a 2 to 3 step ramp, dither with a Bayer threshold, and widen the glyph's antialias band: `smoothstep(0.5 - w, 0.5 + w, glyphAlpha)` with `w = mix(0.05, 0.4, c)`.
- Bokeh option: a defocused highlight becomes one big `o` or `O` glyph with a soft edge.

## Z-buffer for 3D subjects
For a procedural mushroom, write depth per cell and keep the nearest hit, as the zoa rasterizer does: https://docs.rs/crate/zoa/latest/source/src/renderer/rasterizer.rs. Luminance equals normal dot light. Feed that depth into the fog and focus terms above.

## Pitfalls
- Per-glyph shape matching beats treating cells as pixels, which aliases: https://news.lavx.hu/article/ascii-characters-are-not-pixels-a-deep-dive-into-ascii-rendering
- Never change cell size continuously within one plane, or glyphs swim. Quantize.
- Keep the plane count low for 60fps. Each plane is one atlas lookup per pixel.
