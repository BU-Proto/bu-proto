// The hero's rings: ring after ring of Proto's type round a centre, out past the edges of the screen,
// drawn in the old hero's art. The screen is a grid of small square tiles, each a block shade (light,
// medium, dark or full) on true black, lit in the bloom's colours: rose and peach at the core, cooling
// through violet to electric blue at the edges, with bands of white light passing over. Each ring
// turns on its own, alternately, so the rings read as a slow spiral, and they grow as they go out,
// which makes a tunnel. A dotted circle runs between each pair of rings.
//
// The type has no letters. Each word is a run of blocks, one to a letter, each letter always the same
// shade, with a dot between words. Every word on a ring gets the same room, so a ring only ever holds
// whole words. The intro opens half-written, the outer rings mostly there and the inner ones sparse,
// then the missing blocks flicker in. Holding the pointer down spins the rings up and dives into the
// tunnel: each ring carries its words outward and types in the extra word its wider place has room
// for. Let go, and the dive glides on to rest where every ring is whole. Words near the hero's own
// words step out of their way.
//
// Two passes, as the old hero had. The first works out, for each tile, how much of a ring's type
// covers it and in what colour, sampling it four times so curved edges come out as lighter shades
// rather than steps. The second draws every tile as its block shade, at screen resolution.

import { program } from './wakeField'

/** What the rings say, over and over. Only the words' shapes show: their letters are blocks. */
const WORDS = ['BU PROTO', 'HACK', 'BUILD', 'SHIP', 'DEMO', 'REPEAT']
/** Letter cells each word gets round a ring: a short word has more room either side. */
const SLOT = 10

/** Tiles at the old hero's size, in CSS px, so the blocks read as a fine texture. */
const CELL_CSS = 6
const CELL_CSS_PHONE = 5
const PHONE_WIDTH = 600

/** How long the intro takes to fill in the missing blocks, in ms. */
const INTRO_MS = 1900
/** Holding the pointer: how fast the rings spin, against at rest, and how fast it dives, in rings a second. */
const HOLD_SPIN = 9
const HOLD_DIVE = 1.1
/** How quickly the spin and the dive ease toward their goals, a second. */
const EASE = 3.2
/** How briskly a dive comes to rest on a whole ring once let go, a second. */
const SETTLE = 4
const MAX_DPR = 2
/** Most rectangles the rings will keep clear: the hero's words and Proto's mark in the top bar. */
const MAX_CLEAR = 4

/** A letter's shade, the same wherever it turns up, spread so neighbouring letters differ. */
function toneOf(letter: string) {
  return letter === ' ' ? 0 : 0.55 + (0.45 * ((letter.charCodeAt(0) * 37) % 23)) / 22
}

const TYPE = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uCentre;
uniform float uCell, uSpin, uDive, uIntro, uT, uDpr, uWords, uRows, uSeam;
/* Each letter's shade, the words run together, 0 for a space; and where each word starts and its length. */
uniform float uTone[64];
uniform float uWordAt[8];
uniform float uWordLen[8];
uniform vec4 uClear[${MAX_CLEAR}];

const float TAU = 6.28318530718;
/* Ring spacing: rings sit evenly in u = (r / R0)^Q, so they widen as they go out. */
const float R0 = 22.;
const float Q = .6;
const float DU = .36;
/* A letter's height in its ring, and its advance against its height, as type of that size would have. */
const float SIZE = .64;
const float ADVANCE = .68;
const float SLOT = ${SLOT}.;
/* Half a word's height against its ring's thickness, and how much of its letter's room a block fills. */
const float BAND = .23;
const float FILL = .8;
/* The dot between two words, its radius against the ring's thickness. */
const float DOT = .07;

const vec3 HAZE = vec3(.808, .757, .745), PEACH = vec3(.973, .573, .541), ROSE = vec3(.855, .204, .435);
const vec3 VIOLET = vec3(.478, .361, .925), SKY = vec3(.012, .604, .784), DEEP = vec3(.016, .416, .659);

float hash(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float radiusAt(float u) { return R0 * pow(max(u, 0.), 1. / Q); }
float boxDistance(vec2 p, vec4 b) { vec2 c = (b.xy + b.zw) * .5, e = (b.zw - b.xy) * .5; vec2 d = abs(p - c) - e; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }

/* The words a ring holds resting in place k: as many whole ones as its letters have room for. */
float wordsAt(float k) {
  float rIn = radiusAt(max(k, 0.) * DU), rOut = radiusAt((max(k, 0.) + 1.) * DU);
  return max(1., floor(TAU * (rIn + rOut) * .5 / ((rOut - rIn) * SIZE * ADVANCE * SLOT)));
}

/* Which of the words a ring's w-th one is: each ring starts them somewhere of its own. The half
   before flooring keeps whole multiples whole, however the GPU divides. */
int wordOf(float w, float h) {
  float n = w + floor(h * uWords);
  return int(n - uWords * floor((n + .5) / uWords));
}

/* 1 well clear of the hero's words, falling to 0 on them, for a point on a ring's middle. */
float clearOf(float angle, float rc, float thick) {
  vec2 point = uCentre + vec2(cos(angle), sin(angle)) * rc * uDpr;
  /* Big outer rings reach further, so they keep a wider berth. */
  float berth = (12. + thick * .6) * uDpr;
  float clear = 1.;
  for (int b = 0; b < ${MAX_CLEAR}; b++) {
    if (uClear[b].z <= uClear[b].x) continue;
    clear = min(clear, smoothstep(berth * .6, berth * 1.4, boxDistance(point, uClear[b])));
  }
  return clear;
}

/* How much of the rings' type covers a point, in device px with y up, and how far out its ring is. */
vec2 typeAt(vec2 point) {
  vec2 p = (point - uCentre) / uDpr;
  float r = length(p);
  float theta = atan(p.y, p.x);

  /* Which ring, and where across it. Diving slides every ring outward, and new ones open at the centre. */
  float ringPos = pow(r / R0, Q) / DU - uDive;
  float i = floor(ringPos);
  float across = fract(ringPos);
  float at = i + uDive;
  float rIn = radiusAt(at * DU), rOut = radiusAt((at + 1.) * DU);
  float thick = rOut - rIn;
  float rc = (rIn + rOut) * .5;
  float h = hash(vec2(i, 7.31));

  /* Its words, whole at every resting place. Diving, a ring carries its words outward and, at a moment
     of its own, types in at its seam the extra word its next place has room for. */
  float k = floor(at);
  float have = wordsAt(k);
  float grow = (wordsAt(k + 1.) - have) * smoothstep(h * .5, h * .5 + .5, at - k);
  float growing = step(.0001, grow) * step(grow, .9999);
  float total = have + ceil(grow);
  float cells = (have + grow) * SLOT;

  /* Each ring turns its own way at its own pace, from a twist that sets them off as a spiral. */
  float turn = i * .41 + uSpin * (.03 + .035 * h) * (mod(i, 2.) < 1. ? 1. : -1.);
  float s = fract((theta + turn) / TAU) * cells;
  float band = step(abs(across - .5), BAND);

  /* The letter here, a block a little apart from the next. Each word sits in the middle of its room;
     one still typing in shows only the letters it has room for so far. */
  float w = floor(s / SLOT);
  int word = wordOf(w, h);
  float len = uWordLen[word];
  float begins = w * SLOT + (SLOT - len) * .5;
  float x = s - begins;
  float letter = clamp(floor(x), 0., len - 1.);
  float ends = begins + letter + 1.;
  float there = step(0., x) * (1. - step(len, x)) * step(ends, cells + .0001);
  float tone = uTone[int(uWordAt[word] + letter)];
  float block = step(abs(fract(x) - .5), FILL * .5) * step(.01, tone);

  /* The intro: outer rings start mostly written, inner ones sparse, as in the opening frame. */
  float place = w * SLOT + letter;
  float hs = hash(vec2(i * 13.1 + 3., place));
  float opening = mix(.16, .72, smoothstep(1., 13., i));
  float reveal = mix(opening, 1.02, uIntro);
  /* Just-arrived letters flicker through other shades before they settle: in the intro, and as a word types in. */
  float fresh = (reveal - hs) / max(1.02 - opening, .001);
  if ((uIntro < 1. && fresh < .07) || (w >= have && growing > 0. && cells - ends < 1.5)) {
    tone = .3 + .7 * hash(vec2(place, floor(uT * 16.) + i));
  }
  /* Words near the hero's words step out of the way, whole, judged by their ends and their middle. */
  float wordClear = min(clearOf(begins / cells * TAU - turn, rc, thick),
    min(clearOf((begins + len * .5) / cells * TAU - turn, rc, thick), clearOf((begins + len) / cells * TAU - turn, rc, thick)));
  float letters = band * block * there * step(hs, reveal) * tone * wordClear;

  /* The dot between two words, halfway across the gap, so it sits evenly between a long word and a
     short one. The seam's waits while a word types in there; one past the typing waits for its room. */
  float b = floor(s / SLOT + .5);
  bool seam = b < .5 || b > total - .5;
  float before = seam ? total - 1. : b - 1.;
  float after = seam ? 0. : b;
  float dotAt = b * SLOT + (uWordLen[wordOf(before, h)] - uWordLen[wordOf(after, h)]) * .25;
  float dotThere = seam ? 1. - growing : step(dotAt + .25, cells);
  float dotPx = length(vec2((s - dotAt) * TAU * r / cells, (across - .5) * thick));
  float dot_ = step(dotPx, max(thick * DOT, .45 * uCell / uDpr)) * dotThere
    * step(hash(vec2(i * 7.7 + 1., seam ? 0. : b)), reveal) * clearOf(dotAt / cells * TAU - turn, rc, thick) * .9;

  return vec2(max(letters, dot_), at);
}

/* The bloom's colours by how far out a ring is: peach and rose at the core, cooling through violet to
   electric blue, the bands drifting a little round the circle. */
vec3 bloom(float at, float theta) {
  float u = at / 22. + .05 * sin(theta * 2. + uT * .07) + .04 * sin(theta * 3. - uT * .05 + at * .4);
  vec3 c = mix(HAZE, PEACH, smoothstep(0., .1, u));
  c = mix(c, ROSE, smoothstep(.08, .24, u));
  c = mix(c, VIOLET, smoothstep(.26, .44, u));
  /* the blue the old field stood on, catching the lagoon's lighter blue here and there */
  vec3 blue = mix(DEEP, SKY, .5 + .5 * sin(theta * 2. - at * .3 + uT * .05));
  return mix(c, blue, smoothstep(.44, .7, u));
}

float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  vec2 id = floor(gl_FragCoord.xy);
  vec2 typed = vec2(0.);
  for (int k = 0; k < 4; k++) typed += typeAt((id + vec2(float(k & 1), float(k >> 1)) * .5 + .25) * uCell) * .25;

  vec2 centre = (id + .5) * uCell;
  vec2 p = (centre - uCentre) / uDpr;
  float r = length(p);
  float theta = atan(p.y, p.x);
  float ringPos = pow(r / R0, Q) / DU - uDive;
  float at = floor(ringPos) + uDive;
  /* 0 at a ring's edge, .5 across its middle */
  float lane = min(fract(ringPos), 1. - fract(ringPos));

  /* The hero's words and Proto's mark sit on the black: round them the glow's tiles drop away one by
     one, thinning a long way out, so it reads as the light dissolving rather than a panel behind them. */
  float open = 1.;
  /* the edge wanders, so no straight side of a box shows in it */
  float wander = (vn(centre / (110. * uDpr) + 3.7) - .5) * 130. * uDpr;
  for (int b = 0; b < ${MAX_CLEAR}; b++) {
    if (uClear[b].z <= uClear[b].x) continue;
    open = min(open, smoothstep(-24. * uDpr, 170. * uDpr, boxDistance(centre, uClear[b]) + wander));
  }
  open = step(hash(id + .91), open * open * (3. - 2. * open));

  /* The bloom: the old hero's dither, hottest and densest at the core and thinning toward the edges,
     folding slowly like light through water, and darker along the lanes between rings. */
  float folds = vn(p / 160. + vec2(uT * .03, -uT * .02)) * .6 + vn(p / 70. - vec2(uT * .02, 0.)) * .4;
  float glow = (.1 + .3 * exp(-max(at, 0.) / 7.)) * (.7 + .6 * folds) * mix(.5, 1., smoothstep(0., .3, lane));
  /* The light gathers over the seam's band at the canvas's foot into a near-solid wash of tiles, so the
     seam (see glyphSeam) breaks it off along a clear skyline, the way its cream breaks against dark. */
  float pool = smoothstep(uSeam * .95, uSeam * .42, centre.y) * step(.5, uSeam);
  glow = max(glow, pool * (.34 + .16 * folds));
  glow *= open * mix(.55, 1., uIntro);

  /* The dotted circle between rings: a brighter tile every so often along each ring's edge. */
  float halfTile = .5 * uCell / uDpr;
  float edge = lane * (radiusAt((at + 1.) * DU) - radiusAt(at * DU));
  float bead = step(edge, halfTile) * step(abs(fract(theta * r / 18.) - .5) * 18., halfTile) * smoothstep(40., 160., r) * open;

  /* The words burn brightest, the outer rings coming forward and the core far off. */
  float words = typed.x * mix(.62, 1.05, smoothstep(0., 12., typed.y));
  float light = max(max(glow, words), bead * .28);
  /* At the very foot of the canvas the tiles thin out, dropping away one by one, under the seam's black
     (see glyphSeam) or, without it, into the page. */
  light *= step(hash(id + .37), smoothstep(0., .08, id.y / uRows));
  o = vec4(bloom(at, theta), clamp(light, 0., 1.));
}`

const BLOCKS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uTiles;
uniform vec2 uRes;
uniform float uCell, uT;

const vec3 FROST = vec3(.961, .965, .98), MINT = vec3(.616, .941, .659);

float h(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float line(vec2 p, vec2 a, vec2 b, float w, float px) {
  vec2 pa = p - a, ba = b - a;
  float k = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return 1. - smoothstep(w - px, w + px, length(pa - ba * k));
}

/* The block shades, as the old hero drew them: each tile split into 2 by 2 squares, one lit for the
   light shade, the two on a diagonal for the medium, three for the dark and all four for the full
   block. They fill the tile edge to edge, so bright type reads as solid tiles and dim as a dither. */
float block(int s, vec2 q) {
  if (s <= 0 || abs(q.x) > .5 || abs(q.y) > .5) return 0.;
  if (s >= 4) return 1.;
  ivec2 d = ivec2(clamp(floor((q + .5) * 2.), 0., 1.));
  bool ox = (d.x & 1) == 1, oy = (d.y & 1) == 1;
  if (s == 1) return !ox && !oy ? 1. : 0.;
  if (s == 2) return ox == oy ? 1. : 0.;
  return ox && oy ? 0. : 1.;
}

/* Bands of light travelling across the screen. White comes only from here, so white always moves. */
float travelling(vec2 p, float t) {
  float bend = sin(p.y * 2.2 - t * .17) * .34 + sin(p.x * 1.5 + t * .13) * .22;
  float a = .5 + .5 * sin((p.x * .77 - p.y * .64) * 6.5 - t * .62 + bend * 4.);
  float b = .5 + .5 * sin((p.x * .64 + p.y * .77) * 3.1 + t * .37 - bend * 3.);
  return pow(a, 4.) * (.3 + .9 * b);
}

void main() {
  vec2 id = floor(gl_FragCoord.xy / uCell), f = fract(gl_FragCoord.xy / uCell) - .5;
  vec4 tile = texelFetch(uTiles, ivec2(id), 0);
  float light = travelling((id + .5) * uCell / uRes.y, uT);
  float L = tile.a * (1. + light * .25);
  float run = floor((id.y + h(vec2(id.x, 4.)) * 9.) / (2. + floor(h(vec2(id.x, 7.)) * 5.)));
  float n = h(vec2(id.x, run)), n2 = h(id + .5);

  /* the shade for this tile's light: none, light, medium, dark, full, a few tiles a step lighter */
  int s = 0;
  float a = 1.;
  /* bright light lifts the blocks only a little toward white, so they keep the bloom's colour */
  vec3 lift = mix(tile.rgb * 1.3 + .03, FROST, .3 * smoothstep(.5, .95, L) + .25 * light);
  vec3 ink = lift;
  if (L < .03) {
    s = 0;
  } else if (L < .1) {
    s = n2 > .55 ? 1 : 0;
    a = .5;
  } else if (L < .22) {
    s = n2 > .2 ? 1 : 0;
    a = .66;
  } else if (L < .38) {
    s = n > .25 ? 2 : 1;
    a = .84;
  } else if (L < .62) {
    s = n > .22 ? 3 : 2;
    a = .9;
  } else {
    ink = mix(lift, FROST, .15);
    s = n > .3 ? 4 : 3;
    a = .97;
  }
  float g = block(s, f) * a;

  /* now and then a mint cursor, fading in and out */
  if (L > .3 && h(id + 3.1) > .9992) {
    float cursor = smoothstep(.2, .7, sin(uT * .9 + n2 * 50.)) * clamp(line(f, vec2(-.36, -.38), vec2(.36, -.38), .105, 1.05 / uCell), 0., 1.);
    if (cursor > .01) { g = max(g, cursor); ink = mix(ink, MINT, cursor); }
  }

  /* turned down to the old field's brightness, so the type glows rather than glares, then dithered */
  vec3 col = ink * g * .8;
  col += (h(gl_FragCoord.xy * .37 + fract(uT)) + h(gl_FragCoord.xy * .71 + fract(uT * 1.3)) - 1.) * 2. / 255. * step(.004, g);
  o = vec4(clamp(col, 0., 1.), 1.);
}`

export interface RingField {
  /**
   * The canvas's size in CSS px, the hero's height inside it (the canvas runs on below the hero), and
   * the height of the seam's band at the canvas's foot (0 for none).
   */
  resize(width: number, height: number, heroHeight: number, seamHeight: number): void
  /** The hero's words, as CSS px boxes from the canvas's top left, for the type to step out of. */
  clear(boxes: readonly DOMRect[]): void
  hold(down: boolean): void
  frame(now: number, still: boolean): void
  destroy(): void
}

function locate<K extends string>(gl: WebGL2RenderingContext, made: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(made, name)])) as Record<K, WebGLUniformLocation | null>
}

/** Returns null where WebGL2 or the shaders aren't to be had: the hero stands on the plain black. */
export function createRingField(canvas: HTMLCanvasElement, onLost: () => void): RingField | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
  if (!gl) return null
  let type: WebGLProgram
  let blocks: WebGLProgram
  try {
    type = program(gl, TYPE)
    blocks = program(gl, BLOCKS)
  } catch {
    return null
  }
  const T = locate(gl, type, ['uCentre', 'uCell', 'uSpin', 'uDive', 'uIntro', 'uT', 'uDpr', 'uWords', 'uRows', 'uSeam', 'uTone', 'uWordAt', 'uWordLen', 'uClear'])
  const B = locate(gl, blocks, ['uTiles', 'uRes', 'uCell', 'uT'])
  gl.bindVertexArray(gl.createVertexArray())

  // The words never change, so they go up once.
  const letters = WORDS.join('')
  gl.useProgram(type)
  gl.uniform1f(T.uWords, WORDS.length)
  gl.uniform1fv(T.uTone, [...letters].map(toneOf))
  gl.uniform1fv(T.uWordAt, WORDS.map((_, index) => WORDS.slice(0, index).join('').length))
  gl.uniform1fv(T.uWordLen, WORDS.map((word) => word.length))
  gl.useProgram(blocks)
  gl.uniform1i(B.uTiles, 0)

  // One texel a tile: how much type covers it, and its colour.
  const tiles = gl.createTexture()
  const target = gl.createFramebuffer()

  const state = {
    dpr: 1, width: 1, height: 1, hero: 1, seam: 0, cell: CELL_CSS, cols: 1, rows: 1,
    startedAt: 0, lastAt: 0,
    spin: 0, spinSpeed: 1, dive: 0, diveSpeed: 0, held: false,
    /** The whole ring a dive that's been let go is gliding on to, if one is. */
    restAt: null as number | null,
    clear: new Float32Array(MAX_CLEAR * 4),
  }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  return {
    resize(width, height, heroHeight, seamHeight) {
      state.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      state.width = width
      state.height = height
      state.hero = heroHeight
      state.seam = seamHeight
      canvas.width = Math.round(width * state.dpr)
      canvas.height = Math.round(height * state.dpr)
      state.cell = Math.max(1, Math.round((width < PHONE_WIDTH ? CELL_CSS_PHONE : CELL_CSS) * state.dpr))
      state.cols = Math.ceil(canvas.width / state.cell)
      state.rows = Math.ceil(canvas.height / state.cell)
      gl.bindTexture(gl.TEXTURE_2D, tiles)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, state.cols, state.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindFramebuffer(gl.FRAMEBUFFER, target)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tiles, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    },
    clear(boxes) {
      state.clear.fill(0)
      boxes.slice(0, MAX_CLEAR).forEach((box, index) => {
        // In device px with y up, the way the shader sees the canvas.
        state.clear.set(
          [box.left * state.dpr, (state.height - box.bottom) * state.dpr, box.right * state.dpr, (state.height - box.top) * state.dpr],
          index * 4,
        )
      })
    },
    hold(down) {
      state.held = down
      if (down) state.restAt = null
    },
    frame(now, still) {
      if (!state.startedAt) state.startedAt = now
      const seconds = Math.min((now - (state.lastAt || now)) / 1000, 0.05)
      state.lastAt = now
      const ease = 1 - Math.exp(-EASE * seconds)
      state.spinSpeed += ((still ? 0 : state.held ? HOLD_SPIN : 1) - state.spinSpeed) * ease
      state.spin += state.spinSpeed * seconds
      if (still) {
        // Nothing dives under reduced motion.
      } else if (state.held) {
        state.diveSpeed += (HOLD_DIVE - state.diveSpeed) * ease
        state.dive += state.diveSpeed * seconds
      } else if (state.diveSpeed !== 0 || state.restAt !== null) {
        // Let go, the dive glides on to the next whole ring, far enough ahead that it never has to
        // turn back, on a spring that just doesn't overshoot.
        state.restAt ??= Math.ceil(state.dive + state.diveSpeed / SETTLE - 1e-6)
        state.diveSpeed += (SETTLE * SETTLE * (state.restAt - state.dive) - 2 * SETTLE * state.diveSpeed) * seconds
        state.dive += state.diveSpeed * seconds
        if (Math.abs(state.restAt - state.dive) < 2e-3 && Math.abs(state.diveSpeed) < 2e-3) {
          state.dive = state.restAt
          state.diveSpeed = 0
          state.restAt = null
        }
      }
      const intro = still ? 1 : Math.min(1, (now - state.startedAt) / INTRO_MS)
      // Still, the light holds where the old hero's did.
      const time = still ? 7 : (now - state.startedAt) / 1000

      gl.bindFramebuffer(gl.FRAMEBUFFER, target)
      gl.viewport(0, 0, state.cols, state.rows)
      gl.useProgram(type)
      // A touch above the hero's middle, so its words sit out on the wide rings. In device px, y up.
      gl.uniform2f(T.uCentre, canvas.width * 0.5, canvas.height - state.hero * state.dpr * 0.44)
      gl.uniform1f(T.uCell, state.cell)
      gl.uniform1f(T.uSpin, state.spin)
      gl.uniform1f(T.uDive, state.dive)
      gl.uniform1f(T.uIntro, 1 - (1 - intro) ** 3)
      gl.uniform1f(T.uT, time)
      gl.uniform1f(T.uDpr, state.dpr)
      gl.uniform1f(T.uRows, state.rows)
      gl.uniform1f(T.uSeam, state.seam * state.dpr)
      gl.uniform4fv(T.uClear, state.clear)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(blocks)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tiles)
      gl.uniform2f(B.uRes, canvas.width, canvas.height)
      gl.uniform1f(B.uCell, state.cell)
      gl.uniform1f(B.uT, time)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      gl.deleteTexture(tiles)
      gl.deleteFramebuffer(target)
      gl.deleteProgram(type)
      gl.deleteProgram(blocks)
    },
  }
}
