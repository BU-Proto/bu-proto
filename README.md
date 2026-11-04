# bu-proto

The site for **BU Proto** (working name), a BU-sponsored home base for students who make things, built with React, TypeScript, React Router and Vite. The concept behind every page is in [`docs/concept.md`](docs/concept.md).

The background is an ASCII field: the gradient from the reference design rendered as monospace characters that drift and shimmer on their own. The cursor's wind slides the characters around and rewrites the ones along its path into a Stable-Fluids trail of `○ > _` glyphs that dissolves within about a second. The gradient's colors never move with the cursor.

## Run it

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Typecheck (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Typecheck only |
| `npm run lint` | Oxlint |

## Pages

| Route | Page |
| --- | --- |
| `/` | Home: hero, the three tracks, the rhythm, next event, upcoming deadlines, latest wins, join |
| `/hackathons` | Upcoming hackathons as a departures board |
| `/grants` | The microgrant fund: coming soon, the plan, and an interest list (not an application) |
| `/wins` | Win cards: photo, project, placement, team, Devpost |
| `/track-record` | Logo walls: where members have worked, sponsors, partners, other wins |
| `/resources` | The playbook index |
| `/events` | Upcoming events with RSVP |
| `/board` | The board |
| `/join` | What you get, the sign-up form and the Discord |

Anything else renders the 404 page. Every route is a client-side route, so the host has to answer any unknown path with `index.html` (see [Deploying](#deploying)).

## Content

All copy lives in `src/content/`, one typed file per page plus `site.ts` for the brand, the nav and hack night's time and place. Anything made up carries `placeholder: true` and renders with a small **sample** tag, so fake hackathons, wins, people or times can't ship unnoticed. Remove the flag only once the item is real and checked. `trackRecord.ts` takes real, verified logos only and has no samples on purpose.

The two forms (`/grants` interest list and `/join`) validate in the browser and then show a thank-you state. They don't send anything anywhere yet; see the TODO in `src/components/Form.tsx`. RSVPs on `/events` are the same.

## Using the field

- **Move the cursor.** The characters slide with the wind and ease back into place. Along your path they turn into `○ > _` and dissolve back into the field within about a second. The trail uses the background's own grid at whatever glyph size is set.
- **Click.** An expanding shockwave.
- **Leave it alone.** The field keeps breathing: the gradient sways slowly, glyphs shimmer, and every few seconds a patch of characters swells sideways and settles.
- With `prefers-reduced-motion`, the field renders once and the simulation stays off.

## Layout

```
src/
  App.tsx                the routes; every page renders inside Layout
  ascii-field/           background engine (plain TypeScript) and its React wrapper
    AsciiField.tsx       <AsciiField>: owns the canvas and the engine's lifecycle
    engine.ts            animation loop, input and resize handling; lays the trail into the grid
    fluid.ts             Stable-Fluids solver: the trail's fog and the wind that slides the characters
    renderer.ts          renderer interface, glyph atlas, WebGL2-or-Canvas-2D choice
    webglRenderer.ts     draws every pixel in one fragment shader (the normal path)
    canvasRenderer.ts    Canvas 2D fallback for browsers without WebGL2
    ambient.ts           the gradient's slow sway and the glyph tint
    gradient.ts          bilinear sampling of the colormap
    colormap.ts          48×30 gradient sampled from the reference design
    noise.ts             value noise that picks ○ or > inside the trail
    textClearing.ts      keeps the trail off text marked data-fog-clear
    settings.ts          settings type, defaults and every tuning constant
  components/
    Layout.tsx           mounts the field once, the top bar, the page and the footer
    TopBar, MenuSheet, Footer, Hero, ScheduleCard, FeatureStrip, PageIntro, SampleTag, Form, IconButton, icons
    ui.module.css        shared glass panels, buttons, the sample tag and the page intro
  content/               all copy, one typed file per page (see Content)
  lib/dates.ts           formatting and countdowns for the ISO dates in content
  pages/                 one component and CSS module per route
```

`AsciiField` has no dependency on the rest of the page. Drop it into any layout:

```tsx
<AsciiField settings={DEFAULT_FIELD_SETTINGS} className="field" />
<h1 data-fog-clear>The trail fades out around this text</h1>
<a data-fog-clear="box">…and around this whole button</a>
<div data-fog-ignore>Clicks in here don't trigger the shockwave</div>
```

## How the field works

**Background.** Each cell of a monospace grid takes its character from the gradient's brightness at that cell, read bilinearly from a 48×30 colormap and mapped onto the ramp (default `.,:;'-~=+<>*xo%#@`). A column wave at the reference's rib spacing (about 67 ribs across) imitates its fluted glass. Glyphs are tinted with the gradient under them, lifted toward white so they read as texture over a wash of the same gradient on a dark ground.

**Ambient motion.** The gradient sways slowly (about 1% of the viewport, over roughly 20 seconds), each glyph shimmers faintly, and every couple of seconds a swell slides a patch of characters a few pixels and lets it settle. Two layers of value noise also roll through the field, pushing each character up or down the ramp, while the fluted-glass ribs slide sideways. These waves ease off behind elements marked `data-fog-clear`, and `DEFAULT_FIELD_SETTINGS.drift` sets their strength (0 turns them off).

**Trail.** The trail follows the reference fog's math. A Stable Fluids solver runs diffuse, project, advect and project each frame. Each pointer move adds the pointer's velocity as force and deposits fog with a smoothstep brush that grows with speed; the fog is laid every half brush along the move, so fast flicks and slow frames still leave an unbroken trail. A click starts four rings that ease outward together. Fog drifts with the wind and decays as `exp(−1.2·dt)`.

For each cell the fog covers, `luma = texture × min(density, 1)` runs through contrast, gamma, invert and quantize to give `○`, `>`, `_` or blank. Density decides whether a glyph exists at all, and a slowly scrolling noise texture decides which one. Those glyphs replace the background's characters in the same cells, at the same size, and a veil dims the characters beneath the fog by up to 60% so the trail reads clearly. The fluid grid and the brush scale with the glyph size (the reference uses 11px characters), so the trail keeps its proportions at any setting.

**Character push.** A fraction of the wind (the panel's *Character push*, 25% by default) carries a second field: where each character sits relative to its home. The shader slides every glyph by that amount, blurred over about 20px so the grid moves as one smooth sheet, and capped so a glyph never stretches by more than 40% and the grid never folds. Characters ease back home at 2.5/s, and the wind calms down half a second after the pointer stops. The colors are always the gradient at the pixel itself, so nothing about the gradient moves with the cursor.

**Rendering.** The CPU runs the fluid and writes 4 bytes per cell for the cells the fog touches, plus the slide field. One WebGL2 fragment shader then does the rest per pixel: the swaying gradient, which character has slid over the pixel, that character's glyph (picked from the brightness at its home), the trail glyph, the tint and the wash. Where WebGL2 isn't available, a Canvas 2D renderer draws the same field with the glyphs picked on the CPU and held in place. When nothing moves, the solver sleeps until the next stroke, click or swell.

**Readability.** Elements marked `data-fog-clear` (their text lines) or `data-fog-clear="box"` (their whole box) are rasterized onto the character grid and blurred, and the trail steps back from them. The engine re-measures on resize, scroll, font loads and when the marked elements change size.

## Tuning

Every constant lives in `src/ascii-field/settings.ts`. Start with these:

| Constant | Default | Effect |
| --- | --- | --- |
| `FOG.HOVER_RADIUS` | 13 | Brush radius in px at 11px glyphs (scales with glyph size); grows by up to `FOG.DRAG_MAX` with speed |
| `FOG.FORCE_SCALE` | 0.5 | How much of the pointer's velocity becomes wind |
| `FOG.DEN_DISSIP` | 1.2 | How fast the trail fades; lower lingers longer |
| `FOG.DIFFUSION` | 0.7 | Velocity diffusion per frame; higher keeps the trail closer to the path |
| `FOG.TEX_SHAPE` | 1.8 | Ratio of `○` to `>`; lower gives more `○` |
| `FOG.VEIL` | 0.6 | How much the characters under the trail are dimmed |
| `FOG.SPLASH_RANGE` | 170 | Shockwave reach in px at 11px glyphs |
| `FIELD.PUSH_RELAX` | 2.5 | How fast pushed characters return home, per second |
| `FIELD.WARP_BLUR` / `WARP_LIMIT` | 20 / 0.4 | Smoothness of the slide (px) and the most a glyph may stretch |
| `FIELD.GUST_SLIDE` / `GUST_EVERY` | 14 / 2.4 | Ambient swells: how far (px) and how often (s) |
| `FIELD.SWAY_X` / `SWAY_Y` | 0.01 / 0.008 | Ambient sway of the gradient, as a fraction of the viewport |
| `FIELD.DRIFT_AMOUNT` / `DRIFT_FLOW` | 0.16 / 0.22 | Character waves: how far they swing density, and how fast they travel |
| `FIELD.RIBS_ACROSS` | 67 | Fluted-glass ribs across the viewport |

The defaults behind the panel's controls are `DEFAULT_FIELD_SETTINGS` in the same file.

## Deploying

`npm run build` writes a static site to `dist/`. Because the routes are client-side, a refresh or a shared link to `/grants` asks the server for a file that doesn't exist, so the host must serve `index.html` for unknown paths with a 200:

- **Vite dev and `vite preview`**: already do this (Vite's default `appType: 'spa'`).
- **Netlify**: a `public/_redirects` file with `/*  /index.html  200`.
- **Vercel**: `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- **Cloudflare Pages / Workers static assets**: SPA fallback is the default when there's no `404.html` (Workers: `not_found_handling = "single-page-application"`).
- **GitHub Pages**: no rewrites; copy `index.html` to `404.html` after the build (pages then return a 404 status but render).

## Notes

- Inter and JetBrains Mono load from Google Fonts (see `index.html`). The engine waits briefly for JetBrains Mono so its glyph grid starts with the right metrics.
- The seal (`public/proto-seal.svg`) is a filled flat mark, used as-is for the top bar and the favicon.
- Credits: the trail is modeled on the [Fluid ASCII technical note](https://vector-terminal-fluid-demo.pages.dev/), a Codex-style stable-fluids fog. The solver follows Jos Stam, *Stable Fluids* (SIGGRAPH 1999).
