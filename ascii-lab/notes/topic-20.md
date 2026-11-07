# Topic 20: Typographic image-making (concrete poetry, typewriter art, Bob Neill, dsh)

## What the sources say
- Dom Sylvester Houedard (dsh), Benedictine monk, made "typestracts" (typewriter + abstract) on an Olivetti Lettera 22, roughly 1950-1970. Some legible, many pure abstract geometry; one cited ellipse is built only from hyphen and slash keys. Sources: https://www.itsnicethat.com/articles/cosmic-typewriter-1 , V&A https://collections.vam.ac.uk/item/O164896/untitled-print-houedard-dom-sylvester/
- Bob Neill (UK, books 1982 and 1984, Weavers Press) did photo portraits by mapping an image to a character grid, picking each character by darkness. Overstriking (same cell struck several times) gives darker tones; this needs equal horizontal and vertical advance. Sources: https://monoskop.org/log/?p=10535 , https://nhigham.com/2014/08/29/typewriter-art/ (a 100x79 grid portrait program).
- Wider history: https://flashbak.com/typewriter-art-a-rich-visual-history-of-words-as-images-1893-now-44074

## Techniques to steal (my own framing)
1. Overstrike as additive tone. Neill's dark cells are stacks of glyphs. In a shader, a cell holds N glyph layers; tone t picks N = ceil(t*3), each layer a different glyph (. then + then #), composited with max() or additive blend. Gives density steps beyond one ramp.
2. Keys as shape vocabulary (dsh). Restrict the set per region: only - and / in one zone builds curves and ellipses; | and _ in another builds frames. Choose glyph by local edge direction: theta = atan(gy, gx); bucket into 4: "-" , "/" , "|" , "\". Matches the mushroom reference's line glyphs.
3. Cell aspect. Typewriter pitch is near 1:2; non-square cells (like reference 57) read as typewriter. Use cell w:h of 1:1.6 to 1:2.
4. Ink on paper, not light on glass. Mix with rose/iris ink on a harbor ground; add slight per-cell jitter (offset under 0.08 cell, rotation under 1.5 deg) and uneven strike pressure: alpha = 0.7 + 0.3*hash(cell). Reads handmade; unseen against clean gradient fields.
5. Gradient as ribbon colour. A typewriter ribbon is two-colour (red/black). Mimic: ink colour from a 2-stop ribbon, sky to rose, split by tone band, with iris deep reserved for overstruck cells (meaning: more strikes = bigger = rose).
6. Concrete poetry rule: the text IS the image. Use real words (BU Proto, Trov, build) as the fill sequence walking along each row, so reading is possible up close, image far away.

## Shader sketch
cell = floor(uv/cellSize); t = lum(cell centre); n = int(ceil(t*3.)); for i<n: g = glyph(ramp[i], frac) ; ink = max(ink, g*mix(sky,rose,t)); add jitter via hash(cell+i).

## Caveat
No step-by-step Neill procedure found online; his books are the primary source.
