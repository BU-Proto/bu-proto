// The screen's edge, lit from behind in every colour. Each corner of a square holds one colour, and
// the square spins around the middle of the screen, so the colours race around the frame and mix
// into a full rainbow along each side. The light is measured from a rounded box set in from the edge,
// so it keeps climbing past the straight sides and the corners burn hottest, each in its own colour.
// A faint floor of the same colours lies over the whole screen, so the dark takes on the light around
// it. All of it adds in linear light, which is why it can go from a whisper to clipping without
// turning grey. A pulse sends a ring out from a point, and the frame swells as it passes.

import { program } from './wakeField'

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes, uPulseAt;
uniform float uT, uDpr, uPower, uPulse, uPad;

const vec3 YELLOW = vec3(1., .93, .24), CYAN = vec3(.2, .95, 1.), VIOLET = vec3(.58, .42, 1.), RED = vec3(1., .26, .3);
const float SPIN = 4.;

float h(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float box(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }

void main() {
  vec2 res = uRes / uDpr;
  vec2 p = (vUv - .5) * res;

  /* The ring of the pulse: where it is now, and which way it's heading. */
  vec2 aspect = vec2(res.x / res.y, 1.);
  vec2 away = (vUv - uPulseAt) * aspect;
  float span = length(aspect);
  float front = uPulse * span * 2. - length(away);
  float wave = smoothstep(0., span * .5, front) * (1. - smoothstep(span * .5, span, front)) * uPower;
  vec2 swell = (length(away) > .001 ? normalize(away) : vec2(0.)) * wave * res.x * .01;

  /* The spinning square of colours. It's scaled to fit the screen's diagonal, so it never clips. */
  float a = uT * -SPIN;
  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * ((vUv - .5) * 2. * res / length(res));
  q = clamp(q * .5 + .5, 0., 1.);
  vec3 glow = mix(mix(RED, VIOLET, q.x), mix(YELLOW, CYAN, q.x), q.y);
  glow *= glow * glow * 2.;

  /* A tight line and a wide bloom, each measured from its own box and steepened, so nearly all of the
     light stays at the edge. Past the sides the distance keeps growing, so the corners run hottest. */
  vec2 edge = p + swell;
  float line = clamp((box(edge, res * .5 - uPad * 2.) - uPad) / (uPad * 2.5), 0., 1.);
  float bloom = clamp((box(edge, res * .5 - uPad * 3.) - uPad * 1.5) / (uPad * 5.5), 0., 1.);
  line = line * line * line;
  bloom = bloom * bloom * bloom * bloom * bloom;

  /* .001 is the floor that tints the whole screen. */
  vec3 col = uPower * glow * (.001 + line + bloom * .5) * 5.;
  col += wave * (line * .25 + bloom * .25 + glow * .05);
  col = pow(min(col, vec3(1.)), vec3(1. / 2.2));
  col += (h(vUv * uRes * .37 + fract(uT)) + h(vUv * uRes * .71 + fract(uT * 1.3)) - 1.) * 2. / 255.;
  o = vec4(clamp(col, 0., 1.), 1.);
}`

/** How long a pulse takes to cross the screen. */
const PULSE_MS = 2000
/** How far in the frame's light begins, in CSS px, for a laptop and up. It scales down on phones. */
const PADDING = 50

export interface EdgeLight {
  resize(width: number, height: number): void
  /** Sends a ring of light out from a point, in CSS px from the canvas's top left. */
  pulse(x: number, y: number): void
  /** `power` 0 to 1: how fully the frame is on screen. */
  frame(now: number, power: number): void
  destroy(): void
}

export function createEdgeLight(canvas: HTMLCanvasElement, onLost: () => void): EdgeLight | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false })
  if (!gl) return null
  let made: WebGLProgram
  try {
    made = program(gl, FRAGMENT)
  } catch {
    return null
  }
  const at = Object.fromEntries(['uRes', 'uPulseAt', 'uT', 'uDpr', 'uPower', 'uPulse', 'uPad'].map((name) => [name, gl.getUniformLocation(made, name)]))
  gl.bindVertexArray(gl.createVertexArray())
  gl.useProgram(made)
  const state = { dpr: 1, width: 1, height: 1, startedAt: 0, pulsedAt: 0, x: 0.5, y: 0.5 }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  return {
    resize(width, height) {
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      state.width = width
      state.height = height
      canvas.width = Math.round(width * state.dpr)
      canvas.height = Math.round(height * state.dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    },
    pulse(x, y) {
      state.pulsedAt = performance.now()
      state.x = x / state.width
      state.y = 1 - y / state.height
    },
    frame(now, power) {
      if (!state.startedAt) state.startedAt = now
      gl.uniform2f(at.uRes, canvas.width, canvas.height)
      gl.uniform2f(at.uPulseAt, state.x, state.y)
      gl.uniform1f(at.uT, (now - state.startedAt) / 1000 + 4)
      gl.uniform1f(at.uDpr, state.dpr)
      gl.uniform1f(at.uPower, power)
      gl.uniform1f(at.uPulse, state.pulsedAt ? Math.min(1, (now - state.pulsedAt) / PULSE_MS) : 1)
      gl.uniform1f(at.uPad, Math.min(PADDING, Math.min(state.width, state.height) * 0.06))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      gl.deleteProgram(made)
    },
  }
}
