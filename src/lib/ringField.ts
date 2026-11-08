// The hero's rings: Proto's words set round and round a centre, ring after ring out past the edges of
// the screen. Each ring turns on its own, alternately, so the type reads as a slow spiral. Rings grow
// as they go out, and so does their lettering, which makes a tunnel. A dotted circle runs between
// each pair of rings.
//
// It all happens in one fragment shader. Each pixel finds its ring and its place along it, picks
// that place's letter from a small atlas, and draws it bent round the circle, so there are no
// per-letter draw calls however many rings there are.
//
// Every word on a ring gets the same room, so a word lands in the same place whichever way up it is
// drawn, and a ring only ever holds whole words. The intro opens half-written, the outer rings mostly
// there and the inner ones sparse, then the missing letters flicker in. Holding the pointer down spins
// the rings up and dives into the tunnel: each ring carries its words outward and types in the extra
// word its wider place has room for. Let go, and the dive glides on to rest where every ring is whole.
// Letters near the hero's words step out of their way.

import { program } from './wakeField'

/** What the rings say, over and over, with a dot between each word and the next. */
const WORDS = ['BU PROTO', 'HACK', 'BUILD', 'SHIP', 'DEMO', 'REPEAT']
/** Letter cells each word gets round a ring: a short word has more room either side. */
const SLOT = 10

/** Atlas cells, in px: as wide as one mono advance and as tall as one ring, for a 64px font. */
const CELL_W = 42
const CELL_H = 104
const FONT_PX = 64
const COLS = 8

/** How long the intro takes to fill in the missing letters, in ms. */
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

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uAtlas;
uniform vec2 uRes, uCentre;
uniform float uSpin, uDive, uIntro, uT, uDpr, uCells, uWords;
/* The words' letters run together, as atlas cells, and where each word starts and how long it is. */
uniform float uText[64];
uniform float uWordAt[8];
uniform float uWordLen[8];
uniform vec4 uClear[${MAX_CLEAR}];

const float TAU = 6.28318530718;
/* Ring spacing: rings sit evenly in u = (r / R0)^Q, so they widen as they go out. */
const float R0 = 22.;
const float Q = .6;
const float DU = .36;
/* A letter's height in its ring, and its advance against its height. */
const float SIZE = .64;
const float ADVANCE = .68;
const float SLOT = ${SLOT}.;
const vec2 CELL = vec2(${CELL_W}., ${CELL_H}.);
const float COLS = ${COLS}.;
/* The dot between two words: its radius, against the ring's thickness. */
const float DOT = .04;

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
  /* Big outer letters reach further from their centre, so they keep a wider berth. */
  float berth = (12. + thick * .6) * uDpr;
  float clear = 1.;
  for (int b = 0; b < ${MAX_CLEAR}; b++) {
    if (uClear[b].z <= uClear[b].x) continue;
    clear = min(clear, smoothstep(berth * .6, berth * 1.4, boxDistance(point, uClear[b])));
  }
  return clear;
}

void main() {
  vec2 px = vUv * uRes;
  vec2 p = (px - uCentre) / uDpr;
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
  float room = TAU * rc / cells;

  /* The letter here. Each word sits in the middle of its room; one still typing in shows only the
     letters it has room for so far. */
  float w = floor(s / SLOT);
  int word = wordOf(w, h);
  float len = uWordLen[word];
  float begins = w * SLOT + (SLOT - len) * .5;
  float x = s - begins;
  float letter = clamp(floor(x), 0., len - 1.);
  float ends = begins + letter + 1.;
  float there = step(0., x) * (1. - step(len, x)) * step(ends, cells + .0001);

  /* Every word stays the right way up: tops face out above the centre and in below it, so the upper
     half reads clockwise and the lower half left to right, like type round a seal. */
  bool below = sin((w + .5) * SLOT / cells * TAU - turn) < 0.;
  float character = uText[int(uWordAt[word] + (below ? letter : len - 1. - letter))];

  /* The intro: outer rings start mostly written, inner ones sparse, as in the opening frame. */
  float place = w * SLOT + letter;
  float hs = hash(vec2(i * 13.1 + 3., place));
  float opening = mix(.16, .72, smoothstep(1., 13., i));
  float reveal = mix(opening, 1.02, uIntro);
  float shown = step(hs, reveal);
  /* Just-arrived letters flicker through others before they settle: in the intro, and as a word types in. */
  float fresh = (reveal - hs) / max(1.02 - opening, .001);
  if ((uIntro < 1. && fresh < .07) || (w >= have && growing > 0. && cells - ends < 1.5)) {
    character = floor(hash(vec2(place, floor(uT * 16.) + i)) * uCells);
  }

  /* Letters keep their own shape, whatever room their ring gives them; the spare goes either side. */
  float wide = min(thick * CELL.x / CELL.y, room);
  float along = (fract(x) - .5) * room / wide + .5;
  float onGlyph = step(0., along) * step(along, 1.);
  vec2 local = below ? vec2(along, across) : vec2(1. - along, 1. - across);
  vec2 cellUv = vec2(mod(character, COLS), floor(character / COLS));
  vec2 uv = (cellUv + clamp(local, 0., 1.)) / vec2(COLS, ceil(uCells / COLS));
  float lod = log2(CELL.y / max(thick * uDpr, 1.));
  /* Words near the hero's words step out of the way, whole, judged by their ends and their middle. */
  float wordClear = min(clearOf(begins / cells * TAU - turn, rc, thick),
    min(clearOf((begins + len * .5) / cells * TAU - turn, rc, thick), clearOf((begins + len) / cells * TAU - turn, rc, thick)));
  float ink = textureLod(uAtlas, uv, max(lod, 0.)).a * shown * there * onGlyph * wordClear;

  /* The dot between two words, halfway across the gap, so it sits evenly between a long word and a
     short one. The seam's waits while a word types in there; one past the typing waits for its room. */
  float b = floor(s / SLOT + .5);
  bool seam = b < .5 || b > total - .5;
  float before = seam ? total - 1. : b - 1.;
  float after = seam ? 0. : b;
  float dotAt = b * SLOT + (uWordLen[wordOf(before, h)] - uWordLen[wordOf(after, h)]) * .25;
  float dotThere = seam ? 1. - growing : step(dotAt + .25, cells);
  float dotPx = length(vec2((s - dotAt) * TAU * r / cells, (across - .5) * thick));
  float dotR = thick * DOT;
  float bullet = smoothstep(dotR + .7 / uDpr, dotR - .7 / uDpr, dotPx) * dotThere
    * step(hash(vec2(i * 7.7 + 1., seam ? 0. : b)), reveal) * clearOf(dotAt / cells * TAU - turn, rc, thick);

  /* The dotted circle between rings, thinning toward the centre. */
  float step_ = 9.;
  float dotPhase = (fract((theta + 3.14159265) * r / step_) - .5) * step_;
  float edge = min(across * thick, (1. - across) * thick);
  float dots = smoothstep(1.2, .3, length(vec2(dotPhase, edge))) * .17 * smoothstep(30., 140., r);

  float depth = mix(.32, .94, smoothstep(0., 9., at));
  /* Gone by the hero's foot, so the fold lands on the page's black. */
  float foot = smoothstep(0., .2, vUv.y);
  float light = (max(ink, bullet) * depth + dots) * foot;
  vec3 col = vec3(.957, .957, .965) * light;
  col += (hash(px * .37 + fract(uT)) - .5) * 1.5 / 255. * step(.004, light);
  o = vec4(col, 1.);
}`

export interface RingField {
  resize(width: number, height: number): void
  /** The hero's words, as CSS px boxes from the canvas's top left, for the letters to step out of. */
  clear(boxes: readonly DOMRect[]): void
  hold(down: boolean): void
  frame(now: number, still: boolean): void
  destroy(): void
}

function drawAtlas(characters: readonly string[]): HTMLCanvasElement {
  const rows = Math.ceil(characters.length / COLS)
  const canvas = document.createElement('canvas')
  canvas.width = COLS * CELL_W
  canvas.height = rows * CELL_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `500 ${FONT_PX}px 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace`
  characters.forEach((character, index) => {
    const x = (index % COLS) * CELL_W + CELL_W / 2
    const y = Math.floor(index / COLS) * CELL_H + CELL_H / 2 + FONT_PX * 0.04
    ctx.fillText(character, x, y)
  })
  return canvas
}

/** Returns null where WebGL2 or the shader isn't to be had: the hero stands on the plain black. */
export function createRingField(canvas: HTMLCanvasElement, onLost: () => void): RingField | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
  if (!gl) return null
  let made: WebGLProgram
  try {
    made = program(gl, FRAGMENT)
  } catch {
    return null
  }
  const names = ['uAtlas', 'uRes', 'uCentre', 'uSpin', 'uDive', 'uIntro', 'uT', 'uDpr', 'uCells', 'uWords', 'uText', 'uWordAt', 'uWordLen', 'uClear']
  const at = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(made, name)]))
  gl.bindVertexArray(gl.createVertexArray())
  gl.useProgram(made)

  const letters = WORDS.join('')
  const characters = [...new Set(letters)]
  const atlas = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, atlas)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawAtlas(characters))
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // The words never change, so they go up once.
  gl.uniform1i(at.uAtlas, 0)
  gl.uniform1f(at.uCells, characters.length)
  gl.uniform1f(at.uWords, WORDS.length)
  gl.uniform1fv(at.uText, [...letters].map((character) => characters.indexOf(character)))
  gl.uniform1fv(at.uWordAt, WORDS.map((_, index) => WORDS.slice(0, index).join('').length))
  gl.uniform1fv(at.uWordLen, WORDS.map((word) => word.length))

  const state = {
    dpr: 1, width: 1, height: 1,
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
    resize(width, height) {
      state.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      state.width = width
      state.height = height
      canvas.width = Math.round(width * state.dpr)
      canvas.height = Math.round(height * state.dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
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

      gl.uniform2f(at.uRes, canvas.width, canvas.height)
      // A touch above the middle, so the hero's words sit out on the wide rings.
      gl.uniform2f(at.uCentre, canvas.width * 0.5, canvas.height * 0.56)
      gl.uniform1f(at.uSpin, state.spin)
      gl.uniform1f(at.uDive, state.dive)
      gl.uniform1f(at.uIntro, 1 - (1 - intro) ** 3)
      gl.uniform1f(at.uT, (now - state.startedAt) / 1000)
      gl.uniform1f(at.uDpr, state.dpr)
      gl.uniform4fv(at.uClear, state.clear)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      gl.deleteTexture(atlas)
      gl.deleteProgram(made)
    },
  }
}
