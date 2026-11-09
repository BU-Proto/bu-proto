# Topic 16: Colour field painting as a reference for light

Sources: https://www.theartstory.org/amp/artist/turrell-james/ , https://cdn.technologyreview.com/s/526566/enlightened-spaces , https://git.secluded.site/zed/commit/a46858ac21ec43b1af94d8b2b9a5a8fde4ac4f01 , https://blog.frost.kiwi/GLSL-noise-and-radial-gradient/

## What the references teach
- Rothko: stacked soft-edged rectangles, edges feathered so the field seems to breathe. Gradient is not a ramp across the canvas, it is a haze inside a shape. One accent field (rose) over a darker neighbour (harbor/raised) reads as glow.
- Turrell (Ganzfeld pieces): an undifferentiated field of one colour, no depth cue (term from Metzger's "complete field"). Perception dissolves edges. For a glyph field: reduce glyph contrast so the grid stops reading as texture and the colour reads as space.
- Turrell is reported to have been moved by the glow of a Rothko reproduction, which the originals lacked in person. Lesson: the luminous effect comes from controlled contrast between neighbouring fields, not raw brightness. Keep the surround dark (#061a2e).
- James Clar (light installations, from general knowledge, not verified here): saturated light bleeding into haze. Treat as the "bloom" reference.

## Techniques
1. Field as soft box: mask = smoothstep(0, w, sdBox(p)) with w about 0.15 of box size. Colour from palette by mask and a slow vertical coordinate; glyph density follows mask.
2. Two-band Rothko: two sdBoxes, upper iris to rose, lower cerulean to iris deep, gap 0.04 left near ground so the seam glows.
3. Ganzfeld mode: map glyph ramp to a narrow range (3 glyphs), cut glyph alpha to 0.25, let colour carry; drift hue slowly by t*0.02.
4. Aperture (Turrell sky-space): a rounded rect hole in dark, interior brighter at the edge than centre, so light seems to pool.
5. Interpolate in Oklab/OKLCH, through a violet mid, never a straight sRGB blend, to keep the middle from going grey.
6. Dither after the Oklab-to-sRGB conversion with triangular noise of about +/-2/255 (+/-3 for alpha), per the Zed gradient commit. Interleaved gradient noise: fract(52.9829189 * fract(dot(fragCoord, vec2(0.06711056, 0.00583715)))). Avoids banding on large dim fields.
7. Slow breathing: radius or intensity modulated by sin(t*0.15) at 1 to 3 percent. Rothko is still; motion should be near-subliminal.

## Palette mapping
Sky for small glyphs at field edge, iris for the body, rose for the core, peach/haze only at the hottest centre. Mint only as a live dot.

## Risk
Search gave no direct source on Rothko edge perception or Clar's technique; those are from general knowledge.
