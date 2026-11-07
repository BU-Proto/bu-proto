# Glyph atlas techniques in WebGL2: SDF fonts, texture arrays, instancing

Sources: beamterm docs https://docs.rs/beamterm-renderer/latest/beamterm_renderer/struct.FontAtlas.html ; xterm.js DynamicCharAtlas https://github.com/xtermjs/xterm.js/blob/74474da7f32ff7cbfdd120ba6adf04efaed3cb69/src/renderer/atlas/DynamicCharAtlas.ts . Search coverage of SDF was thin; SDF and shader parts below are my own technique notes, not confirmed by those sources.

## What named examples do
- beamterm (WebGL2 terminal renderer): a TEXTURE_2D_ARRAY, glyphs in layers (some versions pack a grid of glyphs per layer). One static quad is instanced over every cell; per-instance data carries position, char, colour. One VAO, one draw call. ASCII glyph id = char code (plus style bits), so no lookup table.
- xterm.js: rasterises glyphs on demand to a canvas atlas and caches them. Blending lets overlapping glyphs be drawn from the atlas.

## Recipe for our field
1. Build the atlas at load with a 2D canvas: draw each ramp glyph (ui-monospace, Menlo stack; no web fonts) into a fixed-size cell, upload as one texture. Ramp ordered by ink density, e.g. ` .:+x*#%@` plus line glyphs (/ | + x diamond) for edge direction.
2. One instanced draw: quad of 4 vertices, `gl.vertexAttribDivisor` = 1 on a per-cell buffer. Cells need no buffer at all if you derive them from `gl_InstanceID`: `cell = ivec2(id % cols, id / cols)`.
3. Vertex shader samples the source field (a small gradient/subject texture, one texel per cell) with `texelFetch`. Luminance picks glyph index: `idx = int(floor(l * float(N-1) + dither))`. Pass idx and the colour to the fragment stage as flat varyings.
4. Atlas as a single-row strip is simplest: `uv = vec2((idx + quadUV.x) / N, quadUV.y)`. Use a texture array only if you want per-glyph layers, which avoids bleed between neighbours and allows mipmaps per glyph.
5. Fragment: `float a = texture(atlas, uv).r;` colour = glyph colour * a over the gradient beneath.

## SDF for glyphs
- Store a signed distance in the atlas (8-bit, 0.5 = edge). Sample, then `a = smoothstep(0.5 - w, 0.5 + w, d)` with `w = fwidth(d)` so edges stay crisp at any scale and in motion.
- Free effects from the same texture: glow = `smoothstep(0.25, 0.5, d)` as a halo in the rose or sky tint; outline = band around 0.5; weight animation = move the threshold (0.5 +/- 0.1) to make glyphs swell where the gradient is brighter, so tone is carried by thickness as well as by glyph choice.
- Cheap SDF generation with no network: render glyph large on canvas, run a two-pass distance transform (8SSEDT or Felzenszwalb) in JS once at load.
- Plain bitmap atlas is enough for mono ASCII at a fixed size; SDF pays off when cells scale (zoom, breathing grid) or when you want glow.

## Pitfalls
- Disable mipmap bleed: pad each cell by 1-2 px, or use NEAREST for bitmap atlas.
- Keep the atlas cell a power of two where convenient; use `gl.pixelStorei(UNPACK_PREMULTIPLY_ALPHA_WEBGL)` deliberately.
- Rebuild the atlas on context loss; keep the canvas around.
- Honour prefers-reduced-motion: render one frame and stop the loop.

## Design hooks
- Glyph colour from the complement or a shifted hue of the gradient beneath (cat reference) is one extra `mix` in the fragment.
- Blown-out highlights to white blocks: when luminance > 0.92, force idx to a full-block glyph and colour to frost.
- Dissolve into ground: raise a dither threshold so low-luminance cells select the empty glyph, leaving sparse dashes (the "this" reference).
