# Topic 10: Risograph, screen print and misregistration as colour models for glyphs

## Core model (from sources)
Riso = one drum pass per spot ink; overlaps make new colours; registration is never perfect.
Digital recipe: split into ink channels, tint each, add grain, offset each layer, composite
with multiply (subtractive overprint), on a paper colour.
- https://effect.app/effects/risograph
- https://abduzeedo.com/inkdrum-browser-risograph-print-simulator-inkdrum-team (WebGL riso simulator)
- https://halfcadence.github.io/recipes/colors (blue + fluorescent pink overprint recipe)
- https://campus.collegeforcreativestudies.edu/imaging-center/2021/06/22/registration-trapping/
- Physical basis: overprint reflectance ~ product of each ink's reflectance (color.org overprint papers,
  https://archive.color.org/files/DigitalPrint/Deshpande_overprints.pdf).
- Halftone drums sit at different screen angles to avoid moire.
Note: no shader code found in search; formulas below are my own.

## Problem: our ground is navy
Multiply only darkens, so it dies on #061a2e. Flip the model: treat ink as light.
Use transmittance on a light "paper", then invert, or composite additively/screen on harbor:
  col = 1 - (1-a)*(1-b)   (screen = multiply in inverted space)
Overlap of sky and rose then brightens toward iris/frost, a "light overprint" that reads like
a lit riso. Keep violet in the overlap by tinting the overlap term iris, never grey.

## Glyph recipe: one field, three ink plates
1. Sample one scalar field f(x,y,t) once per ink with a small offset:
   fS = f(uv + oS), fI = f(uv + oI), fR = f(uv + oR); offsets 0.5-2 cells, drifting slowly.
2. Plates map to palette by the brief's meaning: sky = small glyphs, iris = medium, rose = big.
3. Each plate picks its own glyph from a density ramp, with its own cell grid rotated
   (0, 15, 45 degrees) like halftone angles. Misaligned grids create moire rosettes between layers.
4. Per-pixel: out = harbor; out = screen(out, sky*mS); out = screen(out, iris*mI); out = screen(out, rose*mR).
5. Where plates coincide, glyphs fuse and brighten; where offset, coloured fringes appear (cheap RGB split).

## Finishing
- Grain: hash noise multiplied into each plate mask (threshold noise vs coverage, so ink "drops out").
- Ink density wobble: low-frequency noise on mask alpha, 0.85-1.0.
- Knockout vs overprint: toggle per pair; knockout (subtract other plate's mask) gives crisp misregistration gaps showing harbor.
- Misregistration animation: slow sin drift on offsets, amplitude breathes; reduced-motion = fixed offsets.
- Halftone-as-glyph: glyph coverage area equals tone, so a "." to "@" ramp is a halftone dot.

## Cohesion idea
Blue-to-pink as three physical plates drifting in and out of register, not a smooth blend.
The gradient emerges where plates overlap, so the middle is iris by construction, never grey.
