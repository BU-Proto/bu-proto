# bu-proto

The home hero for **BU Builders**, a BU-sponsored home base for students who make things, built with React, TypeScript and Vite.

The background is an ASCII field: the gradient from the reference design rendered as monospace characters. Moving the cursor rewrites those characters into a Stable-Fluids trail of `○ > _` glyphs that dissolves within about a second. The gradient itself never moves.

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

- **Move the cursor.** The characters along your path turn into `○ > _`, drift a little with the wind and dissolve back into the field within about a second. The trail uses the background's own grid at whatever glyph size is set.
- **Click.** An expanding shockwave.
- **Sliders button (top right).** Live controls for glyph size and contrast, base color, wind, trail length, ribbing, trail color and character set. It can also hide the page content to show the field alone, and settle the surface.
- With `prefers-reduced-motion`, the field renders once and the simulation stays off.

## Layout

```
src/
  ascii-field/           background engine (plain TypeScript) and its React wrapper
    AsciiField.tsx       <AsciiField>: owns the canvas and the engine's lifecycle
    engine.ts            cached background, trail rendering, animation loop, input and resize handling
    fluid.ts             Stable-Fluids solver that drives the trail
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

**Background.** Each cell of a monospace grid samples the gradient, read bilinearly from a 48×30 colormap. Brightness picks the character from the ramp (default `.,:;'-~=+<>*xo%#@`). A column wave at the reference's rib spacing (about 67 ribs across) imitates its fluted glass. Each glyph is tinted with its cell's color, lifted toward white so the characters read as texture over a wash of the same gradient on a dark ground. None of this changes over time, so it is drawn once into a cached layer.

**Trail.** The trail follows the reference fog's math. A Stable Fluids solver runs in four passes per frame: diffuse, project, advect, project. Each pointer move adds the pointer's velocity as force and deposits density in a disk with a smoothstep falloff, and the brush grows with speed. A click starts four rings that ease outward together. Density drifts with the wind and decays as `exp(−1.2·dt)`.

For each cell the fog covers, `luma = texture × min(density, 1)` runs through contrast, gamma, invert and quantize to give `○`, `>`, `_` or blank. Density decides whether a glyph exists at all, and a slowly scrolling noise texture decides which one. Those glyphs replace the background's characters in the same cells, at the same size. Where the fog is too thin for a glyph, the background character fades out instead, which leaves a blank feather around the trail like the reference's fog on an empty page.

The fluid grid and the brush scale with the glyph size (the reference uses 11px characters), so the trail keeps its proportions at any setting. Each frame repaints only the cells the fog touches, and the simulation sleeps once the fog has dissolved.

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
| `FOG.TEX_FLOOR` | 0.42 | Keeps dense trail cores filled |
| `FOG.FEATHER_LO` / `FEATHER_HI` | 0.18 / 0.42 | Densities over which background characters fade out around the trail |
| `FOG.SPLASH_RANGE` | 170 | Shockwave reach in px at 11px glyphs |
| `FIELD.RIBS_ACROSS` | 67 | Fluted-glass ribs across the viewport |

The defaults behind the panel's controls are `DEFAULT_FIELD_SETTINGS` in the same file.

## Notes

- Inter and JetBrains Mono load from Google Fonts (see `index.html`). The engine waits briefly for JetBrains Mono so its glyph grid starts with the right metrics.
- The copy in `src/content/hero.ts` is placeholder for the BU Builders concept.
- Credits: the trail is modeled on the [Fluid ASCII technical note](https://vector-terminal-fluid-demo.pages.dev/), a Codex-style stable-fluids fog. The solver follows Jos Stam, *Stable Fluids* (SIGGRAPH 1999).
