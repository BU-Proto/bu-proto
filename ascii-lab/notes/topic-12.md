# Topic 12: Glyph chromatic aberration, RGB split, phosphor and CRT colour

Sources: Lottes CRT (https://docs.libretro.com/shader/crt/ , https://sources.debian.org/src/dosbox-x/2025.10.07%2Bdfsg-1/contrib/glshaders/crt-lottes.glsl), Lottes+halation thread (https://forums.libretro.com/t/crt-lottes-multipass-with-halation-diffusion/17620), RGB-split basics (https://glslhacker.geeks3d.com/20101008/shader-library-chromatic-aberration-demo-glsl). Search snippets only; formulas below are my own restatement, untested.

## 1. Split the glyph, not the screen
Render the glyph atlas sample three times, one per channel, each offset along a radial or fixed axis:
`d = (uv - 0.5) * k; r = tex(uv + d).r; g = tex(uv).g; b = tex(uv - d).b`
Per-cell variant: sample the atlas inside the cell with offset `px * k`, so each glyph fringes on its own strokes. Use k about 0.4 to 1.5 texels of the atlas; more reads as broken, not optical.

## 2. Palette-locked fringe (our rule)
Raw R/B fringes give red and blue outside the palette. Instead treat the three taps as three masks and tint them: tap A (shifted toward rose side) times rose #f4a2c0, tap B (opposite) times sky #7cc7f4, centre tap times frost. Sum additively. Result: sky edge on one side, rose on the other, white core. Same idea as the mushroom's cyan rim. Scale k with the gradient value so big (rose) zones split wider.

## 3. Phosphor triads on the cell grid
Lottes-style masks: aperture grille repeats R,G,B stripes every 3 output pixels; shadow mask staggers them. Compute `m = vec3(step stripes)` from `mod(gl_FragCoord.x, 3.0)`, then `col *= mix(vec3(1), m, strength)`. Tint stripes with palette hues (cerulean / iris / rose) instead of pure RGB. Lottes rotates the mask 90 degrees to cut aliasing and colour fringes. Fade mask strength toward 0 where glyphs blow out to white so highlights stay clean.

## 4. Bloom and halation
Lottes bloom is a small horizontal multi-tap blur (default amount 0.15). Halation is a wider, dimmer, tinted blur added after. Do a half-res blur of the glyph layer, multiply by peach #f8928a or rose, add at 0.1 to 0.25. This is where warm core belongs.

## 5. Order
glyph render, then bloom/halation, then channel split, then mask, then scanline `0.85 + 0.15*sin(y*pi)`, then vignette. Split after bloom so halos fringe too.

## 6. Cheap canvas fallback
Draw the glyph layer three times with `globalCompositeOperation = 'lighter'`, each pass tinted (sky, frost, rose), offset 1 px. Needs no shader.

## 7. Motion
Animate k with a slow sine plus a short spike on hover/scroll; static frame under prefers-reduced-motion.
