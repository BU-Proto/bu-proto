# Synthesis: ASCII on gradient for BU Proto

From topics 01-30 (T-numbers) and references 55-59 (56 and 58 are identical). OKLCH and contrast figures are computed from the brief's hexes. Other thresholds are heuristics, to test by eye.

## Techniques that matter
1. **Separate the signals (T03, T06, T21).** Shape, colour and tone each get their own field. Everything below depends on this.
2. **Resolve per cell (T22, T27).** Sample at cell centre, keep colour flat across the glyph, do only the atlas lookup per pixel.
3. **Own the glyphs (T05, T07).** Canvas-built atlas, ordered by measured coverage.
4. **Match shape in the bright pass only (T03, T04).** Line glyphs follow edges there. That is the mushroom's structure.
5. **Dither between stops, not only glyphs (T09, T14).** Bayer suits the strict grid and stays stable in motion. Blue noise suits organic subjects.
6. **Per-cell emission (T11).** Bloom reads emission; sharp glyphs composite on top.
7. **Fix the invariants (T29).** Grid, glyph set, arc and dissolving edge stay constant. Seed, crop and subject vary.

## What the references actually do
- **55 cat:** glyph contrast carries figure and ground. Over teal, glyphs sit close to their ground and fade. Over the subject they pop.
- **59 mushroom:** polarity flips with tone. Thin dark ticks in shadow, frost line glyphs in highlights, sparse marks between. No note caught this.
- **57 "this":** the same grid thinned, cells narrowing to dashes.

## What has genuinely not been done
T21 could not read Soft Syntax or UX Pilot page text, and T22 could not confirm colour on any Awwwards entry. So say "not found", never "never seen".

**Tinted glyphs are not unclaimed.** Midjourney ASCII Swirl runs "gradient ink" through a glyph field (T23), and ascii-gradient-art tints terminal text (T21). The brief's earlier finding needs narrowing.

Not found in anything checked:
- A palette-locked gradient map, with shape, hue and tone on separate fields (T21).
- Colour from a physical quantity such as thickness, not brightness (T17, T18).
- Quadtree glyph size in a shader (T25).
- Rose-led text-mode on navy (brief).

## Colour rules
The palette falls into rails:

| Rail | Stops | L |
|---|---|---|
| Ground | harbor, raised, #123a5c | 0.21-0.34 |
| Deep | raspberry, iris deep, cerulean | 0.57-0.61 |
| Light | iris, peach, sky, rose | 0.77-0.80 |
| Blow-out | frost | 0.985 |

1. **The light rail is isoluminant.** Rose, sky and iris differ only in hue, so light-on-light glyphs vibrate or vanish. Use that for dissolves, never where marks must read.
2. **Glyphs read by crossing rails.** Light on ground; frost or harbor on deep or light. Deep to light is only dL 0.2, below T13's 0.25, so treat it as texture.
3. **Hue +180 leaves the palette.** Rose +180 is h176, green-teal, so T06, T15 and T21 need correcting. Our complement is arc reflection, t' = 1 - t: rose under, lagoon or sky over. Iris maps to itself, so flip lightness there.
4. **Never blend sky to rose directly.** Oklab midpoint chroma is 0.05 against about 0.10 at the ends: that is the grey. The gap is 120 degrees, not T15's 100. Use spans under 60 degrees through iris, a baked LUT, and chroma reduction on gamut clip.
5. **Chroma is low.** The light rail tops out at C 0.13. Raspberry (0.17) and iris deep (0.17) carry saturation in large areas. Spend area on rose; keep blue small.
6. **Rose on cerulean is 1.9:1,** the vibration zone. Keep raspberry off cerulean glyphs; put iris deep between (T13).
7. **Warmth is a core.** Peach, then haze, then frost at the hottest point.
8. **On harbor:** sky 9.5, rose 9.0, iris 8.5, cerulean 4.8, iris deep 4.3, raspberry 3.6. The last two need dense glyphs.
9. **Copy.** Frost fails on cerulean (3.5:1) and rose (1.9:1). Cap quiet zones at #123a5c (11.3:1) with a scrim (T28), or set harbor copy on the rose band (9.0:1).
10. **Mint** stays a separate channel, 1-2 cells, on dark ground, meaning live.

## Conflicts to settle
- Decode at 12 Hz (T23) against the 3 Hz caution (T28): keep it local and staggered, never field-wide.
- Cell size at least 10-12px (T28) against 8x16 (T27): choose per piece.

## Ten unexplored directions
1. **Thin-light mushroom.** Raymarched cap at cell resolution, colour from inverse thickness: stem deep, gill edges rose, rim lagoon, peach core, frost blocks (T18, T19).
2. **Polarity field.** Harbor ticks in shadow, nothing at midtone, frost strokes in highlights.
3. **Divisionist arc.** No interpolation. Each cell picks one pure stop by threshold; the eye makes the middle (T14).
4. **Light overprint.** Sky, iris and rose plates on rotated grids, screened. Iris appears at overlaps; moire becomes the mark (T10).
5. **Draining film.** Hue from thin-film thickness, glyph from separate luminance (T17).
6. **Size is colour.** Mip pyramid as implicit quadtree. Level sets glyph size and stop, so sky-small to rose-big is literal (T25).
7. **Hue sort.** Stretched rows sorted by arc position, rose dragging into harbor as dashes (T26).
8. **Overstrike ribbon.** More strikes means rose. Real words as fill: readable close, image far (T20).
9. **Mycelium.** Gray-Scott at glyph resolution, cursor-seeded. One mint cell marks the growing tip (T23).
10. **Focus pull.** Depth collapses the ramp and softens glyphs. Rose near, sky far, iris-deep fog (T24).

First pair to try: 1 with 2.
