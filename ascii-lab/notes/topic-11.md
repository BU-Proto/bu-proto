# Bright-pass bloom on text: glow without smearing legibility

Bloom recipe: extract bright pixels, blur, add back at an intensity. Blur turns a tiny highlight into a soft halo ([napolitain.github.io/graphics/bloom](https://napolitain.github.io/graphics/bloom), [Shader Lab bloom](https://easymaking-site.pages.dev/shader-lab/32-bloom.html)). Threshold is the fog-vs-polish knob.

## Core technique, in our terms
1. Render glyph field to texture A at full res (crisp, no glow).
2. Bright pass at half or quarter res. Use a soft knee, not a hard cut:
   `br = max(r,g,b); w = clamp(br - T + K, 0, 2K); w = w*w/(4K+1e-4); w = max(w, br - T) / max(br, 1e-4); bright = col * w`
   Scaling the colour (not clamping to white) keeps hue. A forum thread warns that per-channel clamping shifts hue, e.g. purple turning red ([gamedev.net](https://www.gamedev.net/forums/topic/632644-best-way-to-filter-for-a-bloom-effect/)). For us: iris stays iris, rose stays rose.
3. Blur the bright buffer: separable Gaussian, or a down/up mip chain (cheaper, wider, softer). 5 to 6 levels, sum with weights decaying about 0.5 per level.
4. Composite: `out = A + bloom * I` with I around 0.4 to 0.8. Prefer screen blend `1-(1-A)(1-bloom*I)` so it never clips hard.

## Legibility rules
- Keep the sharp glyph layer separate and drawn last (or added at full strength) so the halo only sits behind. One engine gives UI text zero emission so it never blooms ([docs.rs proof-engine](https://docs.rs/proof-engine/0.2.2/proof_engine/render/postfx/bloom_pipeline/index.html)). Do the same for body copy over the hero.
- Make emission a per-cell value, not per-pixel luminance. One article packs extra per-cell data (selective bloom) into spare channels of the post input ([offscreencanvas.com](https://offscreencanvas.com/issues/advanced-ascii-rendering/)). Cell emission = field brightness, so only highlight glyphs glow.
- Proof Engine renders colour plus an emission attachment, bloom reads only emission, glyph atlas is SDF with halo ([docs.rs pipeline](https://docs.rs/proof-engine/0.2.1/src/proof_engine/render/pipeline.rs.html)). In WebGL2 use two colour attachments (MRT).
- Blur radius at least 1.5 to 2 cell widths, else halos fill the gaps between glyphs and the grid turns to mush. Wide, low-gain halo beats tight, strong halo.
- Tint the halo toward the hue ahead on the arc (sky glyph -> lagoon haze, rose glyph -> peach core) rather than white. Reserve white for the few blown-out block cells, as in the mushroom reference.
- Dim the glyph under its own halo slightly: `A *= 1 - 0.15*bloom` keeps stroke contrast in dense areas.
- Test: contrast of the glyph against its own halo must stay above about 3:1 for any text meant to be read.

## Cheap canvas fallback
No shaders: draw glyphs, then drawImage the same canvas scaled to 1/4 onto a second canvas with `filter: blur(6px)` and `mix-blend-mode: screen` above it. Cost is one small blur per frame.

## Gap
No source measured text contrast under bloom. Verify on our own ground (#061a2e).
