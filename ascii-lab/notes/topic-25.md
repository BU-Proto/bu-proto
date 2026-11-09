# Variable density: glyph size across a field

Search found no existing site combining quadtrees, ASCII and a shader, so this is open space. Parts exist separately; the combination below is a proposed design, not an established technique.

## Existing pieces
- Per-cell glyph scale: the uzor ASCII cell shader stores a `scale` per cell (fraction of cell height) so density varies by size as well as character, which smooths texture steps. https://docs.rs/crate/uzor/1.4.14/source/src/ui/effects/text/cell_shader.rs
- Adaptive quadtree (pixel art): big blocks in flat regions, small where detail is. Parameters: variance threshold, max depth, min size. https://naporin0624.github.io/pixel-art-rust/algorithms/quadtree.html and https://github.com/bwiggs/quadtree-art
- Generative quadtree genre: Alexander Reben's qTrees. https://deca.art/0xGhost/qTrees1
- Shader ASCII components (uniform grid only): https://21st.dev/@greatui/components/great-ui-ascii-image

## Technique 1: quadtree-lite in a fragment shader (no CPU tree)
Loop levels L = 0..3. Cell size s = base * 2^L. At each level compute the cell's mean value (sample a mip of the source field, textureLod at level L). Split test: if the variance (or the gradient magnitude, from a Sobel on the mip) is above t, descend to the finer level; stop at the first level that is calm. The chosen level gives the cell size, cell id = floor(uv * res / s), local uv = fract(...). Then sample the glyph atlas with local uv. No tree structure is stored; the mip pyramid is the tree.

## Technique 2: continuous size, not stepped
Glyph size g = mix(gMax, gMin, smoothstep(a, b, detail)). Inside a fixed cell, scale local uv by 1/g around the cell centre and mask outside. This gives the uzor-style smooth transition and avoids visible level seams.

## Technique 3: hash-jittered split
Split probability p = smoothstep(a, b, detail); choose split if hash(cellId, level) < p. Breaks the hard iso-lines of the threshold into a grainy dissolve, which suits the "sparse dashes dissolving into ground" reference (57.png).

## Brand mapping
- Meaning rule: sky = small, iris = medium, rose = big. Drive the colour ramp by the chosen level, so size and hue agree. The gradient then reads as depth: small sky glyphs at the dark edge, large rose glyphs at the bright core.
- Detail signal = the procedural mushroom's edge/rim map; rim stays fine (sky/cyan), the cap interior goes large and blows out to blocks.
- Stretch cells (non-square, wide 2:1) at the lowest density for the horizontal-dash look.

## Cautions
- Glyph atlas readability drops below about 6 px; clamp gMin.
- Level changes must not shimmer under animation: smooth the detail signal over time, or use technique 2.
- Reduced motion: render one frame with a fixed detail map.

## Idea
Use the mip pyramid as an implicit quadtree: pick cell size per pixel from local detail, and let the size level also pick the colour stop.
