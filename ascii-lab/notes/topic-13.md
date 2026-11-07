# Topic 13: Complementary and simultaneous contrast, Albers, vibration (small marks on colour)

## Core ideas
- Simultaneous contrast (Albers, Interaction of Color): a colour shifts toward the complement of its surround. A pale glyph on cerulean drifts warm; a sky glyph on rose drifts green-cyan. Summary: https://art162.community.uaf.edu/wp-content/uploads/sites/540/2015/07/Lesson-7-Color-relationship.pdf
- Albers' point: identical marks look different on different grounds, so choose glyph colour by what the viewer will see against the local ground, not by its hex.
- Vibration: two hues of equal lightness at a shared edge shimmer. Chromostereopsis (red/blue edges looking at different depths, strongest on dark grounds) is the extreme case. Sources: https://en.wikipedia.org/wiki/Chromostereopsis , https://www.frontiersin.org/articles/10.3389/fpsyg.2015.00337
- Luminance contrast also matters in those studies, so an equal-lightness pair is not automatically safe. Thin 1px strokes make it worse.

## Techniques for the glyph field
1. Two-axis rule: glyph and ground differ in lightness (OKLCH L gap) by at least 0.25 when the marks must read, or at most 0.04 when they should dissolve. Avoid the middle at a hue gap near 180 degrees (rose on cerulean), where vibration peaks.
2. Complement-nudge (the cat reference): glyph hue = ground hue + 150..180 degrees, but pull chroma down to about 60% of the ground's and move L by +/-0.2. You get the pop without the shimmer.
3. Shader sketch: `vec3 g = oklch(L_bg + dL, C_bg*0.6, H_bg + 160.0);` then `col = mix(bg, g, glyphMask * k)`. Raise k only where `abs(dL) > 0.2`.
4. Exploit vibration on purpose in small doses: put a single rose glyph row over cerulean at matched L as a "live edge" shimmer. Keep it to under 5% of cells so it reads as light, not noise.
5. Separate the pair with a halo: a 1-cell darker harbor (#061a2e) or frost ring between rose and blue kills vibration (Albers: a neutral divider calms adjacent hues).
6. Lean on the palette: sky/iris/rose on harbor ground has big L gaps, so it is safe. Rose over cerulean needs the dL rule. Mint stays small and sits only on dark ground.
7. Dark grounds amplify the red/blue depth split, so keep raspberry out of direct contact with cerulean glyphs. Put iris deep between them, as a violet mid stop.
8. Blow-out: let highlight glyphs go to frost (#f6fbff). White has no hue conflict with any ground and reads as light (the mushroom look).

## Test
Render a 3x3 grid of ground hues against 3 glyph hues at dL = 0, 0.1, 0.25. Judge at arm's length and at 50% scale. Shimmer shows at dL = 0.

Sources searched: UAF handout, Wikipedia, Frontiers 2015, Kitaoka chromostereopsis entry https://www.psy.ritsumei.ac.jp/akitaoka/Kitaoka2015_ReferenceWorkEntry_Chromostereopsis.pdf . Numeric thresholds (0.25, 0.04, 60%) are my working heuristics, not from sources; verify in the test grid.
