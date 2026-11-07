# Shape vectors and contrast enhancement for sharp ASCII in WebGL

Source: Alex Harri, https://alexharri.com/blog/ascii-rendering (primary). Summaries also at https://www.gigazine.net/gsc_news/en/20260119-ascii-rendering and https://flowingdata.com/2026/02/05/ascii-art-visually-explained/. Python port: https://pypi.org/project/img2contourascii/. npm: ascii-shape-renderer (pkgstats). I found no published shader code; snippets below are my own sketches.

## Why it matters
Brightness-only ramps treat a cell as one pixel. Edges jag (nearest sample) or blur (supersample). Matching by glyph SHAPE gives edge-following glyphs (/ | _ -) and reads as higher resolution. This is the "sharp line glyph" look of the mushroom reference.

## Technique
1. Shape vector: per glyph, coverage (ink fraction, 0..1) inside N sampling circles laid across the cell. Harri uses 6 staggered circles (3 rows x 2 columns, offset) so p/q, / and \ differ. 2 circles (top/bottom) is the cheap start. Bake offline: draw each glyph to a 2D canvas, count ink per circle. Normalize each component by the max across the whole set so vectors spread out.
2. Sample vector: same 6 circles over the source luminance. In a fragment shader: per cell, 6 taps (or a few mip-bias taps) at circle centres, radius approximated by textureLod.
3. Global contrast: v' = max * pow(v / max, k), max = largest component of the cell vector, k about 1.5 to 3. Dark components sink, light stay: sharpens boundaries, smooth gradients survive.
4. Directional contrast: add "external" circles reaching into neighbours (up, down, left, right, diagonals). For each internal component i, with outside sample o_i: v_i' = max(0, v_i - w * max(0, o_i - v_i)), w about 0.5. Removes the staircase where a global pass leaves stepped edges. Let one outside circle influence several adjacent internal components.
5. Lookup: nearest glyph by Euclidean distance. CPU used a k-d tree plus a cache keyed by 5-bit-quantized components. On GPU, brute force N glyphs x 6 dims is fine for 10 to 30 glyphs: loop in the shader over a uniform array of vectors, keep the min distance, then read the glyph from an atlas texture (cell-local uv + glyph index).

## Shader sketch (GLSL ES 3.00)
```
float best=1e9; int id=0;
for(int g=0; g<NG; g++){ vec3 a=gv[g].a-s.a; vec3 b=gv[g].b-s.b;
  float d=dot(a,a)+dot(b,b); if(d<best){best=d;id=g;} }
float ink = texture(atlas, (vec2(id,0)+cellUV)/vec2(NG,1)).r;
```
Pack the 6 components as two vec3.

## For our gradient work
- Do matching on luminance only; colour is separate. Tint the glyph with the gradient sampled from the underlying colour, and keep the glyph shape sharp. Blown highlights: if v max is above a threshold, force the block glyph.
- Pass k and w as uniforms; animate k slightly for a shimmer without cost.
- Atlas at devicePixelRatio, NEAREST or slightly LINEAR, to keep strokes crisp.
- Keep the set small (` . : - = + x / | # block`) so line glyphs dominate at edges.
- Reduced motion: render one frame.
