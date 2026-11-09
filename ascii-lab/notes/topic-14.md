# Topic 14: Colour perception of small text marks

Sources: https://en.wikipedia.org/wiki/Divisionism , https://tate.org.uk/art/art-terms/neo-impressionism , https://en.wikipedia.org/wiki/Ordered_dithering , https://www.doc.surf/wiki/ordered-dithering . The glyph-coverage maths below is my own derivation; no source covered it directly.

## Core ideas
- Chevreul (1839, De la loi du contraste simultane des couleurs): neighbouring colours push each other toward their complements. Seurat and Signac (Tate: "Divisionism", not "pointillism") put contrasting dots side by side so the eye mixes them.
- Partitive (optical) mixing: below the eye's resolving size, marks fuse into one colour. Fusion is additive and happens in light, not pigment, so the mix stays brighter and cleaner than a pigment blend.
- A glyph field has two scales. Zoomed in you read glyphs; zoomed out you read their average. Design for both.

## Techniques
1. Effective colour of a cell, computed in linear light:
   `avg = encode( c*lin(ink) + (1-c)*lin(ground) )`, where `c` is glyph ink coverage (about 0.05 for `.`, 0.15 for `-`, 0.35 for `+`, 0.6 for `#`) and `lin` is sRGB decode. Mixing in sRGB gives a darker, muddier result. The Inkscape forum thread on halftone vs dither describes this mismatch (a 50% dot pattern looking darker than 50% grey).
2. Gradient by glyph colour, not glyph density alone. A rose glyph on a harbor ground (#061a2e) averages to a dusty rose-navy. The blend point is set by `c`, so the same hue can read bright or deep.
3. Complement flicker (Chevreul): put iris #b6aaff glyphs on a cerulean-tinted ground, or rose on lagoon. Hue contrast between glyph and ground gives shimmer. It also keeps the mid gradient from greying, which matters because the blue-to-pink average of two hues passes through neutral. Interleave glyphs with a violet mid hue, or interpolate in OKLCH.
4. Divisionist trick: for a mid-tone, do not blend. Choose per cell between two pure stops with a threshold, for example `step(bayer4(cellXY), t)`, so the mix happens in the eye. Colour stays saturated.
5. Shader sketch (glyph atlas in `uAtlas`):
   `float cov = texture(uAtlas, glyphUV).r; vec3 col = mix(ground, ink, cov);`
   Mix in linear: `pow(col, vec3(1./2.2))` at the end. Add a +-0.03 per-cell hue jitter so large areas do not band.
6. Scale rule: cells under about 8px at typical viewing distance fuse, so use partitive logic there (sky, small). Cells over about 14px stay discrete, so use Chevreul contrast (rose, big). This matches the sky/iris/rose size meaning.
7. Colour comes from hue and coverage together. Raising `c` toward the highlights (`#`, white blocks) behaves like Seurat's lightening. Keep lowest-coverage glyphs in the cool shadow.

## Pitfalls
- Anti-aliased thin glyphs lose coverage on 1x displays, so the average shifts darker. Check on 1x and 2x.
- A gradient seen through a mid-gap of dark ground reads as a dark overlay, so keep the ground a raised navy #0b2a46 rather than the deepest value.

## Most useful idea
Average in linear light using glyph coverage, and keep the pure stops unblended.
