# Topic 08: Gradient maps and posterisation (the cat-style duotone look)

## Recipe (4 steps)
1. Luminance: l = dot(rgb, vec3(0.2125, 0.7154, 0.0721)) (Rec.709 weights, per the Godot posterize shader: https://godotshaders.com/shader/outline-posterization-color-palette-and-dithering/).
2. Posterise: l' = floor(l*N + 0.5)/N, N = 4 to 6. Hard bands are the "cat" look; N=3 is poster, N=8 is smooth.
3. Gradient map: sample a 1D ramp at l'. A 256x1 texture LUT works (https://webgpufundamentals.org/webgpu/lessons/webgpu-1dlut.html). Duotone is the two-stop case. Mix with the original via a uniform for a soft-to-hard dial.
4. Glyph pass on top: choose glyph hue as the complement or shifted stop of the band beneath (reference 55.png).

## For our palette
Ramp stops, dark to light: harbor #061a2e, #123a5c, cerulean, sky, iris, rose, peach/haze (field only). Build the ramp in OKLCH or add the iris-deep stop so the middle never greys. Bias the ramp so rose owns the top 40% of luminance (lean pink).
Skip LUT textures: a uniform array of 7 vec3 plus a step-mix is enough:
  float t = l' * 6.0; int i = int(floor(t)); col = mix(P[i], P[min(i+1,6)], smoothstep(0.,1.,fract(t)*k));
Large k (e.g. 8, clamped) gives hard bands with a thin soft seam; k=1 gives a smooth map.

## Dithering at band edges
Add a Bayer 4x4 threshold to l before posterising: l = l + (bayer(px)-0.5)/N. Bands then break into a regular stipple at their borders, which pairs naturally with a strict glyph grid (par-term example: https://docs.rs/crate/par-term/latest/source/shaders/dither.glsl, CC BY-NC-SA, so write your own; MIT reference: https://github.com/niccolofanton/dithering-shader). Use the dither cell = glyph cell so stipple density picks the glyph (: then + then #).

## Palette snapping alternative
Nearest-colour search in OKLAB beats RGB distance for perceptual accuracy (https://zff.dev/Aurora_Bee/posterize-to-palette). Useful when posterising a procedural subject straight to our 7 colours instead of by luminance.

## Ideas to try
- Animate the ramp offset (t + time*0.05) so bands flow while the subject stays still: "light moving through" rather than decoration.
- Mushroom: posterise a procedural height/light field; rim band cerulean-to-lagoon, cap rose/raspberry, highlights blown to frost.
- Per-band glyph set: dark bands empty, mid bands : = +, top band # %, so tone and glyph density agree.
- Keep mint out of the ramp; use it only for a live dot.

Caveat: searches gave no verified full GLSL gradient-map snippet; the code above is my own sketch.
