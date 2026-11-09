# Premium blue, violet and pink sites: studios, agencies, portfolios, events

Method for every value below, unless a line says otherwise. All sites were loaded on 2026-11-06 in headless Chrome at 1440x900.

- **CSS** means a computed style or custom property read from the live page.
- **Sampled** means a mean of 40x40px boxes, or a palette quantised from the first-viewport screenshot. These are measured, but they can land on images or anti-aliased edges.
- **Estimate** means read by eye from a screenshot.
- Colour distance is plain RGB Euclidean distance from the brief's targets. It is a rough screen, not a perceptual measure.

About 110 URLs were attempted across hand-picked candidates and Awwwards listings (events, Sites of the Day, and colour filters). Ten made the shortlist.

## Which sites match? URL, date checked, confirmed awards

### Takeaway
No site is an exact match. Seven are partial and three are mood matches. The best ground match is Josh W. Comeau, the best pink is Webflow Conf '26, and the best atmosphere plus texture is ViteConf 2026. Only Metalab holds a confirmed award for its current domain, and Stripe Sessions holds one for an earlier edition. The award-winning event sites I checked did not match on colour, so the brief's palette and confirmed craft awards barely overlapped in this sample.

### Cited Findings
Rank key:
- Exact: ground within about 15 RGB of #061a2e, with blue, violet, pink and raspberry all near target.
- Partial: at least two colour families close.
- Mood: same atmosphere, few close values.

All ten were loaded and checked on 2026-11-06.

1. **Josh W. Comeau** (personal site and blog). Rank: partial, closest ground. Ground is about 13 from target. No award found: a search surfaced none, which does not rule one out. — [joshwcomeau.com](https://www.joshwcomeau.com/)
2. **ViteConf 2026** (online conference, 15 Oct 2026). Rank: partial, best atmosphere. No award checked or found. — [viteconf.org](https://viteconf.org/)
3. **Webflow Conf '26** (conference). Rank: partial, best pink (#f5a0d4 sampled, about 20 from target) on a neutral black ground. No award found. — [webflow.com/webflowconf](https://webflow.com/webflowconf)
4. **Devcon 8 India** (conference, Mumbai, 3-6 Nov 2026). Rank: partial. Plum-navy ground, violet and pink hero. No award checked or found. — [devcon.org](https://devcon.org/en/)
5. **PyCon US 2026** (conference). Rank: partial. Ground about 17 from target, but the hero is much hotter than the brief. No award checked or found. — [us.pycon.org/2026](https://us.pycon.org/2026/)
6. **Cal Hacks 13.0** (student hackathon). Rank: partial, ground and soft violet only, no pink. Most relevant to a student builders' organisation. No award checked or found. — [calhacks.io](https://www.calhacks.io/)
7. **XDW 26 Design System** (conference design system). Rank: partial, ground and blue only, no pink. Ground is about 14 from target. No award checked or found. — [design.thinkdigital.travel/xdw](https://design.thinkdigital.travel/xdw/)
8. **Microsoft Ignite** (conference). Rank: mood, weak. Ultramarine ground, blue to violet gradient, no pink. No award checked or found. — [ignite.microsoft.com](https://ignite.microsoft.com/en-US/home)
9. **Metalab** (agency). Rank: mood. Near-black with violet light. Confirmed award: Awwwards Site of the Day, 24 Apr 2024, 7.44/10, plus a Dev Award, 7.2/10. — [metalab.com](https://www.metalab.com/); award: [Awwwards](https://www.awwwards.com/sites/metalab)
10. **Stripe Sessions 2027** (conference). Rank: mood. Saturated ribbon on a light ground, so no dark ground at all. Award on the earlier edition only: Honorable Mention, 4 May 2023, for Sessions 2023. No award confirmed for the current site. — [stripesessions.com](https://stripesessions.com/); award: [Awwwards](https://www.awwwards.com/sites/stripe-sessions-2023)

Award-recognised sites loaded and rejected on colour (hue check, with most also reviewed by eye):
- OFFFForum: Site of the Day and Developer Award, 16 Oct 2026. — [Awwwards events](https://www.awwwards.com/websites/events/)
- Design Bomb Festival: Honorable Mention, 11 Sep 2026. Black and cream with magenta panels. — [Awwwards events](https://www.awwwards.com/websites/events/)
- The Drool Creative Community: Honorable Mention, 5 Sep 2026. — [Awwwards events](https://www.awwwards.com/websites/events/)
- Hello Monday: Site of the Day, 7 Oct 2019. Its current home loaded almost pure white (#ffffff, 95% of quantised pixels), which contradicts a search snippet describing it as dark with neon accents. — [Awwwards](https://www.awwwards.com/sites/hello-monday); [site](https://www.hellomonday.com/)
- DeepBook (Site of the Day, 3 Nov 2026) and Grids (Site of the Day, 2 Nov 2026) loaded but scored low on a hue check. DeepBook is black with blue on screenshot review; Grids was not reviewed by eye. — [Awwwards colour filter](https://www.awwwards.com/websites/%2303364F/?page=2)

Loaded and rejected without an award check: Figma Config, Token2049, Slush, React Miami, React Summit, Web Summit, GitHub Universe, Devconnect, ETHGlobal, TreeHacks, Hack the North, Epic Web Conf 2025, Hamol Studio, Vercel Ship, re:Invent, Adobe MAX, Microsoft Build, TwitchCon, Solana Breakpoint, Render ATL. Token2049 was closest of these: body #111122 and scrim #020219 (CSS), photo-led, no pink.

### Inferences
- The brief's exact palette looks rare in this category. Sites with the target navy tend to use it with one accent, and sites with blue, violet and pink usually sit on black, plum or a light ground.
- A build using these exact colours would be distinctive rather than a copy of a known look. That rests on this sample, not a census.
- Awards are a weak proxy here. Three of the best colour leads are community or developer events with no award I could find.

### Gaps
- Godly, Siteinspire, One Page Love and Minimal Gallery were not systematically browsed. Searches returned no usable hits from them. Coverage leans on Awwwards listings and hand-picked URLs, so a real match could be missing.
- FWA, CSSDA and Webby records were not searched per site. "No award found" means none surfaced, not none exists. Sites marked "not checked" had no award search at all.
- Only page 1 of most Awwwards listings was read. Each has at least 5 pages.
- The Awwwards listings were read through a summarising fetch tool, which miscounted one list. Treat dates from listings as good but not verified on each site's page. Metalab, Stripe Sessions 2023 and Hello Monday were checked on their own pages.

Unreachable:
- synesthesia.world: navigation timeout.
- soon.ooo: connection refused.
- blackmagic.studio: DNS failure.
- obys.agency: DNS failure in my run, though grids03.obys.agency loaded.
- nodesfestival.com: DNS failure.
- continuance.ai: connection reset.
- dimension.studio: certificate error.
- conference.awwwards.com: returned 404 at the root.

The soon.ooo, blackmagic.studio, nodesfestival.com and dimension.studio addresses were my guesses, so these failures say nothing about the real sites.

Partly captured (page returned 200 but some scroll shots or style reads timed out): Lusion, Active Theory (title "Not Supported" in headless), Unseen, basement.studio, Igloo, GitHub Universe, FWRD 2026, TEDxPortland, Into Design Systems, Solana Breakpoint, EthCC, Compass Pathways, Web Builder Agency, Brittany Chiang, Ramotion. WebGL-heavy studios may look different on a real GPU, so they should not count as ruled out. Brittany Chiang in particular showed a navy ground but was not fully measured.

## What are the ground, gradient stops, accent and text colours?

### Takeaway
The closest grounds are #111b27 (Josh Comeau) and #131e33 (XDW). The closest pink is #f5a0d4 sampled on Webflow Conf. The closest raspberry is #b63359 sampled on ViteConf. The nearest real gradient to the brief's ground-to-blue move is #111b27 to #265973 on Josh Comeau.

### Cited Findings
- **Josh W. Comeau.** Ground #111b27 (CSS, about 13 from target) above #0d0f12 (sampled, main body). Gradient #111b27 to #265973 (CSS). Accents #ff1a81 (CSS, raspberry family but about 72 from target and far brighter) and #809fff (CSS). Text #e3e6e8, secondary #afcfde (CSS). Violet #665692 (sampled, from hero art). — [Site](https://www.joshwcomeau.com/)
- **ViteConf 2026.** Page ground #111318, sections #090b10 and #0f1115 (CSS). Hero sampled #10081c, #180a22, #2c0f31 (plum-black), #5a1d47, #90214f, #b63359 (about 37 from raspberry), #aa2754, with warm highlight #c0baa3. Accent #5cedf4 (CSS). Text white at 90%, and rgba(183,198,232,.8) (CSS). — [Site](https://viteconf.org/)
- **Webflow Conf '26.** Ground #080808 (CSS). Sampled pinks #f5a0d4, #f597cb, #e65b8f, #f370a2, and #d64984. Named pink #ed52cb, blue #146ef5, green #00d722 (CSS). Text white, #ababab (CSS). Bottom band #e1edfe (sampled). — [Site](https://webflow.com/webflowconf)
- **Devcon 8 India.** Scrim #221144 and #160b2b (CSS) over a raster hero. Sampled #1a1244, #393275, #5c397f, #8b6cbb, #7a94c8, #6395db, #b894b2, #cfb3c2, and pale cyan #9afaf6. Text white, then #30354b and #160b2b on light sections (CSS). — [Site](https://devcon.org/en/)
- **PyCon US 2026.** Root ground #090a28, panels #101136, CSS gradient #3b3ea9 at 23.5% to #101136 at 53.29%, accent #680579, text white (CSS). Hero sampled top to bottom #3d15bf, #911cc2, #e132db, with skyline #1d052c. — [Site](https://us.pycon.org/2026/)
- **Cal Hacks 13.0.** Ground #11153d (CSS, about 19 from target). Text #b9d5ff, soft violet #a7a5f9 (CSS). Illustration gradient #b9df74, #9fd17e, #65bba1, #2f7ab8 (CSS). Dark ink #0f1d5b (CSS). No pink found. — [Site](https://www.calhacks.io/)
- **XDW 26.** Ground #131e33, surfaces #0d1628, gradient #0c1730 to #213457 (CSS). Blues #33a5f7, #6cbdfa, #2680c2 (CSS; #2680c2 is about 19 from the target blue). Text white, #f4faff (CSS). No pink. — [Site](https://design.thinkdigital.travel/xdw/)
- **Microsoft Ignite.** Body #000000 (CSS), sampled ground #02033b, #000027, #010119. Gradients #2c8189 to #2e64b6 to #7656ad, and #53276a to #6795ff (CSS). Text #f4fafd (CSS). — [Site](https://ignite.microsoft.com/en-US/home)
- **Metalab.** Body #000000, text white, --purple #584dff, --dark-purple #100037 (CSS). Sampled #02000e, #030016, #13122b, #2d244c, #544480, #756e8a. Awwwards lists only #000000 and #ffffff. — [Site](https://www.metalab.com/); [Awwwards](https://www.awwwards.com/sites/metalab)
- **Stripe Sessions 2027.** Ground #f9f7f7, text #20033c, dark #140424 (CSS). Named colours #ff2ede, #3760f1, #883fff, #d298ff, #4b1aa6, #ef6a14, #ffcb30 (CSS). Ribbon sampled #4e16f8, #1842f2, #841afe, #db1582, #df3356, #fe3302. — [Site](https://stripesessions.com/)

### Inferences
- Nobody here pairs the target pink with the target navy. Webflow's pink on #080808 suggests the pair needs a very dark ground, and ViteConf shows a raspberry-plum field holds white type well.
- #265973 is a useful finding: a desaturated mid-blue as a gradient's top stop gives depth without announcing itself as a gradient.

### Gaps
- Hero artwork on Devcon, ViteConf and PyCon is largely raster or illustrated, so those stops are sampled from pixels, not authored CSS. Exact stops are unknown.
- Webflow's hero is canvas-drawn, so its authored palette could not be read.
- Dark mode was whatever each site served by default. Josh Comeau's light theme was not sampled.
- Only 1440x900 was tested. No mobile values.

## What craft details make each feel premium?

### Takeaway
The strongest repeatable tricks are cheap: ViteConf's CSS scanline overlay, Stripe's tight light-weight display type, Metalab's restrained light on black, and Devcon's edge fades that melt art into the ground. True film grain was rarer than expected. Only XDW documents it.

### Cited Findings
- **ViteConf texture.** A full-screen `.crt__scanlines` layer uses `repeating-linear-gradient(#0000 0 2px,#00000047 2px 3px)` with `mix-blend-mode:multiply` and `opacity:.55`, plus a vignette. A 0.72s `steps(8,end)` de-rez animation runs when the hero changes mode. A radial vignette reaches rgba(0,0,0,.55) at the edge (computed style). — [Site](https://viteconf.org/)
- **ViteConf object language.** A teal wireframe ship and glassy shards sit on the field, with a mono "THAT'S A WRAP" status pill. Section heading is Manrope 56/64px, weight 800. — [Site](https://viteconf.org/)
- **Webflow Conf glyph and texture.** Screenshots show pixelated, dithered image blocks in pink, orange and blue, with hero type at 112/116.5px, weight 500, on #080808. A canvas element is present. Italic words sit inside the sans headline (estimate). — [Site](https://webflow.com/webflowconf)
- **Stripe Sessions type.** H1 is sohne-var 100/85px, weight 250, tracking -4px (-0.04em). H2 is 60/51px, -1.8px. Line-height below 1 at weight 250 is the signature move. — [Site](https://stripesessions.com/)
- **Metalab restraint.** H1 style is PP Eiko 88/103.8px, weight 240, tracking -1.76px, with the sentence staggered across two lines. A vertical list of client pills is the only UI on the hero. Colour comes from violet light on black geometry, not from fills. Three video elements, no canvas. — [Site](https://www.metalab.com/)
- **Devcon depth.** Art is blended into the page with `hard-light` edge gradients in rgb(34,17,68), 160px wide at the sides and also along the base, plus an `overlay` gradient. The hero is framed by the ground colour, not cropped hard. Type is Poppins 800 at 48/57.6px, with a mandala line pattern in the sky. — [Site](https://devcon.org/en/)
- **Josh Comeau small details.** Section eyebrows are 16px, tracking +2px, uppercase, in #ff1a81. Rainbow-and-character art and a sound icon in the nav add personality; interaction was not tested. Tinted text (#afcfde) replaces grey. — [Site](https://www.joshwcomeau.com/)
- **XDW grain and glow.** Search output for the page describes dark grain surfaces with an SVG noise overlay and blue glow instead of drop shadows. Live check supports this: 2 elements hit my noise check, plus tokens --blue-glow rgba(51,165,247,.12) and --blue-border rgba(51,165,247,.1). H1 is Poppins 800, 57.6/60.5px, -1.44px. — [Site](https://design.thinkdigital.travel/xdw/)
- **Cal Hacks.** Display serif Arapey at weight 900, 64.8/57px, tracking -2.9px, is unusual for a hackathon. Stars are drawn with stacked radial gradients, and a canvas and multiply blending are present. — [Site](https://www.calhacks.io/)
- **Ignite atmosphere.** Blurs of 40px and 80px build soft colour fields, with type at 62/72px, weight 500. — [Site](https://ignite.microsoft.com/en-US/home)
- **Technique note.** One guide says 8-bit output cannot represent a slow dark gradient and recommends adding screen-space noise to avoid banding. This is a community skill file, not a primary reference. — [GitHub](https://github.com/praveentewatia26/award-grade/blob/main/skills/webgl-shader-fx/SKILL.md)

### Inferences
- A student organisation should take these, in order of cost: tight display type, tinted text and hairlines, edge fades into the ground, one CSS texture layer, then a single glowing object. None needs WebGL.
- Scanlines suit a glyph or ASCII identity better than generic grain, because they read as a deliberate screen.
- Restraint scales with brand confidence. Metalab can show almost nothing. A student group will likely need ViteConf's level of richness, kept to the hero.
- Keeping one ground colour across sections matters. Devcon and PyCon lose some atmosphere when they cut to white or to busy photo sections.

### Gaps
- Motion was not observed live. Only static captures and CSS rules were reviewed, so ViteConf's animation is known from its stylesheet and scroll behaviour is unassessed everywhere.
- Spacing scale was not measured systematically.
- Grain could not be isolated. A local-variance check on smooth tiles could not separate grain from image compression and texture, so no site is claimed to have grain from that test. Devcon's 42 noise-check hits appear to be a false positive, since a direct re-check found only gradient blends.
- Webflow's dithering is identified from screenshots only. Its code was not read.

## Rank by colour match

### Takeaway
Exact: none. Partial, strongest first: Josh Comeau, ViteConf, Webflow Conf, Devcon, PyCon, XDW, Cal Hacks. Mood only: Ignite, Metalab, Stripe Sessions.

### Cited Findings
- Exact: no site met the bar. Grounds came close (#111b27, #131e33), but neither site has the full set. — [Josh Comeau](https://www.joshwcomeau.com/); [XDW](https://design.thinkdigital.travel/xdw/)
- Partial, Josh Comeau: ground and blue-teal gradient close, raspberry family present but brighter than target, violet only in artwork. — [Site](https://www.joshwcomeau.com/)
- Partial, ViteConf: raspberry and plum close, ground too purple, no target blue. — [Site](https://viteconf.org/)
- Partial, Webflow Conf: pink nearly exact, ground black, blue more saturated than target. — [Site](https://webflow.com/webflowconf)
- Partial, Devcon: violet, blue and dusty pink present together, the only site showing all three in one soft field, but lighter and more plum than target. — [Site](https://devcon.org/en/)
- Partial, PyCon: ground close, hero magenta and ultraviolet far more saturated. — [Site](https://us.pycon.org/2026/)
- Partial, XDW: ground and blue close, nothing warm. — [Site](https://design.thinkdigital.travel/xdw/)
- Partial, Cal Hacks: ground and soft violet close, no pink. — [Site](https://www.calhacks.io/)
- Mood, Ignite: blue to violet atmosphere on ultramarine, about 27 from target ground. — [Site](https://ignite.microsoft.com/en-US/home)
- Mood, Metalab: violet light on black. — [Site](https://www.metalab.com/)
- Mood, Stripe Sessions: same hue family, light ground. — [Site](https://stripesessions.com/)

### Inferences
- If only three references are used: Devcon for colour relationship, ViteConf for texture, Metalab or Stripe for type discipline.
- The order inside "partial" is my judgement. It weighs ground closeness first and is not a computed score.

### Gaps
- The bars for exact, partial and mood were set by me for this task, and no perceptual metric such as Delta E was used.
- Live sites change. These results reflect 6 Nov 2026, and event sites in particular may be replaced soon.
