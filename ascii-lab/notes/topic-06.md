# play.core, ertdfgcvb, per-cell colour

## What play.core is (verified)
Andreas Gysin's ASCII playground, https://play.ertdfgcvb.xyz/. Hooks: boot(), pre(), main(), post(). main(coord, context, cursor, buffer) runs once per cell, like a fragment shader that emits glyphs instead of pixels (https://korben.info/en/ertdfgcvb-live-coding-ascii.html). Manual: https://play.ertdfgcvb.xyz/abc.html

- coord = {x, y, index}. context = {frame, time (ms), metrics.aspect}.
- Return a char, or {char, color, backgroundColor, fontWeight}. Colours are CSS strings. Weights snap to 300/400/700.
- metrics.aspect is the glyph width/height ratio. Multiply x by it before any distance or angle, or circles turn into ovals.
- Named examples worth reading: demos/doom_flame_full_color, contributed/color_waves, camera/camera_rgb, basics/how_to_draw_a_circle.

## Takeaways
- Gysin says he mostly keeps work flat and treats colour as a departure from pure ASCII (https://brightmoments.io/quarterly/andreas-gysin). Colour per cell is therefore open ground, and our rose-heavy gradient is the departure.
- Weight is a free third channel: pick 300 for the dim end, 700 for highlights, so brightness reads without extra hue.

## Technique: one scalar drives glyph, colour and weight
Compute a field v in [0,1] per cell (aspect-corrected x, y, time). Then:
1. glyph = ramp[floor(v * n)], ramp ordered sparse to dense: ` .:+x#`.
2. colour = gradient(g), with g a second, slower field, not v itself. Decoupling lets a dense glyph sit on a blue cell and a sparse one on a pink cell, so the colour reads as light and not as a density map.
3. weight = v > 0.85 ? 700 : 300.

## Gradient in-cell (my own formula, not from the sources)
Stops: harbor, cerulean, sky, iris, rose, raspberry. Interpolate in OKLab/OKLCH, or insert iris deep as the mid stop, to avoid grey midpoints. Bias the position: g' = g^0.7 pushes the area toward pink. Add a rim: where |grad v| is large, lerp colour toward lagoon (cyan edge, as in the mushroom reference).

## Shader (WebGL2) version
Draw the glyph atlas as a texture. Per fragment: cell = floor(uv * grid); cellUV = fract(uv * grid); sample the field at the cell centre, not per pixel, so colour stays flat across the cell. Pick the atlas tile by v. Output atlasAlpha * colour(g), plus a cheap glow: mix in 0.15 * colour of the neighbour cell.

## Complement trick (from the cat reference)
For glyphs over an image layer, hue-rotate the underlying colour by about 180 degrees in OKLCH, keeping lightness at or above the backdrop's. Blue under, peach/rose glyph on top.

## Performance
Canvas 2D: pre-render each glyph in each of about 16 quantised colours to an offscreen atlas and drawImage. Avoid per-frame fillText plus fillStyle churn. With a 2D context, 120x60 cells is fine.

## Reduced motion
Render one frame at fixed time and stop the loop.

Sources: https://play.ertdfgcvb.xyz/ ; https://play.ertdfgcvb.xyz/abc.html ; https://korben.info/en/ertdfgcvb-live-coding-ascii.html ; https://brightmoments.io/quarterly/andreas-gysin
