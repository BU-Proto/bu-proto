# Topic 29: One material as identity (print, web, stickers)

Search found no single case study covering print + web + stickers. Patterns below come from adjacent named examples; the BU Proto applications are my own extrapolation.

## Named examples
- Cotton, Creative Week: a small API lets any HTML element opt into the generative header treatment, so web is system-driven, not screenshots. https://gdusa.com/news/cotton-creates-generative-brand-id-for-creative-week
- MIT Media Lab: a logo generated per person, about 40,000 permutations. Rune Madsen's course notes recreate it and a phyllotaxis-based Sagmeister identity. https://printingcode.runemadsen.com/lecture-logo
- adidas flagship London (DIA, FIELD): a generative CMS drives physical spaces. https://dia.tv/project/adidas-flagship-london/
- Dave Peck's definition: forms emerge from an aesthetic algorithm and vary with context or data. https://davepeck.org/2017/01/17/generative-dynamic-identities/
- Design Shack: define governance (who reviews outputs, how updates ship) and test across formats. https://designshack.net/articles/trends/generative-branding
- Printbox: for stickers, fix one style, generate many options, then curate. https://www.getprintbox.com/blog/custom-logo-brand-stickers-creators-small-businesses/

## Static vs dynamic split (Processing thesis pattern)
Fix the palette, the logo shape and the logo position. Let one algorithm vary the field. Source: https://www.behance.net/gallery/77215949/Masters-Thesis-Project-Dynamic-Brand-Identity

## Applying it to the ASCII + gradient field
1. Make the field a function, not an image: `glyph(x, y, seed)` plus `color(x, y, seed)`. Print, web and stickers all call it with different seeds and sizes.
2. Fix invariants: the glyph set, the strict grid, and the palette arc (blue to violet to rose, interpolated in OKLCH). Vary only the seed, the crop, and the subject shape (the mushroom is a subject, not the brand).
3. Seed per use: a per-member seed (hash of name) gives unique badges and stickers, like the MIT per-person logos. Use `seed = hash(name) >>> 0` and feed it to a small PRNG such as mulberry32.
4. Hard cut for print: the web version uses soft gradients, but stickers need flat spot colours. Posterise the gradient to 4-5 steps (the cat reference does this), then map each step to a palette stop. Posterised output survives one-colour printing and low-resolution screens.
5. Scale rule: cell size is the only scaling variable. Keep about 40-120 columns per piece so the texture reads the same on a 2-inch sticker and a poster.
6. Expose a web opt-in like Cotton's: `<div data-field="seed=ada">` mounts the shader. Marketing pages then stay on-brand without design handoffs.
7. Reduced motion and print both want one still frame, so make the seed render deterministic and time-independent when `t` is fixed.
8. Governance: ship a "gallery of 24 approved seeds" and a rule (rose on at least 30 percent of the field, mint only for live) so the output is curated, as the Printbox advice suggests.

## Risk
A generative look becomes a brand through constraint and repetition. If every seed looks different, nothing is recognisable. Keep silhouette, grid and the dissolving gradient edge (the 57.png dashes) constant.
