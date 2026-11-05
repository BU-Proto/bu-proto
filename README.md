# bu-proto

The site for **BU Proto** (working name), a BU-sponsored home base for students who make things, built with React, TypeScript, React Router and Vite. The concept behind every page is in [`docs/concept.md`](docs/concept.md).

The background is an ASCII field: the gradient from the reference design rendered as monospace characters that drift and shimmer on their own. The cursor's wind slides the characters around and rewrites the ones along its path into a Stable-Fluids trail of `○ > _` glyphs that dissolves within about a second. The gradient's colors never move with the cursor.

## Run it

Requires Node 20.19+ or 22.12+.

```bash
npm install
cp .dev.vars.example .dev.vars   # secrets for local dev; see Admin portal
npm run db:migrate               # create and seed the local D1
npm run dev                      # http://localhost:5173
```

`npm run dev` runs the site and the API together: the Cloudflare Vite plugin runs `worker/` in the Workers runtime with a local D1 (stored in `.wrangler/state`), so it behaves the way production does.

| Script | What it does |
| --- | --- |
| `npm run dev` | Site and API with hot reload, local D1 |
| `npm run build` | Typecheck (`tsc -b`) and production build of the site and the Worker |
| `npm run preview` | Build, then serve the production build locally |
| `npm run typecheck` | Typecheck only |
| `npm run lint` | Oxlint |
| `npm run db:migrate` | Apply `migrations/` to the local D1 |
| `npm run cf-typegen` | Regenerate `worker/worker-configuration.d.ts` after changing `wrangler.jsonc` or `.dev.vars` |
| `npm run deploy` | Build, migrate the production D1, deploy the Worker |

## Pages

| Route | Page |
| --- | --- |
| `/` | Home: hero, the three tracks, the rhythm, next event and hack night, upcoming deadlines, latest wins, join |
| `/hackathons` | Upcoming hackathons as a departures board |
| `/grants` | The microgrant fund: coming soon, the plan, and an interest list (not an application) |
| `/wins` | Win cards: photo, project, placement, team, Devpost |
| `/track-record` | Logo walls: where members have worked, sponsors, partners, other wins |
| `/resources` | The resources hub: the playbook, then Spark! and Innovate@BU (what each does, which to go to for what) |
| `/resources/playbook` | The playbook index; each guide is at `/resources/playbook/<slug>` (old `/resources/<slug>` links redirect) |
| `/events` | Upcoming events with RSVP |
| `/board` | The board |
| `/join` | What you get, the sign-up form and the Discord |

Anything else renders the 404 page. Every route is a client-side route; the Worker serves `index.html` for any path that isn't a file or under `/api` (`not_found_handling` in `wrangler.jsonc`), so deep links work on refresh.

The portal lives at `/admin`; see [Admin portal](#admin-portal).

## Admin portal

`/admin` is where the team edits events, hackathons, wins and the board; looks after members and the fund interest list; reads an event's RSVPs; emails people; and decides who else gets in. It's a separate, lazy-loaded part of the app with its own layout (no ASCII field), so none of it ships to public visitors.

**Who gets in.** Sign-in is Google only (any Google account: Gmail, or BU's Google Workspace). Emails in the `ADMIN_EMAILS` secret (comma-separated) are owners: always allowed, never removable in the portal. Owners and admins add everyone else on the Admins page, by email; the new admin gets an email with the sign-in link (a *Resend email* button sends it again, at most every 10 minutes). They must sign in with a Google account whose verified address is exactly that email. Removing someone ends their sessions right away. Sessions are an HttpOnly cookie holding a random token (only its SHA-256 is stored) and last 14 days. Every state-changing API request must come from the site's own origin.

**Local sign-in.** Under `npm run dev`, on localhost, the Google button skips Google and signs you straight in as the first email in `ADMIN_EMAILS` (or `you@localhost` when that's empty). It's behind `import.meta.env.DEV`, which Vite compiles to `false` for production, so none of it ships.

**Email.** The Email page sends through [Resend](https://resend.com) to all members, one track, an event's RSVPs, or the fund list by status. Subject and body take variables (`{{name}}`, `{{fullName}}`, `{{email}}`, `{{track}}`, and `{{event}}`, `{{eventDate}}`, `{{eventTime}}`, `{{eventPlace}}` for event emails), and the live preview renders exactly what each real recipient will get. Member emails carry a one-click unsubscribe link. Every send is logged with its counts. Without `RESEND_API_KEY` nothing leaves: emails are printed to the dev server console and the campaign is marked *logged*.

### Setting up Google sign-in

In the [Google Cloud Console](https://console.cloud.google.com/):

1. **Project:** create one (e.g. "BU Proto"), or pick an existing one.
2. **OAuth consent screen** (Google Auth Platform → Branding / Audience / Data access):
   - User type **External**.
   - App name **BU Proto**, a user support email, and a developer contact email.
   - Authorized domain `buproto.com`; homepage `https://buproto.com`; privacy policy `https://buproto.com/privacy`; terms of service `https://buproto.com/terms`.
   - Scopes: `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile` (`openid email profile`). These are non-sensitive, so no Google review is needed.
   - While the app is in **Testing**, only the test users you list can sign in. Either add every admin as a test user, or **Publish app** (Audience → In production) so any Google account can reach the sign-in; the admin list still decides who gets in.
3. **Credentials** (Clients → Create client): type **Web application**, with authorized redirect URIs
   - `https://buproto.com/api/auth/callback`
   - `http://localhost:5173/api/auth/callback`
4. **Secrets:** copy the client id and secret, then
   ```sh
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put ADMIN_EMAILS     # e.g. you@gmail.com,cofounder@bu.edu
   ```
   For local dev the same keys go in `.dev.vars`. `npm run dev` never calls Google (see *Local sign-in*); to try the real flow locally, put the client id and secret in `.dev.vars` and run a production build on the port the redirect URI names: `npx vite build && npx vite preview --port 5173`.

The flow is OpenID Connect's authorization code flow with PKCE, `state` and `nonce`. The Worker reads the verified email from Google's ID token once and never stores Google's tokens.

### Setting up Resend

1. In Resend, add the sending domain and the DNS records it shows (SPF and DKIM, usually on a `send.` subdomain), and wait for *Verified*. Add a DMARC record (`_dmarc` TXT, e.g. `v=DMARC1; p=none;`) too; Gmail and Yahoo expect it from bulk senders.
2. `EMAIL_FROM` in `wrangler.jsonc` is `BU Proto <hello@buproto.com>`, so the domain to verify is `buproto.com`. `EMAIL_REPLY_TO` is optional.
3. Create an API key with sending access and `npx wrangler secret put RESEND_API_KEY`. Leave it empty in `.dev.vars`.

Sends go out in batches of 100 inside the request, which is fine for a few thousand recipients; a much bigger list would want a Queue.

## Content

Events, hackathons, wins and the board live in D1 and are edited in the portal at `/admin`. The pages load them from `GET /api/content/<resource>` (published rows only) through route loaders in `src/App.tsx`. Every row has a **Sample content** box: while it's ticked the item renders with a small **sample** tag, so fake hackathons, wins or people can't ship unnoticed. Untick it only once the item is real and checked.

All other copy lives in `src/content/`, one typed file per page plus `site.ts` for the brand, the nav and hack night's time and place. Copy that's made up there carries `placeholder: true` and gets the same tag. `trackRecord.ts` takes real, verified logos only and has no samples on purpose.

The forms post to the Worker: `/join` to `POST /api/join`, the `/grants` interest list to `POST /api/fund-interest`, and RSVPs on `/events` to `POST /api/events/:id/rsvp` (remembered in the browser, so the button stays "going"). The browser validates first; the server's per-field messages show under the matching field. Each form carries a hidden `website` honeypot.

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
  admin/                 the portal at /admin: shell, sign-in, dashboard, editors, people and email pages
  components/
    Layout.tsx           mounts the field once, the top bar, the page and the footer
    TopBar, MenuSheet, Footer, Hero, ScheduleCard, PageIntro, SampleTag, Form, RouteStates, IconButton, icons
    ui.module.css        shared glass panels, buttons, the sample tag and the page intro
  content/               all copy, one typed file per page (see Content)
  lib/content.ts         fetches the D1 content for the route loaders
  lib/dates.ts           formatting and countdowns for the ISO dates in content
  pages/                 one component and CSS module per route
shared/
  api.ts                 the API contract: every endpoint's types, zod input schemas, the content field specs
  constants.ts           plain values (tracks, years, statuses) the public site can import without zod
worker/
  index.ts               the Hono app: same-origin check on /api, admin session check on /api/admin
  routes/                auth, admins, content, public forms, people (members, fund, stats), email
  lib/                   sessions, validation, content mapping, Resend, the email template
migrations/              D1 schema and the sample content seed
wrangler.jsonc           the Worker, its assets, D1, the form rate limiter, vars
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

## Deploys

It's one Cloudflare Worker: Workers Static Assets serve the built site, and only `/api/*` (plus `/privacy` and `/terms`) runs the Worker.

**Deploys are automatic.** Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `npm ci`, lint, build, apply any new files in `migrations/` to the production D1, then `wrangler deploy`. If lint, the build or a migration fails, nothing is deployed. Deploys never overlap; a newer push waits for the running one. Pull requests run [`check.yml`](.github/workflows/check.yml) (lint and build, no deploy).

**One-time setup.**

1. In Cloudflare, go to **Manage account → Account API tokens → Create Token → Custom token**, and give it exactly these permissions:

   | Type | Permission | Access | Why |
   | --- | --- | --- | --- |
   | Account | Workers Scripts | Edit | Upload the Worker and its static assets, bindings, cron trigger, version status |
   | Account | D1 | Edit | Apply migrations to the `bu-proto` database |
   | Zone | Workers Routes | Edit | The `buproto.com` custom domain |

   Under **Account Resources** pick this account only (`0bda3a2560ca48711ef7336cc421abed`); under **Zone Resources** pick **Specific zone → buproto.com**. Nothing else is needed: the rate limit binding, the cron trigger and the assets all come with Workers Scripts.
2. In GitHub, go to **Settings → Secrets and variables → Actions → New repository secret** and add `CLOUDFLARE_API_TOKEN` with the token. Optionally add `CLOUDFLARE_ACCOUNT_ID` (as a secret or a variable); without it the workflow uses the account id above.

**Rerun a deploy:** **Actions → Deploy → Run workflow** (branch `main`), or **Re-run jobs** on a past run.

**Logs:** **Actions → Deploy →** the run. The migration step lists what's already applied and what it applies; the last step prints the deployed version (also in the run summary). Live Worker logs: `npx wrangler tail`, or **Workers & Pages → bu-proto → Logs** in Cloudflare.

**Runtime secrets stay in Cloudflare.** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`, `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` are set once with `npx wrangler secret put <NAME>` (see [Setting up Google sign-in](#setting-up-google-sign-in)); deploys keep them and CI never sees them. `EMAIL_FROM` is in `wrangler.jsonc`.

`0002_seed.sql` loads the sample content, all tagged *sample*; replace or delete it in the portal.

**Manual fallback:** `npx wrangler login`, then `CLOUDFLARE_ACCOUNT_ID=0bda3a2560ca48711ef7336cc421abed npm run deploy`.

## Form protection (Turnstile)

The three public forms (join, fund interest, RSVP) carry Cloudflare Turnstile, the "Verify you are human" check. It runs with `appearance: 'interaction-only'` on a **Managed** widget: most people never see it, and the checkbox only appears when Cloudflare wants a click. The Worker checks every token with Siteverify (`worker/lib/turnstile.ts`) after the rate limit and before anything is written, and also requires the token's action to match the form and its hostname to be `buproto.com`. The honeypot stays as a second line.

| Value | Where it lives | Notes |
| --- | --- | --- |
| Site key `VITE_TURNSTILE_SITE_KEY` | [`.env.production`](.env.production), committed | Public, it ships in the page. `vite build` reads it; `vite dev` doesn't, and uses Cloudflare's always-pass test key `1x00000000000000000000AA` |
| Secret `TURNSTILE_SECRET_KEY` | Worker secret | `CLOUDFLARE_ACCOUNT_ID=0bda3a2560ca48711ef7336cc421abed npx wrangler secret put TURNSTILE_SECRET_KEY` (paste it at the prompt). Locally leave it empty in `.dev.vars`: `vite dev` then uses the always-pass test secret |

**Without the secret the deployed site refuses every form submission** ("Form protection isn't set up yet", 503) rather than letting them through unchecked. The test secret only exists in dev builds. The widget (**Turnstile → BU Proto forms** in Cloudflare) lists `buproto.com` and `localhost` as hostnames. To see a refusal locally, set `TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA` (always fails) in `.dev.vars` and restart `vite dev`.

## Notes

- Inter and JetBrains Mono load from Google Fonts (see `index.html`). The engine waits briefly for JetBrains Mono so its glyph grid starts with the right metrics.
- The seal (`public/proto-seal.svg`) is a filled flat mark, used as-is for the top bar and the favicon.
- Credits: the trail is modeled on the [Fluid ASCII technical note](https://vector-terminal-fluid-demo.pages.dev/), a Codex-style stable-fluids fog. The solver follows Jos Stam, *Stable Fluids* (SIGGRAPH 1999).
