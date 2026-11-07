# Topic 02: ANSI / Shift-JIS colour technique, faking gradients with 16 colours

## What the sources confirm
- Each cell holds two colours (foreground, background) plus a glyph that sets the mix ratio. Shade blocks dither fg against bg. Source: https://ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/ANSI_art
- Fixed ramp: space (0%), light shade (25%), medium (50%), dark (75%), full block (100%). That is 5 densities per colour pair. With 16 colours, pair choice does most of the work.
- Original hardware: 8 background colours only, because the high bit meant blink. "iCE colors" reclaims it for 16 backgrounds. Source: https://16colo.rs/ansiflags.php and https://forum.16colo.rs/t/ice-colors-or-blinking-text/27
- Half blocks (upper/lower) give 2 vertical pixels per cell. Moebius has a half-block tool. Modern converters pick the best block per 2x2 pixels and diffuse error, Floyd-Steinberg style. Source: https://pkg.go.dev/github.com/wbrown/img2ansi
- Not found: a hand-drawn ramp tutorial, and no usable Shift-JIS (AA) colour source. AA is mostly monochrome line art, so treat its colour as unverified. Tutorials index: 16colo.rs tutorial tag.

## Technique, in my words
1. Order palette stops dark to light along the arc (harbor, cerulean, lagoon, sky, iris, rose, peach).
2. A gradient between stop A and B is a sequence: A space, A/B light shade, medium, dark, B space. Each hop adds ~25% of B. Five cells per band, so band width is the "resolution".
3. Ordered dither beats noise for a clean grid. Pick glyph from the 5-density ramp using a Bayer 4x4 threshold:
   `t = bayer[(y&3)*4+(x&3)]/16; d = fract(g*N) ; level = d > t ? k+1 : k` where g is the 0..1 gradient, N the number of stops-1.
   Glyph then uses colours stop[level] / stop[level+1], density from d quantised to 5.
4. Hard limit as a feature: banding between stops reads as posterised, like the cat reference. Keep few stops, make each hop meaningful.
5. Perceptual: interpolate in OKLCH, or insert an iris mid stop so blue to rose never greys. Do the stop lookup in a 1D LUT texture, 16 to 32 entries, sampled with NEAREST for the ANSI look and LINEAR for smooth.

## Shader sketch (WebGL2)
```
float g = field(uv);                 // light, not decoration
float s = g*(N);  float k = floor(s);
float d = fract(s);
float th = bayer4(ivec2(gl_FragCoord.xy/cell));
float lvl = floor(d*5.0 + th) ;       // 0..5 density steps
vec3 a = lut(k), b = lut(k+1.);
vec3 bg = a, fg = b;                  // glyph coverage = lvl/5
```
Glyph coverage can be a tiny atlas of 5 textures (dots 0, 25, 50, 75, 100% fill).

## Design takeaways for BU Proto
- Two-colour cells let the glyph colour differ from the cell ground: use ground = deep stop, glyph = next stop. That gives the "tint a glyph field" look without per-glyph random hue.
- Lean on the rose end: spend more LUT stops from iris to rose than from harbor to cerulean.
- Half-block rows double vertical gradient resolution cheaply.
