# Topic 03: Modern ASCII shaders (Acerola, Alex Harri, shape-matched glyphs)

## Two families
1. **Luminance ramp**: one brightness per cell, index into a ramp ` .:-=+*#%@`. Blurry, ignores glyph shape.
2. **Shape-matched / edge-aware**: pick the glyph whose *form* resembles the pixels in the cell. Crisp edges, lines read as lines.

## Alex Harri: shape vectors
Source: https://alexharri.com/blog/ascii-rendering
- Precompute per glyph (once, font-specific) a 6D vector: ink fraction inside six staggered sampling circles (2 columns x 3 rows). Normalise each dimension by its max across all glyphs: `v'_i = v_i / max_c v_i(c)`.
- Per cell per frame: average source lightness in the same six circles -> sampling vector s.
- Contrast sharpening in two steps:
  - Directional: `m_i = max(s_i, max_{j in A(i)} e_j)`, e = 10 circles just outside the cell, A(i) = outside circles touching component i. Kills staircase edges.
  - Global: `m = max s; s'_i = m * (s_i/m)^gamma`. Gamma > 1 darkens weak components, keeps the brightest.
- Choose glyph minimising squared Euclidean distance (skip sqrt). Cache with a 5-bit-per-component key (30 bits).
- GPU port: six passes (internal samples, external samples, external max, directional, max, global). In a fragment shader, a 6D nearest search over ~70 glyphs is a cheap loop; or bake glyph vectors into a small texture/uniform array.

## Acerola: edge-aware ASCII
Video only; secondhand write-ups only (no first-party code found), so treat the details as likely, not confirmed. A third-party reimplementation: https://personal-website-bx8.pages.dev/work/image-ascii/
- Downsample to a cell grid; luminance picks the fill glyph from a ramp.
- Edges: Difference of Gaussians (blur at two sigmas, subtract, threshold) for where; Sobel gx/gy for direction `atan2(gy, gx)`.
- Per-cell tile vote: bucket each pixel's angle into | / - \ ; the majority wins. Gate on coherence (enough votes, strong magnitude) so smudges stay as ramp glyphs.
- Edge glyph overrides fill glyph.

## Ideas for the BU Proto gradient look (mushroom reference)
- Use the vote result as a **mask for colour**: line glyphs take the bright rim colour (lagoon/sky), fill glyphs take the gradient-map colour (iris to rose). Edges and interior then carry different light.
- Glyph hue from gradient-map(luminance), but push highlights to frost #f6fbff blocks (blow-out).
- Ramp bias: shape-match only in the bright pass, ramp elsewhere. Cheaper and matches the soft-photo-beneath look.
- Gradient colour in OKLCH or via an iris mid stop so the middle stays saturated; lean to rose at the top end.
- Cell aspect ~1:2; compute everything in cell space, render glyphs from a baked atlas texture (monospace stack canvas -> texture) and sample per fragment.

## Most useful concept
Separate "what glyph" (shape/direction match) from "what colour" (gradient map of the underlying light), and drive them from different signals.
