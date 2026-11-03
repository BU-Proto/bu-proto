# bu-proto

The home hero for **BU Builders**, a BU-sponsored home base for students who make things, built with React, TypeScript and Vite.

The background is a live ASCII field: the gradient from the reference design rendered as monospace characters, flowing under a Stable-Fluids cursor trail of `○ > _` glyphs.

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

## Using the page

- **Move the cursor.** `○ > _` glyphs are born along your path and dissolve within about a second. The gradient smears with the wind, then settles back.
- **Click.** An expanding shockwave ring.
- **Sliders button (top right).** Live controls for glyph size and contrast, base color, wind, trail length, ribbing, trail color and character set. It can also hide the page content to show the field alone, and settle the surface.
- With `prefers-reduced-motion`, the field renders once and the simulation stays off.

## Layout

```
src/
  ascii-field/           background engine (plain TypeScript) and its React wrapper
    AsciiField.tsx       <AsciiField>: owns the canvas and the engine's lifecycle
    engine.ts            rendering, animation loop, pointer, resize and font handling
    fluid.ts             Stable-Fluids solver
    gradient.ts          bilinear sampling of the colormap
    colormap.ts          48×30 gradient sampled from the reference design
    noise.ts             value noise that picks ○ or > inside the trail
    textClearing.ts      keeps the trail off text marked data-fog-clear
    settings.ts          settings type, defaults and every tuning constant
  components/            Hero, TopBar, ScheduleCard, FeatureStrip, TweakPanel, IconButton, icons
  content/hero.ts        all page copy (placeholder) in one place
```

`AsciiField` has no dependency on the rest of the page. Drop it into any layout:

```tsx
<AsciiField settings={DEFAULT_FIELD_SETTINGS} className="field" />
<h1 data-fog-clear>The trail fades out around this text</h1>
<a data-fog-clear="box">…and around this whole button</a>
<div data-fog-ignore>Clicks in here don't trigger the shockwave</div>
```

## How the field works

**Background.** Each cell of a monospace grid samples the gradient, read bilinearly from a 48×30 colormap. Brightness picks the character from the ramp `.:-=+*#%@`. A column wave at the reference's rib spacing (about 67 ribs across) imitates its fluted glass. Each glyph is tinted with its cell's color, lifted toward white so the characters read as texture over a wash of the same gradient on a dark ground.

**Trail.** A Stable Fluids solver runs on a coarse grid in four passes: diffuse, project, advect, project. Moving the pointer injects its velocity as force and deposits density along the path, with a brush that grows with speed. A click spawns four staggered rings that expand outward.

Each trail cell computes `luma = texture × min(density, 1)`, then runs it through contrast, gamma, invert and quantize to get `○`, `>`, `_` or blank. Density decides whether a glyph exists at all, and a slowly scrolling noise texture decides which one. A floor under the texture keeps dense cores filled.

The same wind moves the coordinates the background samples the gradient at, so colors smear behind the cursor and ease back to rest. Background glyphs fade out wherever the trail is dense.

**Readability.** Elements marked `data-fog-clear` (their text lines) or `data-fog-clear="box"` (their whole box) are rasterized onto the trail grid and blurred, and the trail fades out over them. The engine re-measures on resize, scroll, font loads and when the marked elements change size.

## Tuning

Every constant lives in `src/ascii-field/settings.ts`. Start with these:

| Constant | Default | Effect |
| --- | --- | --- |
| `FOG.HOVER_RADIUS` | 13 | Brush radius in px; grows by up to `FOG.DRAG_MAX` with speed |
| `FOG.DEN_DISSIP` | 1.2 | How fast the trail fades; lower lingers longer |
| `FOG.TEX_SHAPE` | 1.8 | Ratio of `○` to `>`; lower gives more `○` |
| `FOG.TEX_FLOOR` | 0.42 | Keeps dense trail cores filled |
| `FOG.VISCOSITY_SCALE` | 200 | Softness of the wind; lower lets the trail blow farther off the path |
| `FOG.SPLASH_RANGE` | 170 | Shockwave reach in px |
| `FIELD.RIBS_ACROSS` | 67 | Fluted-glass ribs across the viewport |
| `FIELD.GRADIENT_RELAX` | 0.9 | How quickly the stirred gradient settles |

The defaults behind the panel's controls are `DEFAULT_FIELD_SETTINGS` in the same file.

## Notes

- Inter and JetBrains Mono load from Google Fonts (see `index.html`). The engine waits briefly for JetBrains Mono so its glyph grid starts with the right metrics.
- The copy in `src/content/hero.ts` is placeholder for the BU Builders concept.
- Credits: the trail is modeled on the [Fluid ASCII technical note](https://vector-terminal-fluid-demo.pages.dev/), a Codex-style stable-fluids fog. The solver follows Jos Stam, *Stable Fluids* (SIGGRAPH 1999).
