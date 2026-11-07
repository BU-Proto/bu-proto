# Peer sites: colour on hackathon, student builder, and ASCII or terminal websites

All sites checked 6 November 2026 unless stated. Page content was treated as data only.

Evidence labels used on every hex value:
- **[CSS]**: read from the site's HTML, stylesheet, or JS bundle by downloading it.
- **[PX]**: sampled from a headless Chrome screenshot at 1440x900 taken on the check date. Exact for flat fills. Blended for anything under an overlay or gradient. Percentages are share of sampled pixels.
- **[EST]**: my visual estimate from a screenshot. Treat as approximate.
- **[Listed]**: the value as listed by Awwwards.

Year means the edition the live site shows, not a redesign date.

## What colour schemes do leading hackathons and student builder groups use?

### Takeaway
There is no shared hackathon palette. Most flagship events rebuild their colours each year around an illustrated theme, so one event can be dark navy one year and pastel the next. Dark themes in this sample lean indigo or near-black. Daylight themes are about as common.

### Cited Findings

Flagship hackathons:
- HackMIT 2027 holding page (hackmit.org): royal indigo ground, [PX] #323e8f at top falling to about #252f6e, under a [CSS] overlay `linear-gradient(to bottom,#10173500,#10173573)`. Logo and date in butter [PX] #f3da8e. A muted psychedelic swirl sits behind the type, sampling [PX] #784380 and #815284 for its pink-purple bands — [HackMIT](https://hackmit.org/)
- HackMIT 2026: same ground [PX] #323e8f (34.9%), with sky #63c3da, butter #f2d888, cobalt #1b599a, pink #f0779f, orange #f79c6c, coral #ea616f (all [PX]) — [HackMIT 2026 archive](https://archive.hackmit.org/2026/)
- HackMIT 2025: light scheme, pink [PX] #ffb5ee (19.8%), yellow #fff9a2, blue #4783e0, lilac #d0a8e9, indigo #3c3ba4 — [HackMIT 2025 archive](https://archive.hackmit.org/2025/)
- HackMIT 2024: dark navy, [PX] #10173a at top-left to #1a2335, cream type #f9ecdc, pink button and date #ff86a9, yellow #fbdb79, with magenta-to-violet stippled stars [EST] — [HackMIT 2024 archive](https://archive.hackmit.org/2024/)
- Four straight HackMIT editions therefore give three dark indigo-navy grounds and one pastel. The current page's CSS still carries `--background-end-rgb: 255, 181, 238`, which equals 2025's pink #ffb5ee, so it is probably a leftover and not a live 2027 colour — [HackMIT](https://hackmit.org/)
- TreeHacks 2027: teal post-apocalyptic illustration, [CSS] #003e55, #73c8dd, #1f7185, #32b6d6, with [PX] sky #92dfee, plus lime patches [EST] — [TreeHacks](https://treehacks.com/)
- TreeHacks 2025: green and coral, [CSS] #ff5e5e, #fcf8b8, #064928, #06292e, #019153 — [TreeHacks 2025](https://2025.treehacks.com/)
- PennApps XXVII: green CRT, [CSS] `--bg:#070b07`, `--phosphor:#39ff14`, `--phosphor-dim:#1f9a0c`, `--cream:#f4ecd8`. A `--navy:#0a1628` token exists but is not visible in the hero — [PennApps](https://pennapps.com/)
- HackHarvard 2026 (hackharvard.io redirects to hhuh.io), "Hack to the Moon": [CSS] `--space:#01151e`, confirmed [PX] at 81.5%. Yellow #ffdd00 dominates. Other tokens: magenta #ff0aa8, blue #0b4a9a, wine #5b1030, lime #5aff00, mint #7dffaa — [HackHarvard](https://hhuh.io/)
- Hack the North 2026: daylight scheme, [CSS] #fbef9d, #f8e03a, #00e9eb, #f08b42, with red-brown type, mountains and a wooden table — [Hack the North](https://hackthenorth.com/)
- Hack the North 2025: dark, [CSS] #000820, radial #8136b7 to #311a78 to #1b0f3e, #8023cc to #2d2162, text #ffc0ff. The screenshot I captured showed only a dark green and yellow cave intro, so I did not see these purples rendered — [Hack the North 2025](https://2025.hackthenorth.com/)
- Hack the North 2024: cream and watercolour pastels, [CSS] #fdf7ea, #9cb1fc, #6f8df8, #223a60, #ffb0db, #e6b5f9. Every edition sets `theme-color` #141425 [CSS] — [Hack the North 2024](https://2024.hackthenorth.com/)
- Cal Hacks 13.0: flat navy sky [PX and CSS] #11153d (26.8%), with a painted green-blue-yellow globe, periwinkle #a7a5f9, [CSS] #02205e, #0560b4, #75bcff, and lime-to-blue `#b9df74` to `#2f7ab8` — [Cal Hacks](https://www.calhacks.io/)
- HackGT 13, "Seaside Market": daylight, [CSS] #0e6398, #552f1c, #93643d, #ed8c6c with sky blues — [HackGT](https://hack.gt/)
- MHacks 2026, "Digital Garden": olive and parchment, [CSS] `theme-color` #3a4a26, #ebe4ce, #445721, #f5f1de. CSS only, no screenshot — [MHacks](https://www.mhacks.org/)
- LA Hacks 2027: blue-to-peach dusk with campfire mascot. Top about #1c3f66, orange glow about #f08a5a [EST] — [LA Hacks](https://www.lahacks.com/)

Organisations and builder groups:
- Major League Hacking: light, [PX] #f5f5f5 (50.7%), yellow #f8b92a, red #e73727, blue #1d539f, with a monospace headline stepping from bright blue to dark navy by line [EST]. CSS has a navy and blue token scale down to #0a1e39 — [MLH](https://www.mlh.com/)
- Hack Club: warm dark ground [PX] #1f181f, token `--background:#17171d` in dark mode, red #ec3750 and orange #ff8c37 [CSS], cream #fff6eb [PX]. A light mode also exists. The word "teens" uses a cyan-to-purple-to-red text gradient [EST] — [Hack Club](https://hackclub.com/)
- Buildspace: closed farewell page, black [PX] about #060606 and a dimmed photograph. Reports no active palette — [Buildspace](https://buildspace.so/)
- Purdue Hackers, the closest university group found: cream [CSS] `--color-bg:#fffbf1`, `--color-primary:#7d3bff`, `--color-accent:#0084ff`, `--color-accent-2:#f0c`, yellow #fe0. Pink, violet and blue label software, hardware and design in the hero line — [Purdue Hackers](https://www.purduehackers.com/)
- hackNY: white Squarespace site, [CSS] #f0523d and #00b2ff, black and greys. CSS only — [hackNY](https://hackny.org/)

Other university hackathons:
- Hack@Brown 2027: vertical dusk from indigo to mauve, [PX] #2c2678 to #613d72, type [CSS and PX] #ffe788, also [CSS] #332984, lilac and pink skyline — [Hack@Brown](https://hackatbrown.org/)
- BoilerMake XIV: near-black purple [PX] #0d0618 (65.4%), [CSS] #21152f, #3b344b, yellow #ffe42d, lilac buildings [PX] #cab1ce — [BoilerMake](https://boilermake.org/)
- UofTHacks: [CSS] #091b33, `--hero-navy:#273b5e`, `--blue:#426cae`, `--hero-bg:#67c2ef`, coral glow #e95f4f at 16% alpha. CSS only — [UofTHacks](https://uofthacks.com/)
- nwHacks 2027: sunrise pastels, [CSS] #01dacc, #213553, #cae1f5, #f8c885, #ffaadc. CSS only — [nwHacks](https://nwhacks.io/)
- BostonHacks 2026, a Boston peer: white ground with light blue graph lines and thick red and blue transit-map lines, [CSS] `--track-blue:#2f9dd9`, #206ddf — [BostonHacks](https://bostonhacks.org/)
- HackBeanpot, also Boston: warm red, cream and navy, [CSS] #cc322d, #f7dfbc, #173c62, #091f36. CSS only — [HackBeanpot](https://www.hackbeanpot.com/)
- HackUMass XIV: maroon, [CSS] #a71930, #c52a3d, #720d22 — [HackUMass](https://www.hackumass.com/)

### Inferences
- Six of the 16 hackathons listed here clearly sit on a dark blue, indigo or purple ground in their current edition or a checked archive year: HackMIT, HackHarvard, Hack the North, Cal Hacks, Hack@Brown, BoilerMake. UofTHacks is possibly a seventh, on CSS evidence only. The rest are daylight, cream, teal, green or maroon. Dark navy is a common lane, not the default.
- Palette is a per-year decision at flagship events, so a fixed organisational palette, which BU Proto can have because it is a club, is itself a small differentiator from events.
- "Year-round" groups (Purdue Hackers, MLH, Hack Club) keep stable palettes and lean on type and texture for identity, a better comparison for BU Proto than annual events.

### Gaps
- MakeMIT: unreachable. Returned 403 with a Cloudflare bot check, in curl and headless Chrome.
- HackPrinceton (hackprinceton.org, www): host did not resolve. hacknyu.org timed out.
- Guessed domains that did not resolve or connect, which may simply be wrong addresses: hackersatberkeley.org, hack.harvard.edu, hack.mit.edu, builds.cs.bu.edu.
- Archive subdomains that failed: 2024.calhacks.io, 2023 to 2026.hackmit.org, 2024 and 2025.pennapps.com. 2024.treehacks.com returned HTTP 530. The Wayback Machine API returned 429 on every request, so no Wayback years were checked.
- hackgt.com redirected to an unrelated ad page and was discarded. hack.gt is the real site.
- HackIllinois resolved only to a holding page with what looks like a starter-template blue glow, so it is excluded. Hack Lodge and TartanHacks exposed almost no colour in CSS, and rendered views were not captured.

## Which of them use dark blue with pink or purple?

### Takeaway
Dark blue plus pink or purple is an established peer scheme. HackMIT 2024 and 2027, Hack@Brown 2027 and HackHarvard 2026 are the clearest cases, and Hack the North 2025 and BoilerMake lean purple. All of them pair it with a warm yellow or cream, a third colour BU Proto's scheme does not centre on. None of them uses a tinted glyph field.

### Cited Findings
- HackMIT 2024: navy [PX] #10173a with pink #ff86a9 and yellow #fbdb79, plus violet beams and magenta-to-violet stars [EST]. Strongest single match for navy with blue-pink-purple — [HackMIT 2024 archive](https://archive.hackmit.org/2024/)
- HackMIT 2027: indigo [PX] #323e8f with desaturated pink-purple swirl [PX] #784380 and #815284, cream type — [HackMIT](https://hackmit.org/)
- Hack@Brown 2027: literal blue-to-pink background gradient, [PX] #2c2678 to #3d2d75 to #503675 to #643e73, then lilac skyline, [EST] pinks around #e8a8d8, with yellow #ffe788 — [Hack@Brown](https://hackatbrown.org/)
- HackHarvard 2026: very dark teal-navy #01151e with magenta #ff0aa8 [CSS]. Magenta is a thin accent: link underlines, a cursor spotlight `radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,10,168,.25),transparent 60%)`, and a badge gradient. Yellow #ffdd00 carries the brand — [HackHarvard](https://hhuh.io/)
- Hack the North 2025: #000820 with #8136b7, #311a78 and #ffc0ff [CSS]. Rendering not confirmed, see above — [Hack the North 2025](https://2025.hackthenorth.com/)
- BoilerMake XIV: #0d0618 with lilac #cab1ce [PX], purple-black not blue — [BoilerMake](https://boilermake.org/)
- Cal Hacks 13.0: navy #11153d with periwinkle #a7a5f9 [CSS], no pink — [Cal Hacks](https://www.calhacks.io/)
- Purdue Hackers: the same pink, violet and blue family (#f0c, #7d3bff, #0084ff [CSS]) but on cream, as small accents — [Purdue Hackers](https://www.purduehackers.com/)
- Charm, a developer-tools company, is the closest gradient outside hackathons: blurred pink and blue orbs on violet, [PX] #6b50ff, #4a30d9, #ff6dff and [CSS] #ff80e3, with #fffdf5 type. It is saturated violet, not navy — [Charm](https://charm.land/)
- For comparison, BU Proto's repo defines `--harbor:#061a2e`, `--navy:#0b2a46`, `--sky:#7cc7f4`, `--iris:#ab9dff`, `--rose:#f4a2c0`, `--mint:#9df0a8`, and a `--field-sweep` running sky, iris, rose, lagoon at 115deg — `/Users/cjxsez/Desktop/bu-proto/src/index.css`

### Inferences
- Hue comparison, computed from the hex values above: BU Proto's #0b2a46 sits near 208°, a slightly green-leaning navy. Peer navies sit further toward violet: Cal Hacks #11153d about 235°, HackMIT 2026 #323e8f about 232°, HackMIT 2024 #10173a about 230°, Hack@Brown #2c2678 about 244°. Only HackHarvard #01151e, about 199°, is on BU Proto's side. This is a real point of separation worth preserving.
- BU Proto's `--iris` #ab9dff is very close to Cal Hacks' periwinkle #a7a5f9, so iris alone will not distinguish it.
- Peers almost always add yellow or cream to keep navy-and-pink from going cold. BU Proto's mint does a similar complementary job with less overlap.

### Gaps
- Hack@Brown pink and HackMIT 2024 violet are estimates. Those colours live in images, not CSS.
- Scroll sections were not sampled. Only first-viewport colour is reported, so colours deeper in a page may differ.

## Which sites use ASCII art, terminal or glyph-based visuals, and how do they colour them?

### Takeaway
Among hackathons, only PennApps commits to a terminal look. Outside hackathons the respected ASCII sites are overwhelmingly restrained: dark neutral ground, one or two flat glyph colours. I found no checked site with a gradient-tinted ASCII field on navy.

### Cited Findings

Hackathon and student sites:
- PennApps XXVII: whole page is a fake terminal, with `PENNAPPS.EXE` window chrome, `$ cat ./announcement.txt`, an ASCII logo in a `<pre>` boot screen, scanline and vignette overlays, Press Start 2P and IBM Plex Mono. Glyphs are single-hue phosphor #39ff14 with `text-shadow: 0 0 8px rgba(57,255,20,.45)` [CSS] — [PennApps](https://pennapps.com/)
- Purdue Hackers: glyph-adjacent, not ASCII. Bitmap pixel display type in black on cream, uppercase monospace body, 1-bit dithered black and white photos [screenshot] — [Purdue Hackers](https://www.purduehackers.com/)
- MLH uses a monospace headline and body on a faint grid, but no ASCII art — [MLH](https://www.mlh.com/)
- Hack Club has terminal references in copy only, such as `$ ssh jobs.hackclub.com -p 1337` — [Hack Club](https://hackclub.com/)

ASCII and terminal sites beyond hackathons:
- Aino: won Awwwards Site of the Day on 10 April 2023 at 7.48/10 and a Dev Award at 7.64/10. Listed palette #f5f5f0 and #161615 — [Awwwards: Aino](https://www.awwwards.com/sites/aino-1)
- Aino's CSS has `html.textmode` and `html.pixelmode` states that swap images for `.ascii` text, plus a user `SETTINGS` control. Glyph colour is a single variable, `--ascii-color:var(--black)`, with dark `24,24,24` and light `245,245,240` tokens. One accent #d66262 is present [CSS] — [Aino](https://aino.agency/)
- Aino's "ASCII Physics" is listed as an Awwwards element, with no stated award — [Awwwards: ASCII Physics](https://www.awwwards.com/inspiration/ascii-physics-aino-1)
- Café Cuba "Coffee Revolution": Awwwards Site of the Day 19 July 2014 at 7.07/10, using MS-DOS-style ASCII animation. Listed #987654, #D14836, #FFFFFF. The live site was not checked — [Awwwards: Café Cuba](https://www.awwwards.com/sites/cafe-cuba-coffee-revolution)
- Ghostty: animated ASCII ghost in a window frame. Ground [PX] #0f0f11 (84.6%), body glyphs grey [PX] #c3c3c4, halo glyphs brand blue [CSS] `--brand-color:#3551f3`. Frames are text strings embedded in the HTML, with highlighted runs wrapped in `<span class="b">` and coloured by `.b{color:var(--brand-color)}` — [Ghostty](https://ghostty.org/)
- Oxide: uses the ertdfgcvb play.core library, shown by class `ertdfgcvb-play-core` on `ascii-animation-wrapper` elements, plus a tiled `/img/ascii-pattern.svg`. Ground [PX] #0a0e12, green #48d597 [CSS]. Its "404" animation returns one colour per cell, `{char:E1[l],color:"#E86886"}`, so a pink flat glyph with characters cycling by `(cols+y+x+frame)` — [Oxide](https://oxide.computer/)
- Oxide's hero terminal panel rendered empty in headless Chrome, so its live ASCII colours are unconfirmed except for that pink — [Oxide](https://oxide.computer/)
- play.core itself: the renderer takes a `main(coord, context, cursor, buffer)` function per cell, which returns a character or an object with a `char` field. Its demo list includes "Chroma Spiral" and "Doom Flame (full color)". Default view is black glyphs on white — [play.core](https://play.ertdfgcvb.xyz/)
- Kostya Farber: white-on-black ASCII torus loader, [PX] #000000 and #ffffff, no colour at all — [Kostya Farber](https://www.kostyafarber.com/); listed as Awwwards inspiration — [Awwwards: ASCII loading animation](https://www.awwwards.com/inspiration/ascii-loading-animation-kostya-farbers-website)
- OpenCode: all-monospace site, [PX] #131010 and #080808, block-pixel wordmark with dim "open" and bright "code", grey scale throughout, with a small blue bar in the terminal mockup [EST] — [OpenCode](https://opencode.ai/)

### Inferences
- Award and respect in this niche correlate with restraint. The most cited pieces are monochrome or near it.
- PennApps shows the risk: terminal styling at full strength becomes the familiar green hacker cliché. Blue-pink avoids that default.

### Gaps
- WRDLSS (wrdlss.com, www, wrdlss.xyz) did not connect, and its Refero style page returned "Style not found", as did Refero's Aino page.
- Aino's glyphs did not render headless, even with a 25 second budget. Only nav text and ground appeared. Its colour notes come from CSS and Awwwards.
- A search for a recent Awwwards Honorable Mention or Site of the Day specifically for ASCII sites in 2025 and 2026 found nothing I could confirm. Absence here reflects search limits, not proof none exist. Nominee and Developer Award galleries were not browsed.
- MHacks and nwHacks "ascii" string hits were library code, not visuals. No claim made.

## How do those sites treat gradient and glyph colour together?

### Takeaway
Across checked sites, gradient and glyph are almost always kept apart. Sites either use flat-coloured glyphs on a flat ground, or a gradient behind ordinary type. Gradient-tinted glyphs, BU Proto's treatment, did not appear on any checked peer, so it is the most ownable part of the identity, with no live precedent to copy for legibility.

### Cited Findings
- Monochrome glyph on flat ground: Kostya Farber (#fff on #000) — [Kostya Farber](https://www.kostyafarber.com/); Aino (single `--ascii-color`) — [Aino](https://aino.agency/)
- Two-tone flat glyphs: Ghostty, grey body and brand-blue halo, assigned by span, no gradient — [Ghostty](https://ghostty.org/)
- Single-hue glow: PennApps, where a soft `text-shadow` plus a green radial `#0d1a0d` behind and CSS scanlines above give depth without any hue shift — [PennApps](https://pennapps.com/)
- Per-cell colour by code: play.core returns colour per cell, so a gradient is technically available — [play.core](https://play.ertdfgcvb.xyz/); Oxide's checked animation uses one flat colour with it — [Oxide](https://oxide.computer/)
- Gradient behind ordinary type, no glyphs: Charm's blurred pink and blue orbs under white sans type — [Charm](https://charm.land/); Hack@Brown's vertical dusk under yellow type — [Hack@Brown](https://hackatbrown.org/)
- Gradient clipped into a word: Hack Club's multicolour "teens" — [Hack Club](https://hackclub.com/); HackHarvard's magenta-to-green "RECAP" badge — [HackHarvard](https://hhuh.io/)
- Gradient as grain, the nearest relative of a glyph field: HackMIT 2024 fills stars and a planet with stippled magenta-to-violet noise — [HackMIT 2024 archive](https://archive.hackmit.org/2024/); Purdue Hackers renders photos as 1-bit dither — [Purdue Hackers](https://www.purduehackers.com/)
- Technique note, snippet-level only: a third-party Ghostty-style React recreation describes loading ASCII frames and applying colour with radial gradients and CSS blend modes such as overlay or screen. It is a reconstruction and does not reflect Ghostty's code, which uses flat spans as shown above — [react-gradient-glow](https://gh.r-mj.com/developedbyed/react-gradient-glow)

### Inferences
- Sites that do keep a glyph layer keep type legible by separating layers: glyph art sits in its own frame (Ghostty) or the art stays low contrast. No checked site runs body text directly over a bright glyph field. HackMIT 2027 shows the nearest illustrated equivalent, dimming a busy swirl with a navy overlay so type stays readable on top.
- BU Proto's own `--on-field-shadow` token follows the same logic by protecting text on the field.
- A blue-pink tint on glyphs reads as light on a field if hue changes spatially, and as noise if it changes per character. No peer evidence settles this. It would need testing on the BU Proto site.

### Gaps
- Sample is a first-viewport or CSS-level look at about 30 sites. A gradient-tinted ASCII site may well exist outside it, and such effects are common as component demos. Claims of absence apply to checked sites only.
- WebGL or canvas colour cannot be read from CSS. Only what appeared in screenshots is reported.

## What makes a peer site feel distinctive rather than generic?

### Takeaway
Distinctive peers commit to one specific world or one material idea, and colour follows from it. Generic ones pick a colour scheme first and apply it to a template. Ownership comes from a concrete local or conceptual reference, custom type, and willingness to push one idea to its limit.

### Cited Findings
- A specific, named world drives the palette: HackGT's "Seaside Market" with bear mascot at a stall — [HackGT](https://hack.gt/); TreeHacks' overgrown ruined city and glowing seedling robot — [TreeHacks](https://treehacks.com/); Cal Hacks' animal mascot in a biplane over a painted globe — [Cal Hacks](https://www.calhacks.io/); MHacks' "Digital Garden" — [MHacks](https://www.mhacks.org/)
- Local reference: BostonHacks uses subway-map lines, stations as nav stops, and hand-drawn lettering on white, the least typical palette in the sample — [BostonHacks](https://bostonhacks.org/)
- Hack@Brown and LA Hacks show that dusk gradient plus city or landscape is becoming a shared trope — [Hack@Brown](https://hackatbrown.org/); [LA Hacks](https://www.lahacks.com/)
- Full commitment to one material: PennApps' CRT carries through boot screen, scanlines, form labels and buttons — [PennApps](https://pennapps.com/)
- Print and pixel identity for a year-round club: Purdue Hackers combines pixel display type, 1-bit photos, tilted cards and a graph-paper ground, with colour used only for three words and a CTA — [Purdue Hackers](https://www.purduehackers.com/)
- Real people as content: Hack Club's tilted photo collage and stickers around a central serif headline, and red line-art that fades in below — [Hack Club](https://hackclub.com/)
- Custom logotype per year: HackMIT's H-A-C-K tile mark changes with each theme, with bunny, clock and card motifs on the 2027 page — [HackMIT](https://hackmit.org/)
- Awwwards rewarded a total system at Aino: site-wide text and pixel modes with user settings, not a decorative ASCII hero — [Awwwards: Aino](https://www.awwwards.com/sites/aino-1); [Aino](https://aino.agency/)
- Generic signals seen: HackIllinois' holding page carries what looks like a framework starter glow, `rgba(1,65,255,.4)` on `--background-rgb:34,34,34` [CSS] — [HackIllinois](https://hype.hackillinois.org/); hackNY runs on a stock Squarespace structure with near-default neutrals [CSS] — [hackNY](https://hackny.org/)

### Inferences
- For BU Proto the ASCII field is the equivalent of a "world". It will feel owned if it behaves like a material across the site, as PennApps' CRT and Aino's text mode do, and less so if it is only a hero background.
- Colour alone is not distinctive in this lane. Navy-pink-purple is already used by HackMIT, Hack@Brown and others. The likely unique combination is greener navy, gradient-tinted live glyphs, and a Boston student builder context.
- Dusk gradients behind a skyline are the cliché to avoid, given Hack@Brown, BoilerMake and LA Hacks already use city or landscape silhouettes.

### Gaps
- "Distinctive" is my judgement from viewing the sites. No audience or designer evidence was gathered.
- No data was found on whether these palettes influence applications or attendance.
