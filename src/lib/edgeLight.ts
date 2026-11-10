// The screen's edge, lit from behind in the field's own colours. Each corner of a square holds one
// colour (sky, iris, rose and the lagoon edge), and the square spins around the middle of the
// screen, so the colours race around the frame and mix along each side. The light is measured from
// a rounded box set in from the edge, so it keeps climbing past the straight sides and the corners
// burn hottest, each in its own colour. All of it adds in linear light, which is why it can go from
// a whisper to clipping without turning grey. A pulse sends a ring out from a point, and the frame
// swells as it passes.
//
// Ported from main, with one change for this site: the canvas is clear, not black. Each pixel's
// alpha is its brightest channel, so the light lies over whatever is behind it (here, the ASCII
// field) and the middle of the screen stays see-through.

const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes, uPulseAt;
uniform float uT, uDpr, uPower, uPulse, uPad;

/* The field's light: sky, iris, rose and lagoon (see --sky, --iris, --rose, --lagoon-rgb). */
const vec3 SKY = vec3(.486, .780, .957), IRIS = vec3(.671, .616, 1.), ROSE = vec3(.957, .635, .753), LAGOON = vec3(.247, .722, .816);
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
  vec3 glow = mix(mix(ROSE, IRIS, q.x), mix(LAGOON, SKY, q.x), q.y);
  glow *= glow * glow * 2.;

  /* A tight line and a wide bloom, each measured from its own box and steepened, so nearly all of the
     light stays at the edge. Past the sides the distance keeps growing, so the corners run hottest. */
  vec2 edge = p + swell;
  float line = clamp((box(edge, res * .5 - uPad * 2.) - uPad) / (uPad * 2.5), 0., 1.);
  float bloom = clamp((box(edge, res * .5 - uPad * 3.) - uPad * 1.5) / (uPad * 5.5), 0., 1.);
  line = line * line * line;
  bloom = bloom * bloom * bloom * bloom * bloom;

  vec3 col = uPower * glow * (line + bloom * .5) * 5.;
  col += wave * (line * .25 + bloom * .25 + glow * .05);
  col = pow(min(col, vec3(1.)), vec3(1. / 2.2));
  /* Dither only where there's light, so the clear middle stays clear. */
  float lit = max(col.r, max(col.g, col.b));
  col += (h(vUv * uRes * .37 + fract(uT)) + h(vUv * uRes * .71 + fract(uT * 1.3)) - 1.) * 2. / 255. * smoothstep(0., .03, lit);
  col = clamp(col, 0., 1.);
  /* Premultiplied: the alpha is the brightest channel, so the light covers the ground only as much as it shines. */
  o = vec4(col, max(col.r, max(col.g, col.b)));
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

function program(gl: WebGL2RenderingContext, fragment: string, vertex: string = VERTEX) {
  const made = gl.createProgram()
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('No shader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed')
    gl.attachShader(made, shader)
  }
  gl.linkProgram(made)
  if (!gl.getProgramParameter(made, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(made) ?? 'Link failed')
  return made
}

export function createEdgeLight(canvas: HTMLCanvasElement, onLost: () => void): EdgeLight | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  let made: WebGLProgram
  try {
    made = program(gl, FRAGMENT)
  } catch {
    return null
  }
  const at = Object.fromEntries(
    ['uRes', 'uPulseAt', 'uT', 'uDpr', 'uPower', 'uPulse', 'uPad'].map((name) => [name, gl.getUniformLocation(made, name)]),
  )
  gl.bindVertexArray(gl.createVertexArray())
  gl.useProgram(made)
  gl.clearColor(0, 0, 0, 0)
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
      gl.clear(gl.COLOR_BUFFER_BIT)
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
