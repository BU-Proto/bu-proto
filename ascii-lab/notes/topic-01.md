# Topic 01: ASCII art history and the colour it ever had

## Timeline
- RTTY art: teleprinter pictures in Baudot code by radio amateurs. Pure monochrome; tone came only from ink density per glyph. (https://en.wikipedia.org/wiki/Computer_art_scene)
- Late 1970s/80s: Atari 800 (ATASCII) and Commodore 64 (PETSCII) showed 16 colours while IBM PC was mono or 4-colour CGA. PETSCII = graphic glyphs plus a per-cell colour byte: one glyph, one colour, over one background.
- IBM PC: CP437 block and box glyphs plus ANSI.SYS escape codes: 16 foreground, 8 background colours. Files .ANS. (https://en.wikipedia.org/wiki/ANSI_art)
- TheDraw (Ian E. Davis, 1986) made ANSI screens easy; groups ACiD and iCE shipped monthly "artpacks" over BBSes. Art distinguished one BBS from another; artists also drew .nfo files for the demoscene. (https://en.wikipedia.org/wiki/Computer_art_scene)
- Revival: PabloDraw, Moebius, DurDraw; ANSI compos at demoparties; archive at 16colo.rs.

## Techniques worth stealing
1. Two-colour cell: every cell has fg, bg and a glyph. The glyph's coverage mixes fg over bg. Block glyphs at 25/50/75% (light/medium/dark shade) act as dither between two palette entries. Treat the glyph as a mix ratio: out = mix(bg, fg, coverage(glyph)). This gives a gradient in a tiny palette without any new colour.
2. Half-block pixel doubling: use the upper-half block, fg = top pixel, bg = bottom pixel. Doubles vertical resolution and gives true per-pixel colour. Shader idea: per cell, sample the gradient at y-0.25 and y+0.25 cell heights; draw fg/bg, no glyph ramp needed.
3. Palette discipline: 16 colours forced artists to build ramps from few hues, dithering between neighbours. Pick 5-6 stops (harbor, cerulean, sky, iris, rose, peach), snap each cell to nearest stop with ordered (Bayer) threshold: idx = floor(t*(N-1) + bayer(cell) - 0.5).
4. Bright bit trick: the "bright" variant of a hue was the same hue lifted. Map glyph density to brightness within one hue; change hue only on large-scale position.
5. ANSImation: cursor jumps repaint only changed cells. Cheap per-frame work: update a cell only when its quantised stop index changes.

## Design takeaways for BU Proto
- Authentic ANSI colour is cell-flat, never smooth. Smooth gradient under hard cells is the unclaimed look: the gradient is evaluated per cell centre (flat per cell), then dither edges between stops with the glyph ramp.
- Use PETSCII-style rule: glyph chooses shape, colour channel carries the gradient; keep them independent so each can animate separately.
- Rose end as the "bright" tier, sky as "dim" tier, mint only as the live cursor.

Sources: https://en.wikipedia.org/wiki/ANSI_art ; https://en.wikipedia.org/wiki/Computer_art_scene ; https://breakintochat.com/blog/2025/12/28/ansi-art-and-webcomics-bbses-and-the-artscene/ ; https://beyondtellerrand.com/blog/textmode-art-a-precursor-of-web-design
