# How ASCII and glyph-field heroes make a title belong to the field

Method note for the writer. I opened about 35 live sites in headless Chrome for Testing 158 (Apple Silicon, Metal) at 1440×900 and 390×844 on 2026-11-07. For each I captured screenshots and read the h1, the fonts and how the ASCII is marked up. I then prototyped each title technique on the live local BU Proto hero (http://localhost:5173), without editing the repo. The prototype patches the glyph shader in the browser by route interception and puts the title in a DOM overlay. I measured contrast from screenshots with the text hidden. All evidence is under `/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/` (shortened to `HR/` below).

State change during the research. When the brief was written, the hero showed no visible title. At about 04:10, commit `79d04e1` ("Blocky hero with the old field's drag, and the top bar split in three") added a visible centred column with the h1, lede and Join button. My first capture (`HR/shots/localhost-5173-d.png`) shows the old state. The `HR/proto*` captures show the new one.

## Which real sites use ASCII, terminal or glyph-field heroes well in 2025 and 2026, and how is their title set?

### Takeaway
Almost no strong site sets a long title straight onto a full-bleed, bright glyph field. The good ones use one of three moves:
- **Own plate.** The title gets a plate of its own and the field is framed beside or below it (craft.wild.as, Lusion, Ghostty, Upvent, E2B, Oxide).
- **Quiet field.** The field is kept faint, or masked away, wherever type sits (Bierman, Firecrawl).
- **Field's own unit.** The title is a real font built on the field's unit (Purdue Hackers, Kostya Farber), or is set at extreme scale and weight (Bierman, Nous, Oryzo).

Some sites I expected to have glyph heroes show none now (OpenAI Codex, Amp, Factory).

### Cited Findings
Title over, or locked against, a full-bleed field:
- **Bierman.** Full-screen field of grey `.` dots in Source Code Pro 10px, with a 3D "m" mark drawn in `&` density. The title is two h1s, "matt" and "bierman", in Nohemi weight 900 at 250px, solid black, cropped at the top-left and bottom-right corners. The two words bracket the ASCII mark. A small role line sits top-right directly on the faint dots. The ASCII is plain DOM text (DIVs of 13,000–21,000 characters) with no aria-hidden ancestor and selectable text. — [bierman.io](https://bierman.io); capture `HR/ascii/bierman-io-d.png`; listed as an Awwwards element tagged webgl, three.js, ascii — [Awwwards](https://www.awwwards.com/inspiration/interactive-webgl-hero-matt-bierman-portfolio)
- **Firecrawl.** Light ground with grey ASCII fields as two `<pre>` blocks (Roboto Mono 8.27px, about 16k and 14k characters). They sit in an aria-hidden wrapper with `user-select: none`. The field shows only at the flanks and below the search card, so the centre column under the h1 stays clean. The h1 is Suisse 60px on two lines, the second line in brand orange. Mono bracket labels such as `[ 200 OK ]` sit in grid cells at the corners. — [firecrawl.dev](https://www.firecrawl.dev); capture `HR/ascii3/www-firecrawl-dev-d.png`
- **Nous Research.** The h1 "NOUS RESEARCH" is Rules Gothic Compressed fitted to the column width: about 304px on desktop and 120px on phone, blue on light grey. Its canvases are aria-hidden. — [nousresearch.com](https://nousresearch.com); `HR/ascii/nousresearch-com-d.png`

Title on its own plate, with the field framed or banded:
- **Ghostty.** An animated ASCII ghost (a `<code>` block of 5,740 characters, JetBrains Mono 10px) sits inside a macOS-style window frame, within an aria-hidden section. The page has no h1. The statement is one 16px sentence under the window, followed by two buttons. — [ghostty.org](https://ghostty.org); `HR/shots/ghostty-org-d.png`
- **craft.wild.as** (owner reference). The h1 "Craft, engineered." is Sneak, uppercase, 74.88px desktop and 32px phone, split into line spans. It sits on a white header plate above a band of coloured pixel cells. Plate and band share one faint hairline grid. The title enters with a line-by-line mask reveal, caught mid-rise at 1.5s. There is no glyph effect on the title itself, and every canvas is aria-hidden. On phone the title block stacks above the band. — [craft.wild.as](https://craft.wild.as); `HR/ascii/craft/d-t1500.png`, `HR/ascii/craft/m-t8000.png`
- **Lusion** (owner reference). The h1 is a 36px Aeonik sentence in the header row between the logo and the buttons (23.4px on phone). The WebGL art sits in a rounded, framed panel below it, with plus marks at the corners and "SCROLL TO EXPLORE". — [lusion.co](https://lusion.co); `HR/ascii/lusion-co-d.png`
- **Oryzo** (owner reference, by Lusion). After the preloader, a large cream "ORYZO" wordmark (cap height about 130px) sits top-left over the 3D scene. A short white statement floats at the right. Credits sit on a frosted glass card bottom-left. The DOM h1 "Powered by AI*" is split into per-letter divs, all aria-hidden, with `aria-label` on the h1. — [oryzo.ai](https://oryzo.ai); `HR/ascii/oryzo/d-t12000.png`
- **Upvent.** The h1 is IBM Plex Mono 700, about 46px, uppercase: "PUSH YOUR BRAND WITH" followed by a word that scrambles through random characters. An ASCII landscape made from the brand's own letters (P, V, U, E, T) in pink and teal sits as a band below. It is listed on Awwwards as "Typography-Driven Hero with ASCII Characters" by Merkur Design. — [upvent.co](https://upvent.co); [Awwwards](https://www.awwwards.com/inspiration/typography-driven-hero-with-ascii-characters-upvent-digital)
- **Aino.** Awwwards Site of the Day on 20 May 2026, scoring 7.24. The listing describes ASCII, 2D physics and real-time morphing in about 30kb of JS. On the first screen a morphing mono ASCII column (about 12.6px) is the hero. The h1 is a 37.7px sentence at weight 720, sitting below the fold at about y=1050. — [Awwwards](https://www.awwwards.com/sites/aino-agency); [aino.agency](https://aino.agency)
- **E2B.** The h1 is PP Supply Sans 72px uppercase, with a mono bracketed eyebrow `[ THE AGENT CLOUD ]` and a terminal panel at the right. — [e2b.dev](https://e2b.dev)
- **Oxide.** The h1 is Suisse Intl 65px at bottom-left over dark ground, with mono UI labels. The terminal panel is a separate box top-left. — [oxide.computer](https://oxide.computer)
- **Gemini CLI.** The ">GEMINI" block-letter wordmark is drawn in glyphs with a blue-to-pink gradient inside a terminal panel. The real h1 is a separate Google Sans 52px line. — [geminicli.com](https://geminicli.com)

Mono-first dev-tool pages, where ASCII is a diagram or panel rather than a field behind the title:
- **OpenCode.** h1 in OpenTUI Mono, 58px. — [opencode.ai](https://opencode.ai)
- **Turbopuffer.** h1 in JetBrains Mono 800, 30px, lower-case, beside a box-drawing ASCII diagram with dithered shadows. — [turbopuffer.com](https://turbopuffer.com)
- **Warp.** h1 in Azeret Semi Mono, 54px. — [warp.dev](https://www.warp.dev)

Title set as a real font built on the field's unit:
- **Purdue Hackers.** The h1 "Purdue Hackers" uses a custom pixel face at 136px (72px on phone) on graph-paper ground. A pixel field rises from the bottom under tilted photos. The h1 carries a `noselect` class. — [purduehackers.com](https://www.purduehackers.com); `HR/ascii/www-purduehackers-com-d.png`
- **Kostya Farber.** The h1 "Kostya." is a pixel blackletter face at 172–288px, sized per letter in vw, with tiny JetBrains Mono captions on white. — [kostyafarber.com](https://www.kostyafarber.com)

Peer site and sites that have moved on:
- **ScottyLabs.** "ScottyLabs" is a 60px Satoshi span, not the h1, with a code-style annotation of its own font spec. At the right is a dog drawn from code symbols in a blue-to-red gradient. The first h1 is far down the page at about y=1214. — [scottylabs.org](https://www.scottylabs.org); `HR/ascii/www-scottylabs-org-d.png`
- **No glyph hero on 2026-11-07:** OpenAI Codex (gradient and logo, phone capture), Amp (headline with floating task chips), Factory (light page with logo). — `HR/shots/openai-com-codex-m.png`, `HR/shots/ampcode-com-d.png`, `HR/shots/factory-ai-d.png`

### Inferences
- The premium examples all make one dominant title move: extreme scale, extreme weight, or a font built on the field's module. Everything else stays small, usually mono.
- No checked site shows a title over a field as bright and dense as BU Proto's bloom core. Where type does sit on a field, the field there is grey dots or faint ASCII. That suggests BU Proto must make the field give way under the copy, or move the copy to where the field is already dark.
- The owner's three references never put a sentence on busy art. Lusion and craft.wild.as give the title a plate. Oryzo uses one giant wordmark plus a glass card. BU Proto's glass capsule nav already provides a glass language for a card.

### Gaps
- I found no live, verifiable example of a glyph field converging into a title, or of knockout type revealing an ASCII field. Both exist as component demos only, such as Framer's "ASCII Motion" ([Framer](https://www.framer.com/marketplace/components/ascii-motion/)).
- Awwwards or FWA awards for 2025–26 ASCII heroes were confirmed only for Aino. Upvent's Awwwards asset paths suggest July 2026, but that is an inference.
- Whether OpenAI Codex, Amp and Factory used glyph heroes earlier is from memory, not a source. Treat it as unverified.
- Headless captures may differ from real devices in WebGL timing and preloaders. OpenAI Codex desktop returned a Cloudflare challenge.

## What are the options (real HTML type over the field, field parting, title drawn in glyphs, glyphs resolving into the word, knockout, mono vs display), and what does each cost?

### Takeaway
On this hero, plain HTML type over the field fails contrast. The committed centred column, with its radial scrim and text shadows, leaves about half of the pixels behind the h1 and lede under 4.5:1. Letting the field part under the copy is the only treatment that took both the title and small text to near-total compliance in my tests while keeping the field alive.

Two techniques make the title genuinely of the field:
- **Drawn.** The title is built from the field's own glyph cells. It reads only as a one-word wordmark at very large size.
- **Knockout.** The field is visible only through the letters. It reads strongly but darkens the rest of the bloom.

A mono title over a mono-looking field camouflages itself.

### Cited Findings
How the BU Proto hero is built (from the repo):
- The glyph pass draws a 12-shape alphabet (ticks, daggers, crosses, diamonds, dot, ring, `>`, `_`, bar) from line segments in GLSL, with no font.
- Cells are square: 9 CSS px on desktop, 7 CSS px below 600px wide.
- Three quality tiers step down when the median frame passes 24ms over 60 frames.
- The canvas is aria-hidden.
- Sources: [heroBloomShaders.ts](/Users/cjxsez/Desktop/bu-proto/src/lib/heroBloomShaders.ts); [heroBloom.ts](/Users/cjxsez/Desktop/bu-proto/src/lib/heroBloom.ts); [HeroBloom.tsx](/Users/cjxsez/Desktop/bu-proto/src/components/HeroBloom.tsx)

The repo already has a "step back from text" mechanism for the ASCII field's trail:
- It rasterises `[data-fog-clear]` line boxes (`Range.getClientRects`) onto the character grid with padding, then box-blurs and boosts the result into a 0–1 coverage mask.
- The hero's glyph shader has no such input. Its inputs are picture, wake, resolution, cell, time, hero height, intro and scroll.
- Sources: [textClearing.ts](/Users/cjxsez/Desktop/bu-proto/src/ascii-field/textClearing.ts); [heroBloomShaders.ts](/Users/cjxsez/Desktop/bu-proto/src/lib/heroBloomShaders.ts)

The committed hero (commit 79d04e1):
- h1: Host Grotesk 400, `clamp(36px, 5vw, 64px)`, colour #F4F4F6, shadow `0 2px 30px rgb(0 0 0 / .5)`.
- Lede: #C2C2C8, 16–19px, shadow `0 1px 14px rgb(0 0 0 / .6)`.
- A `radial-gradient(closest-side, rgb(0 0 0 / .55), transparent)` scrim sits behind the column.
- Sources: [Hero.tsx](/Users/cjxsez/Desktop/bu-proto/src/components/Hero.tsx); [Hero.module.css](/Users/cjxsez/Desktop/bu-proto/src/components/Hero.module.css)

How the contrast numbers below were measured:
- Background pixels inside each text box were sampled from screenshots with the words hidden.
- Each case took the worst of 4 frames, 1.2s apart.
- "% < 4.5" is the share of background pixels where the text colour falls below 4.5:1.
- Shadows were removed for the measurement, so the committed design is slightly undercounted.
- Sources: [proto3/site-contrast.json](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/proto3/site-contrast.json); [proto2/contrast.json](/private/tmp/claude-501/-Users-cjxsez-Desktop-bu-proto/e2707e65-44f8-4cc5-8ad7-4868e9595be5/scratchpad/hero-research/proto2/contrast.json)

**Real HTML type over the field (committed hero, scrim on):**
- Desktop h1: median 4.79:1; 47% of pixels < 4.5; 13% < 3.
- Desktop lede: median 4.39:1; 51% < 4.5.
- Phone h1: median 4.25:1; 55% < 4.5.
- Phone lede: median 3.52:1; 65% < 4.5.
- Source: `HR/proto3/site-contrast.json`

**Effect of the scrim alone.** With the scrim removed, the h1 box median falls to 2.68:1, with 71% of pixels < 4.5. — `HR/proto2/contrast.json` (`d-site-none`, measured against #F5F6FA)

**Placement matters.** The same sentence moved to the lower left, over the blue and violet rather than the pink core, with no scrim:
- h1: median 4.06:1; 58% < 4.5.
- Lede: median 7.66:1; 35% < 4.5.
- Source: `HR/proto2/contrast.json` (`d-left-none`)

**Field parting.** The prototype uses a mask from blurred line boxes. Under the mask, glyph marks drop by 94% and the bloom light by 55%.
- Committed centred copy, desktop: h1 median 10.71:1 (6.3% < 4.5); lede median 12.49:1 (5.5% < 4.5).
- Lower-left copy, desktop: h1 10.81:1 (4.9% < 4.5); lede 14.61:1 (0%).
- The residue is at the soft mask edges.
- Visually, blurred rectangles read as a dark smudge. The shape of the clearing needs design work.
- Sources: `HR/proto2/contrast.json`; `HR/sheet-proto-d.png`

**Clearing only the cells under the letters.** A grid-locked JetBrains Mono title had its cells cleared under each glyph with no halo. Result: 52% of h1 pixels and 55% of lede pixels stayed < 4.5. Letters gain a pixel-like dark outline, but the field between letters still competes. — `HR/proto2/contrast.json` (`d-grid-cellpart`); `HR/proto2/d-grid-cellpart.png`

**Title drawn in the field's glyphs.**
- Inside the letter mask, cells take full-weight glyphs (diamond, cross, bar) in white. A one-cell "moat" around the letters is cleared.
- "Proto" in Host Grotesk 800 at 280px reads clearly on desktop.
- At 132px on phone it reads, but counters are only 3–4 cells wide.
- A full sentence cannot be drawn this way at legible size with 9px cells.
- Sources: `HR/proto2/d-wordmark-drawn.png`; `HR/proto2/m-wordmark-drawn.png`

**Knockout, in the shader.**
- Marks fall to 12% and light to 22% outside the letters, so the blue-to-pink field shows only through "Proto".
- It is strong on desktop and phone, but the bloom elsewhere goes dark.
- The 34px subline and lede then sit at 0% < 4.5.
- Sources: `HR/proto2/d-wordmark-knockout.png`; `HR/proto2/m-wordmark-knockout.png`

**Knockout, in CSS.**
- A full-hero plate `rgb(0 0 0 / .8)` with white h1 text and `mix-blend-mode: multiply` reproduces the shader knockout.
- It only works if the plate shares a stacking context with the canvas. My first attempt sat inside a z-indexed wrapper, blended with nothing, and showed solid white letters.
- Sources: `HR/proto3/d-cssknockout.png`; `HR/proto2/d-wordmark-cssknockout.png`
- MDN confirms the mechanism: the backdrop is only the content behind the element "within the same stacking context". `mix-blend-mode` itself creates a stacking context, and `isolation: isolate` limits blending to a group. — [MDN mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mix-blend-mode)

**`background-clip: text`.** It paints a background "within (clipped to) the foreground text". MDN advises a fallback `background-color` and `@supports`. — [MDN background-clip](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/background-clip)

**Glyphs resolving into the word.** In practice this is done on DOM text:
- Upvent scrambles letters inside the h1.
- Prime Intellect scrambles a mono caption (captured mid-scramble).
- Aino's listing cites "real-time morphing".
- Sources: [upvent.co](https://upvent.co); [primeintellect.ai](https://www.primeintellect.ai); [Awwwards Aino](https://www.awwwards.com/sites/aino-agency)
- Craft of UI: monospace "avoids layout shifts" during scrambles; fixed `1ch` × `1lh` boxes per character help. — [Craft of UI](https://craftofui.substack.com/p/muddling-your-words)

**Shape-aware glyph choice** makes drawn letterforms sharper:
- Brightness-only ASCII treats cells as pixels and blurs edges. Shape vectors sampled at 6 circles per cell, plus directional contrast enhancement, keep edges crisp. Harri runs this in six GPU passes. — [Alex Harri](https://alexharri.com/blog/ascii-rendering)
- Codrops (4 Sep 2026) does the same in Three.js: 3 passes, 6×10 CSS px cells, a 95-glyph search. — [Codrops](https://tympanus.net/codrops/2026/09/04/beyond-the-luminance-ramp-a-shape-aware-ascii-renderer-in-three-js/); the article returned 403 to fetch, so these details come from the search excerpt.

**Mono vs display.**
- Sites with a field behind or around the title use non-mono display faces at large size: Bierman Nohemi 900 at 250px, Nous compressed gothic at about 304px, Oryzo Halyard at 123px, Firecrawl Suisse at 60px, Oxide Suisse Intl at 65px.
- Mono h1s appear where ASCII is a diagram or panel: Turbopuffer 30px, Warp 54px, OpenCode 58px, Upvent 46px.
- Source: audit JSON in `HR/shots/audit.json`, `HR/ascii/audit.json`, `HR/ascii3/audit.json`
- The Monospace Web shows a whole page locked to a monospace character grid, which narrows in character-sized steps. — [The Monospace Web](https://owickstrom.github.io/the-monospace-web/)

### Inferences
- **Parting is the right base layer.** Feed a mask built from the real h1 and lede line boxes into the glyph pass. The rect, grid and blur code already exists in `textClearing.ts`. Draw that mask in the field's own vocabulary, so it reads as the field stepping aside rather than as a shadow: quantise it to whole cells, or thin glyphs from heavy to dots as the existing "fall" does.
- **Drawn and knockout suit one word only.** Use them for a wordmark ("Proto"), with the descriptive sentence set as real type on a parted field. They could also be a moment in a sequence, for example the field gathering into the word and then releasing it on scroll.
- **Pair Host Grotesk with the field, not mono.** In the grid-mono prototype the letters looked like more field texture. Keep JetBrains Mono for small labels, as Firecrawl and E2B do with bracketed mono labels.
- **Performance cost.** Parting, drawn and shader knockout each add one or two texture reads per pixel to a pass that already computes several noise functions per pixel. The mask is rebuilt only on resize, font load or copy change. I expect the cost to be negligible but did not profile it on phones. CSS multiply knockout instead blends a full-viewport layer over a canvas that repaints every frame, which is a cost I did not measure.

### Gaps
- Frame-time cost of each treatment on a mid-range phone was not measured. Headless Metal on Apple Silicon is not representative.
- The clearing shape was not explored beyond blurred rectangles and per-cell holes. It needs design iteration.
- The full Codrops article could not be fetched (403).

## Which of these keep a real, selectable, crawlable h1?

### Takeaway
- **Plain type, parting and CSS knockout** keep an ordinary h1, because the words are DOM text.
- **Drawn and shader knockout** put the visible letters in the canvas. They keep a real h1 by laying transparent DOM text exactly over the drawn letters, the PDF.js text-layer pattern. I verified that this selects, highlights and survives forced colours.
- **Scramble effects applied to the h1's own text** damage it: Upvent's h1 reads as garbage mid-animation. The safe pattern puts the real string on the parent, or in a hidden copy, and marks the animated glyphs aria-hidden, as Oryzo does.

### Cited Findings
- **PDF.js text layer.** The canvas paints the page, while absolutely positioned, transparent text spans above it carry native selection and copy. — [tessl PDF.js docs](https://tessl.io/registry/tessl/npm-pdfjs-dist/5.4.0/files/docs/text-layer.md); [usefulangle](https://usefulangle.com/post/90/javascript-pdfjs-enable-text-layer)
- **My test on BU Proto.** A transparent h1 overlaid on the drawn "Proto":
  - It shows a visible selection highlight over the drawn letters when selected (`HR/proto2/d-wordmark-drawn-selected.png`).
  - Under Chrome's forced-colours emulation, the text becomes solid black on a white backplate above the still-visible canvas (`HR/proto2/d-wordmark-drawn-forced.png`).
  - This matches the WPT expectation that a transparent text colour is overridden in forced colours mode — [WPT forced-colors-mode-07](https://chromium.googlesource.com/external/w3c/web-platform-tests/+/refs/heads/dir-element-role-mapping-test/forced-colors-mode/forced-colors-mode-07.html)
- **CSS multiply knockout in forced colours.** The dark plate turned white, which washed out the field. Text stayed readable in black. — `HR/proto2/d-wordmark-cssknockout-forced.png`
- **Google's hidden-text policy.** It lists "white text on a white background", "hiding text behind an image", "Using CSS to position text off-screen" and "font size or opacity to 0" as violations. "Text that's only accessible to screen readers" is allowed. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- **Google title links.** Sources include the "Main visual title shown on the page" and h1 elements. — [Google title links](https://developers.google.com/search/docs/appearance/title-link)
- **Upvent.** The h1's text changes in the DOM. innerText was captured mid-scramble as "PUSH YOUR BRAND WITH D2U1GS PYLDA" on desktop and "…&ECIJX5NCES" on phone. textContent concatenates every rotating word without spaces ("withexperiencessocial mediawebsite…"). Its 9,075-character ASCII DIV is not aria-hidden. — [upvent.co](https://upvent.co); `HR/ascii/audit.json`
- **Oryzo.** The h1 carries `aria-label="Powered by AI*"` and its per-letter divs are `aria-hidden="true"`. — [oryzo.ai](https://oryzo.ai); `HR/ascii/audit.json`
- **Framer's scramble component** puts the real string on the parent as `aria-label` and hides each glyph. A shadcn variant reads a visually hidden copy once. — [Framer](https://www.framer.com/community/marketplace/components/scramble-reveal/); [shadcn.io](https://www.shadcn.io/text/vue/decrypted-text)
- **Craft of UI** warns that live scrambles "could sound like a nightmare to screen reader users". — [Craft of UI](https://craftofui.substack.com/p/muddling-your-words)
- **W3C technique H86.** ASCII art needs a text explanation. Its example wraps the art in `<div aria-label="WCAG" role="img">`. A skip link is optional. — [W3C H86](https://www.w3.org/WAI/WCAG22/Techniques/html/H86)
- **GitHub's Copilot CLI banner.** Screen readers "treat fast-changing characters as noise". The animation is opt-in and skipped in screen-reader mode. The block-letter logo is treated as a graphical object. — [GitHub blog](https://github.blog/engineering/from-pixels-to-characters-the-engineering-behind-github-copilot-clis-animated-ascii-banner/)
- **How sampled sites expose their ASCII:**
  - Ghostty: the ASCII sits in an aria-hidden section, and the page has no h1.
  - Firecrawl: aria-hidden wrapper plus `user-select: none`.
  - Bierman: neither. Its 13–21k-character DIVs are exposed and selectable.
  - Purdue Hackers: the h1 itself is `noselect`.
  - Sources: `HR/ascii/audit.json`, a11y check output (`HR/a11ycheck.mjs`); [ghostty.org](https://ghostty.org); [firecrawl.dev](https://www.firecrawl.dev); [bierman.io](https://bierman.io); [purduehackers.com](https://www.purduehackers.com)
- **BU Proto today.** The h1 text is "Proto is the home base for building things at BU". The canvas is aria-hidden. — [home.ts](/Users/cjxsez/Desktop/bu-proto/src/content/home.ts); [HeroBloom.tsx](/Users/cjxsez/Desktop/bu-proto/src/components/HeroBloom.tsx)

### Inferences
- **Safest structure.** The h1 is the sentence, set as real type on a parted field. Any glyph-built or knockout "Proto" wordmark is either decorative and aria-hidden, or the first word of that same h1 laid as transparent text over the drawn letters. The h1 then stays the visible main title, which Google uses, and nothing resembles the hidden-text examples.
- **Transparent overlay text carries a small, not zero, risk** of resembling "hidden text" to an automated check. The words are visibly on screen as glyphs, so it is not deceptive, but a plain visible h1 removes the question.
- **Never animate the h1's own characters.** If the field resolves into the word, do it in the canvas. The DOM h1 is static from first paint and carries the final text.

### Gaps
- No primary source says how Google's renderer treats transparent text over canvas-drawn words. The inference above rests on the policy's wording only.
- Screen reader behaviour (VoiceOver, NVDA) with the transparent overlay was not tested. Only selection and forced colours were.

## How do the best keep small text readable over a busy glyph field?

### Takeaway
They don't put small text on the busy part:
- They move it off the field: below a frame, on a plate, or on a glass card.
- They make the field faint or absent exactly there.
- Or they part the field around the copy.

On BU Proto, text shadows plus a radial scrim were not enough. The pale and white core and the travelling white bands leave about half the pixels under the lede below 4.5:1. Parting under the line boxes took the lede to 0–5% below 4.5:1.

### Cited Findings
- **WCAG 1.4.3.** Text needs 4.5:1, or 3:1 for large text (at least 18pt, or 14pt bold). — [WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)
- **Understanding doc.** It measures against the colour behind the text and cites failure F83 for background images with insufficient contrast. A "wide outline" or halo counts as background. Logotypes are exempt: "Text that is part of a logo or brand name has no contrast requirement." — [Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- **Keep text off the field:**
  - Ghostty: the sentence sits under the framed field — [ghostty.org](https://ghostty.org)
  - craft.wild.as: the right-column statement sits on the white plate — [craft.wild.as](https://craft.wild.as)
  - Lusion: copy sits above the framed art — [lusion.co](https://lusion.co)
  - Aino: the h1 sits below the fold — [aino.agency](https://aino.agency)
- **Faint field under text.** Bierman's small role line sits on light-grey 10px dots — [bierman.io](https://bierman.io). Firecrawl's ASCII is grey 8px mono confined to the flanks and below the search card, leaving the headline and subhead on clean ground — [firecrawl.dev](https://www.firecrawl.dev)
- **Card or plate for small text.**
  - Oryzo's credit copy sits on a frosted card over the 3D scene — [oryzo.ai](https://oryzo.ai)
  - Firecrawl's input row is a white card above its orange ASCII — [firecrawl.dev](https://www.firecrawl.dev)
  - Purdue Hackers' uppercase Inconsolata body sits on cream above the pixel field — [purduehackers.com](https://www.purduehackers.com)
- **BU Proto measurements** (from `HR/proto3/site-contrast.json` and `HR/proto2/contrast.json`):
  - Committed lede (#C2C2C8, 18.7px desktop / 16px phone) with scrim: median 4.39:1 desktop and 3.52:1 phone; 51% and 65% of pixels < 4.5.
  - Lede on a parted field: median 12.49–14.61:1 desktop with 0–5.5% < 4.5; 13.47–14.61:1 phone with 0% (measured against #F5F6FA; a #C2C2C8 lede would be about 0.6× these ratios).
- **Colour roles.** GitHub maps animation colours to semantic roles and notes that "non-text graphical elements have different contrast requirements than text." — [GitHub blog](https://github.blog/engineering/from-pixels-to-characters-the-engineering-behind-github-copilot-clis-animated-ascii-banner/)

### Inferences
- For BU Proto, the lede and CTA either sit on a parted field, with clearing driven by their own line boxes, or on a glass card in the nav's material. A darker radial scrim alone keeps losing whenever a white band of light crosses the copy.
- Raising the lede from #C2C2C8 to near-white is a cheap gain. It is the dimmest text on the brightest part of the field.
- Putting copy in the lower-left blue and violet, rather than the centred pink core, roughly doubles the lede's median contrast before any clearing (7.66 vs 4.39 desktop). Position is a free lever.

### Gaps
- I did not measure text contrast on the other sites, only observed it. Their small-text treatment is described from screenshots.
- APCA or perceptual-contrast figures were not computed. The figures are WCAG 2 ratios only.

## How does the treatment hold on a phone?

### Takeaway
- **Sentences hold** when the copy is real type on a parted field.
- **Glyph-drawn letters get rough.** Phone cells are 7 CSS px, so a drawn wordmark needs roughly 120px or more and works for one short word only.
- **Knockout holds best** of the field-built treatments on phone.
- **The owner's references** stack title and field rather than overlap them on phones, and the field-as-hero sites shrink their giant titles to 72–120px.

### Cited Findings
- **BU Proto cell size.** 7 CSS px below 600px wide (`CELL_CSS_PHONE = 7`, `PHONE_WIDTH = 600`), against 9 on desktop. — [heroBloom.ts](/Users/cjxsez/Desktop/bu-proto/src/lib/heroBloom.ts)
- **Committed hero on phone.** h1 36px median 4.25:1 with 55% < 4.5. Lede 16px median 3.52:1 with 65% < 4.5. — `HR/proto3/site-contrast.json`; `HR/proto3/m-site.png`
- **Phone prototypes** (`HR/proto2/contrast.json`; `HR/sheet-proto-m.png`):
  - Lower-left 34px sentence on a parted field: h1 median 12.09:1 (1.3% < 4.5); lede 14.61:1 (0%).
  - The same with no parting: h1 3.66:1 (62.5% < 4.5).
- **Drawn "Proto" at 132px, weight 800**, reads but is rough at 7px cells. Knockout "Proto" at 132px reads strongly. — `HR/proto2/m-wordmark-drawn.png`; `HR/proto2/m-wordmark-knockout.png`
- **Grid-locked mono on phone.** The lede in JetBrains Mono 15px over the field was largely unreadable even with per-cell clearing (59% < 4.5). — `HR/proto2/m-grid-cellpart.png`
- **How other sites adapt on phone:**
  - craft.wild.as stacks the title plate (32px h1) above the pixel band — `HR/ascii/craft/m-t8000.png`
  - Lusion's h1 drops to 23.4px above the framed art — [lusion.co](https://lusion.co)
  - Bierman keeps the corner bracketing at 78px — [bierman.io](https://bierman.io)
  - Nous's fitted title drops to 120px — [nousresearch.com](https://nousresearch.com)
  - Purdue's pixel h1 drops to 72px — [purduehackers.com](https://www.purduehackers.com)
  - Oryzo's per-letter h1 measured as visually hidden on phone, while the wordmark stays — `HR/ascii/audit.json`
- **Motion rule.** WCAG 2.2.2 requires pause, stop or hide controls only for motion that starts automatically, lasts "more than five seconds" and runs alongside other content. A resolve-into-the-word intro that finishes under 5s needs no control. — [Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- **Reduced motion.** The hero already holds a still frame and skips the opening under reduced motion. — [HeroBloom.tsx](/Users/cjxsez/Desktop/bu-proto/src/components/HeroBloom.tsx)

### Inferences
- **Size rule for drawn letters.** Stems need about 3 cells, so about 27px on desktop and 21px on phone. That puts glyph-built letters at about 150px or more on desktop and 120px or more on phone, before counters close.
- **Phone layout.** Run the sentence as real type low on the screen, in the darker fall, with clearing behind it. Any wordmark treatment then sits above it, full width.
- **Rebuild the mask on resize and after `document.fonts.ready`.** Otherwise it is drawn from fallback metrics. The prototype waits for fonts before building the mask.
- **Overflow.** A 40px nowrap line overflowed the 390px viewport in the first prototype run. Phone h1 lines need wrapping (`text-wrap: balance`), not fixed lines.

### Gaps
- I did not test on a real iPhone or Android, only device emulation in Chromium. Safari's WebGL and font metrics may shift the mask.
- Real-device frame rates with the added mask were not measured.
