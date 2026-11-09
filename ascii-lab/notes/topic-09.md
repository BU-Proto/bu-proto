# Topic 09: Halftone, dither, Bayer, blue noise as ASCII cousins

ASCII is ordered dithering where the "pixel" is a glyph. Luminance picks a glyph from a ramp (ink coverage), exactly as a threshold map picks on/off. Every dither trick below transfers by swapping "on/off" for "glyph index".

## Core formulas
- Bayer recursion: M2n = J2 (x) Mn + (1/n^2) * M2 (x) Jn, base M2 = 1/4 [[0,2],[3,1]]. Threshold = M(x mod n, y mod n). (https://en.wikipedia.org/wiki/Ordered_dithering)
- Palette dither: c' = nearest(c + r * (M - 0.5)). Spread r about 1/(palette steps). Same source.
- Glyph version: idx = floor(clamp(L + r*(M-0.5)) * (N-1)). Gives stable, non-banded ramps with zero per-frame cost; M is a constant lookup.
- Interleaved gradient noise (IGN, Jimenez): fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))). Cheap blue-ish noise, no texture. Animate by offsetting p per frame.

## Blue noise
- Made by void-and-cluster; a 64x64 mask is a precomputed texture. It has no crosshatch, so it suits organic fields (the mushroom). Bayer suits the strict grid look (the cat). Quick stand-in: IGN, or a 64x64 mask built offline and embedded as a base64 data URI (file:// safe).

## Halftone
- Clustered-dot matrix, or: rotate uv by an angle, cell = fract(uv*freq)-0.5, dot radius = sqrt(L)*0.7, edge = smoothstep(r+aa, r-aa, length(cell)). Classic CMYK angles 15/75/0/45 deg.
- Glyph analogue: pick glyph by coverage, scale glyph size instead of choosing a shape, so one "dot" glyph grows. Rotate grid 45 deg for a diagonal screen; the sparse-dash dissolve in ref 57 is a stretched cell with threshold-driven dash length.
- The Minecraft "Dithered Shader" offers Bayer, blue noise, triangular noise, IGN, halftone modes with mono, per-channel, hue-preserving colour variants (https://www.curseforge.com/minecraft/shaders/dithered-shader) a useful feature checklist.

## How they carry colour
1. Luminance-only dither, colour untouched: dither decides glyph, glyph tint = gradient(L or position). Cleanest; recommended.
2. Per-channel dither: R,G,B each thresholded, gives fringed RGB speckle (the "RGB split" look). Use sparingly.
3. Palette-index dither: treat the 7 palette stops as a ramp; dither between adjacent stops (sky -> iris -> rose). Position along the arc = L + noise, so the boundary between blue and pink is a stipple, never a grey blend. This is the best answer to the "grey middle" problem: stipple instead of interpolating.
5. Complement tint (ref 55): glyph colour = hue + 180 degrees in OKLCH of the underlying cell.

## Pitfalls
Threshold in linear light. Snap glyph grid to device pixels.
