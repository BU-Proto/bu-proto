# Topic 07: non-Latin and custom glyph sets

## Braille (U+2800-28FF), 2x4 dots per cell
- Code point = 0x2800 + bitmask. Dot bits: col0 rows0-3 = 0x01,0x02,0x04,0x40; col1 rows0-3 = 0x08,0x10,0x20,0x80.
- Encoder is threshold, bit-pack, lookup. Tone needs dithering first: gamma/contrast, then Floyd-Steinberg, Sierra or Bayer 2x2/4x4.
- Dither over the whole subpixel plane, not per cell, so error crosses cell edges (jedit issue).
- Gradient use: one colour per cell (average of its 8 dots) gives a tinted dot-field; dot density carries luminance, hue carries the blue-to-rose arc. Bayer ordered dither is stable under animation (no crawling), which suits 60fps; error diffusion shimmers.
- Fixed-hue-per-cell means colour resolution is cell-wide while shape resolution is 4x finer: the blocky-gradient problem disappears.
- Sources: https://queelius.github.io/dapple/blog/encodings-and-preprocessing , https://pkg.go.dev/github.com/kevin-cantwell/dotmatrix , https://docs.rs/crate/make_it_braille/latest/source/src/dithering.rs , https://github.com/flyingrobots/jedit/issues/108

## Block elements and legacy computing
- Quadrants 2x2 (U+2596-259F, in 2580 block), sextants 2x3 (U+1FB00-1FB3B), octants 2x4 (Legacy Computing Supplement). Shades light/medium/dark U+2591-2593; eighths U+2581-2588 for smooth vertical bars.
- Eighth-blocks give a 1D 8-step ramp: ramp index = floor(v*8). Good for sparse horizontal dash dissolves (like ref 57).
- Support varies by font; Menlo lacks sextants/octants. Fallback is risky on file://, so draw glyphs to an atlas canvas ourselves instead of relying on fonts.
- Sources: https://www.unicode.org/charts/PDF/U2580.pdf , https://www.unicode.org/charts/PDF/Unicode-17.0/U170-1FB00.pdf , https://docs.rs/crate/ratatui-core/0.1.2/source/src/symbols/pixel.rs

## Box drawing, geometric
- Box drawing U+2500-257F: lines, corners, diagonals (U+2571-2573). Pick glyph from edge direction: angle quantised to 4 bins -> - / | \ (the "lines/diagonal/cross" styles in the references).
- Geometric (U+25A0-25FF, diamonds, circles) as size ramp: sky small, iris medium, rose big, matching palette meaning.

## Custom pixel glyphs (best route for us)
- Define glyphs as 5x7 or 4x6 bitmasks in JS, pre-rendered into a texture atlas (one row per ramp, N glyphs ordered by ink coverage).
- Shader: cell = floor(uv*grid); luminance L -> glyph index g = floor(L*(N-1)); sample atlas at (g + frac(uv*grid).x)/N. Tint = mix through OKLCH ramp by a second field.
- Order glyphs by measured coverage (count lit pixels / total), not by eye, so the ramp is monotonic.
- Custom shapes (our own mushroom-cap arcs, diamonds) are original and ownable; no font dependency.

## Idea
Dither to a Braille-like 2x4 subpixel plane inside a custom atlas: 4x shape resolution with per-cell gradient colour.
