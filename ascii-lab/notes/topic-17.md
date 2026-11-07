# Topic 17: aurora, bioluminescence, iridescence, thin film as blue-pink references

Core idea: in all three, colour is a function of a hidden scalar (height, thickness, angle), not a fixed ramp. Drive glyph hue from that scalar and the gradient reads as light depicting something.

## Aurora
- Real curtains: green/teal base, violet-magenta fringe at the top edge, sharp bottom edge, soft fade up. Map to our palette: lagoon at the hem, iris mid, rose at the crown.
- Shader recipe: fold a 2D domain into vertical rays. Stretch noise strongly along y, sample fbm at (x*k + time, 0), and use it as ray brightness. Stack 2-4 layers at different scales and drift speeds. Fade with exp(-h) above the hem and smoothstep below it.
- For ASCII: use the curtain intensity to choose glyph density. Dense glyphs (#, %) on the bright hem, sparse (. :) on the fade. Rose appears only above a height threshold.
- Sources: https://tonisagrista.com/blog/2024/rendering-aurorae-nebulae/ (fbm raymarched curtains), https://godotshaders.com/shader/volumetric-aurora-borealis-with-polar-reflection/ (sky port with reflection), https://otik.zcu.cz/bitstream/11025/1242/1/Lawlor.pdf (volume aurora paper).

## Bioluminescence
- Look: dark water, small cold points that flare then decay, trailing glow along motion. Mint (our live accent) suits this role.
- Technique: spawn sparks in a grid cell with a hash; brightness = pow(1 - fract(t*rate + hash), 3) gives a fast flare and slow tail. Add a wake: when a disturbance passes a cell, set energy to 1 and decay by 0.95 per frame (ping-pong texture or a CPU array at glyph resolution).
- ASCII: flare picks the brightest glyph, tail steps down the density ramp, so the decay is visible as characters thinning out.

## Iridescence and thin film
- Physics: hue depends on optical path difference, roughly 2*n*d*cos(theta). Each wavelength gets cos(2*pi*OPD/lambda); mixing three wavelengths gives the oily rainbow.
- Cheap fake: cosine palette, colour = a + b*cos(2*pi*(c*t + d)), where t = thickness noise + k*(1 - dot(N,V)). Tune a, b, c, d so one cycle runs sky, iris, rose, iris deep. This stays in our hues, never green or yellow, and never goes grey.
- Thickness field: low-frequency fbm plus a slow vertical gradient, like a soap bubble draining. Fringes are bands; sharpen with a second cos at 2x frequency.
- ASCII: let t shift hue only, and let a separate luminance field choose the glyph. That separates colour and form.
- Sources: https://www.alanzucconi.com/?p=6823 (thin-film car paint, equations to code), https://blenderartists.org/t/cycles-pbr-thin-film-interference-iridescence-and-metals/672094 (cosine-fake thickness approach). Cosine palette formula is the well-known Inigo Quilez form (not fetched here).

## Takeaways for the lab
1. One hidden scalar, three mappings: hue (cosine palette), glyph density (luminance), motion (drift).
2. Lean pink at the crown or edge; blue stays low and quiet.
3. Rim and highlight blown to frost blocks, as in the mushroom reference.
