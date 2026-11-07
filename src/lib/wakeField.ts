// The events section's ground: giant words, barely there, and a cursor that stirs a real fluid over
// them. The letters never move. They're a window: inside one the fluid's film shows at full strength
// in hard bands of colour, its edge catches a hairline split of colour, and out on the ground there
// are only the film's thin contour lines. The hero uses the simpler wake buffer in this file.

import { createFluid } from './fluidField'

export const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`

const WAKE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uA, uB, uVel;
uniform float uAspect, uPower;

void main() {
  vec4 was = texture(uPrev, vUv);
  vec2 flow = (was.rg - .5) * 2.;
  vec4 p = texture(uPrev, vUv - flow * was.b * .012);
  /* the wake thins a little faster at the end, so an 8-bit buffer still reaches zero */
  float s = max(p.b * .955 - .003, 0.);

  /* a capsule from last frame's cursor to this one's, narrow at the tail, so a fast stroke is a comet */
  vec2 at = vUv * vec2(uAspect, 1.), a = uA * vec2(uAspect, 1.), b = uB * vec2(uAspect, 1.);
  vec2 pa = at - a, ba = b - a;
  float len = dot(ba, ba);
  float k = len > 0. ? clamp(dot(pa, ba) / len, 0., 1.) : 0.;
  float d = length(pa - ba * k) / mix(.05, .1, k);
  float stamp = exp(-d * d) * uPower;

  vec2 v = mix(p.rg, uVel * .5 + .5, clamp(stamp * 1.4, 0., 1.));
  o = vec4(v, clamp(max(s, stamp), 0., 1.), 1.);
}`

/** Thin-film colour, walked through the site's own hues and not the rainbow. */
export const FILM = `
vec3 film(float t) {
  const vec3 LAGOON = vec3(.247, .722, .816), SKY = vec3(.486, .78, .957), IRIS = vec3(.42, .3, 1.),
    RASP = vec3(.95, .16, .56), PEACH = vec3(.973, .573, .541);
  float x = fract(t) * 5.;
  float f = smoothstep(0., 1., fract(x));
  int i = int(floor(x));
  if (i == 0) return mix(LAGOON, SKY, f);
  if (i == 1) return mix(SKY, IRIS, f);
  if (i == 2) return mix(IRIS, RASP, f);
  if (i == 3) return mix(RASP, PEACH, f);
  return mix(PEACH, LAGOON, f);
}`

const WORDS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uAtlas, uDye, uVel;
uniform vec2 uRes;
uniform float uPitch, uRow, uScroll, uShift, uSkew, uT, uDpr, uCount;
uniform float uWidths[8];

const vec3 SKY = vec3(.486, .78, .957), RASP = vec3(.95, .16, .56), FROST = vec3(.961, .965, .98);

float h(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }

/* How much letter is at this pixel: a stack of words sliding past, each row its own way. */
float letters(vec2 p, float lod) {
  float y = p.y + uScroll;
  float row = floor(y / uPitch);
  float v = (y - row * uPitch - (uPitch - uRow) * .5) / uRow;
  if (v < 0. || v > 1.) return 0.;
  float r = mod(row, uCount);
  int i = int(r);
  float dir = mod(row, 2.) < .5 ? 1. : -1.;
  float x = p.x - uRes.x * (.02 + .06 * r) + uShift * dir + uSkew * (v - .5) * 2.;
  float u = x / (uRow * uWidths[i]);
  if (u < 0. || u > 1.) return 0.;
  return textureLod(uAtlas, vec2(u, 1. - (r + v) / uCount), lod).a;
}

${FILM}

/* Thin film, hard-banded: electric blue, cyan, white, peach, magenta, violet. Stops turn over fast,
   so the colour sits in bands with crisp seams between them. */
vec3 bands(float t) {
  vec3 c[6] = vec3[6](vec3(.04, .12, 1.), vec3(.18, .82, 1.), vec3(.82, .93, 1.), vec3(1., .69, .6), vec3(1., .16, .6), vec3(.42, .2, 1.));
  float x = fract(t) * 6.;
  int i = int(floor(x));
  return mix(c[i], c[(i + 1) % 6], smoothstep(.3, .7, fract(x)));
}

void main() {
  vec2 px = vec2(vUv.x, 1. - vUv.y) * uRes;
  float film = max(texture(uDye, vUv).r, 0.);
  vec2 flow = texture(uVel, vUv).xy * .0025;
  float speed = min(length(flow), 1.);

  /* the letters hold still; only a hairline of colour splits along their edges where the film is */
  float c = letters(px, 0.);
  vec2 split = (speed > .001 ? normalize(flow) : vec2(1., 0.)) * 1.6 * uDpr * smoothstep(.0, .3, film);
  float cA = letters(px + split, 0.), cB = letters(px - split, 0.);
  float soft = letters(px, 3.2);

  /* at rest: the faintest fill and a hairline, slightly warmer on one side of the screen */
  float line = 1. - abs(c * 2. - 1.);
  vec3 col = FROST * c * .03 + mix(SKY, RASP, vUv.x) * line * .1 + FROST * line * .07;

  float t = film * 1.15 + speed * .35 + vUv.x * .22 - vUv.y * .16 + uT * .02;
  vec3 tint = bands(t);
  float body = smoothstep(.015, .16, film);
  col += tint * body * c * .9;
  col += FROST * body * clamp((c - soft) * 2.6, 0., 1.) * .45;
  col += vec3(.1, .85, 1.) * max(cA - c, 0.) * body * 2.2 + vec3(1., .16, .5) * max(cB - c, 0.) * body * 2.2;

  /* out on the ground the film is only its contour lines, thin and dim */
  float seam = abs(fract(t * 3.) - .5);
  float contour = (1. - smoothstep(.0, .022, seam)) * smoothstep(.01, .08, film);
  col += tint * contour * .2 * (1. - c);
  col += tint * film * .035 * (1. - c);

  col += (h(px * .37 + fract(uT)) + h(px * .71 + fract(uT * 1.3)) - 1.) * 2. / 255. * step(.004, length(col));
  col = clamp(col, 0., 1.);
  o = vec4(col, max(col.r, max(col.g, col.b)));
}`

const SIM_HEIGHT = 200
const POINTER_POWER = 0.9
const MAX_DPR = 1.5
/** How long to keep drawing after the last move, while the wake dies. */
const SETTLE_MS = 1800
const FRAME_WAKE = 1 / 60
const SKEW_PER_PX = 0.9
const SHIFT_PER_PX = 0.16
const MAX_SKEW = 90

export function program(gl: WebGL2RenderingContext, fragment: string, vertex: string = VERTEX) {
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

function location<K extends string>(gl: WebGL2RenderingContext, made: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(made, name)])) as Record<K, WebGLUniformLocation | null>
}

/** The words, white on clear, one row each, and each one's width as a share of its height. */
function drawAtlas(words: readonly string[], size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')
  const row = size / words.length
  const fontSize = row * 0.92
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 ${fontSize}px "Host Grotesk", "Inter", sans-serif`
  const inset = row * 0.1
  const widest = Math.max(...words.map((word) => ctx.measureText(word).width)) + inset * 2
  const squeeze = Math.min(1, size / widest)
  const widths = words.map((word, index) => {
    ctx.save()
    ctx.translate(inset, row * index + row * 0.82)
    ctx.scale(squeeze, 1)
    ctx.fillText(word, 0, 0)
    ctx.restore()
    return (size / row) * (1 / squeeze)
  })
  return { canvas, widths }
}

function target(gl: WebGL2RenderingContext, width: number, height: number) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const frame = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.clearColor(0.5, 0.5, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  return { texture, frame }
}

/** A cursor's wake: a small self-advecting buffer of direction and strength, shared by hero and events. */
export function createWakeBuffer(gl: WebGL2RenderingContext) {
  const made = program(gl, WAKE)
  const W = location(gl, made, ['uPrev', 'uA', 'uB', 'uVel', 'uAspect', 'uPower'])
  const sim = { width: SIM_HEIGHT, height: SIM_HEIGHT, a: target(gl, SIM_HEIGHT, SIM_HEIGHT), b: target(gl, SIM_HEIGHT, SIM_HEIGHT) }
  const state = { aspect: 1, carry: 0 }

  const stamp = (a: readonly [number, number], b: readonly [number, number], power: number) => {
    const dx = (b[0] - a[0]) * state.aspect
    const dy = b[1] - a[1]
    const speed = Math.hypot(dx, dy)
    const scale = Math.min(1, speed * 26) / (speed || 1)
    gl.bindFramebuffer(gl.FRAMEBUFFER, sim.b.frame)
    gl.viewport(0, 0, sim.width, sim.height)
    gl.useProgram(made)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, sim.a.texture)
    gl.uniform1i(W.uPrev, 0)
    gl.uniform2f(W.uA, a[0], a[1])
    gl.uniform2f(W.uB, b[0], b[1])
    gl.uniform2f(W.uVel, dx * scale, dy * scale)
    gl.uniform1f(W.uAspect, state.aspect)
    gl.uniform1f(W.uPower, power)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    const swap = sim.a
    sim.a = sim.b
    sim.b = swap
  }

  return {
    get texture() {
      return sim.a.texture
    },
    resize(width: number, height: number) {
      state.aspect = width / height
      sim.width = Math.round(SIM_HEIGHT * state.aspect)
      for (const name of ['a', 'b'] as const) {
        gl.deleteTexture(sim[name].texture)
        gl.deleteFramebuffer(sim[name].frame)
        sim[name] = target(gl, sim.width, sim.height)
      }
    },
    /** Moves it on by `elapsed` seconds in fixed steps, so it fades alike at 60Hz and 120Hz. */
    advance(elapsed: number, from: readonly [number, number], to: readonly [number, number], moved: boolean) {
      state.carry = Math.min(state.carry + elapsed, FRAME_WAKE * 4)
      const steps = Math.max(1, Math.floor(state.carry / FRAME_WAKE))
      state.carry -= steps * FRAME_WAKE
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps
        const t1 = (i + 1) / steps
        stamp(
          [from[0] + (to[0] - from[0]) * t0, from[1] + (to[1] - from[1]) * t0],
          [from[0] + (to[0] - from[0]) * t1, from[1] + (to[1] - from[1]) * t1],
          moved ? POINTER_POWER : 0,
        )
      }
    },
    destroy() {
      gl.deleteProgram(made)
      for (const name of ['a', 'b'] as const) {
        gl.deleteTexture(sim[name].texture)
        gl.deleteFramebuffer(sim[name].frame)
      }
    },
  }
}

export interface WakeField {
  resize(width: number, height: number): void
  /** The pointer in CSS pixels from the canvas's corner, or null when it left. */
  point(x: number | null, y: number): void
  scrolled(y: number): void
  /** True while there's something still moving to draw. */
  frame(now: number): boolean
  destroy(): void
}

/** Returns null where WebGL2 or the shaders aren't to be had: the section stands on the plain ground. */
export function createWakeField(canvas: HTMLCanvasElement, words: readonly string[], onLost: () => void): WakeField | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  let picture: WebGLProgram
  let fluid: ReturnType<typeof createFluid>
  try {
    picture = program(gl, WORDS)
    gl.bindVertexArray(gl.createVertexArray())
    fluid = createFluid(gl)
  } catch {
    return null
  }
  if (!fluid) return null
  const P = location(gl, picture, ['uAtlas', 'uDye', 'uVel', 'uRes', 'uPitch', 'uRow', 'uScroll', 'uShift', 'uSkew', 'uT', 'uDpr', 'uCount', 'uWidths'])

  const atlasSize = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number)
  const atlas = drawAtlas(words, atlasSize)
  const atlasTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, atlasTexture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const box = { width: 1, height: 1, dpr: 1 }
  const state = {
    x: 0.5, y: 0.5, lastX: 0.5, lastY: 0.5,
    inside: false, moved: false,
    awakeUntil: 0,
    scroll: 0, drawnScroll: NaN, skew: 0, startedAt: 0, lastAt: 0,
  }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  return {
    resize(width, height) {
      box.width = width
      box.height = height
      box.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(width * box.dpr)
      canvas.height = Math.round(height * box.dpr)
      fluid.resize(width, height)
      state.drawnScroll = NaN
    },
    point(x, y) {
      if (x === null) {
        state.inside = false
        return
      }
      const nx = x / box.width
      const ny = 1 - y / box.height
      if (!state.inside) {
        state.lastX = nx
        state.lastY = ny
      }
      state.x = nx
      state.y = ny
      state.inside = true
      state.moved = true
      state.awakeUntil = performance.now() + SETTLE_MS
    },
    scrolled(y) {
      if (y !== state.scroll) state.awakeUntil = Math.max(state.awakeUntil, performance.now() + SETTLE_MS)
      state.scroll = y
    },
    frame(now) {
      if (!state.startedAt) state.startedAt = now
      const awake = now < state.awakeUntil
      if (!awake && state.scroll === state.drawnScroll) return false
      const elapsed = state.lastAt ? Math.min(now - state.lastAt, 100) / 1000 : FRAME_WAKE
      state.lastAt = now
      const delta = Number.isNaN(state.drawnScroll) ? 0 : state.scroll - state.drawnScroll
      state.drawnScroll = state.scroll
      const aim = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, delta * SKEW_PER_PX))
      state.skew += (aim - state.skew) * 0.12

      const stepped = fluid.advance(elapsed, [state.lastX, state.lastY], [state.x, state.y], state.moved)
      if (stepped) {
        state.lastX = state.x
        state.lastY = state.y
        state.moved = false
      }

      const px = box.dpr
      const pitch = Math.max(box.height * 0.42, 220) * px
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(picture)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture)
      gl.uniform1i(P.uAtlas, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, fluid.dye)
      gl.uniform1i(P.uDye, 1)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, fluid.velocity)
      gl.uniform1i(P.uVel, 2)
      gl.uniform2f(P.uRes, canvas.width, canvas.height)
      gl.uniform1f(P.uPitch, pitch)
      gl.uniform1f(P.uRow, pitch * 0.96)
      gl.uniform1f(P.uScroll, state.scroll * px)
      gl.uniform1f(P.uShift, state.scroll * SHIFT_PER_PX * px)
      gl.uniform1f(P.uSkew, state.skew * px)
      gl.uniform1f(P.uT, (now - state.startedAt) / 1000)
      gl.uniform1f(P.uDpr, px)
      gl.uniform1f(P.uCount, words.length)
      gl.uniform1fv(P.uWidths, new Float32Array([...atlas.widths, ...Array<number>(8).fill(1)].slice(0, 8)))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.activeTexture(gl.TEXTURE0)
      return true
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      fluid.destroy()
      gl.deleteProgram(picture)
      gl.deleteTexture(atlasTexture)
    },
  }
}
