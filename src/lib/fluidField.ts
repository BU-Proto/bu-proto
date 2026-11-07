// A small real fluid, solved on the GPU each step: velocity carries itself and a thin film of dye
// along, and a pressure solve keeps it incompressible. The cursor pushes it as well as dragging it,
// so a stroke throws a ring of pressure outward and curls up at its ends, the way water does.

import { program } from './wakeField'

const ADVECT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVel, uSrc;
uniform vec2 uTexel;
uniform float uDt, uKeep, uFade;
void main() {
  vec2 from = vUv - uDt * texture(uVel, vUv).xy * uTexel;
  o = max(texture(uSrc, from) * uKeep - uFade, vec4(-1e4));
}`

const SPLAT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uA, uB;
uniform vec3 uAdd;
uniform float uAspect, uRadius, uPush, uCap;
void main() {
  vec2 scale = vec2(uAspect, 1.);
  vec2 at = vUv * scale, a = uA * scale, b = uB * scale, pa = at - a, ba = b - a;
  float len = dot(ba, ba);
  float k = len > 0. ? clamp(dot(pa, ba) / len, 0., 1.) : 1.;
  vec2 off = pa - ba * k;
  float d2 = dot(off, off) / (uRadius * uRadius);
  float g = exp(-d2);
  /* the outward shove: this is what makes the fluid move away from the cursor */
  vec2 out_ = d2 > 1e-5 ? off / sqrt(dot(off, off)) : vec2(0.);
  o = min(texture(uSrc, vUv) + vec4(uAdd * g + vec3(out_ * uPush * g * sqrt(d2), 0.), 0.), vec4(uCap));
}`

const DIVERGENCE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture(uVel, vUv - vec2(uTexel.x, 0.)).x, r = texture(uVel, vUv + vec2(uTexel.x, 0.)).x;
  float b = texture(uVel, vUv - vec2(0., uTexel.y)).y, t = texture(uVel, vUv + vec2(0., uTexel.y)).y;
  o = vec4(.5 * (r - l + t - b), 0., 0., 1.);
}`

const JACOBI = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPressure, uDiv;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.)).x, r = texture(uPressure, vUv + vec2(uTexel.x, 0.)).x;
  float b = texture(uPressure, vUv - vec2(0., uTexel.y)).x, t = texture(uPressure, vUv + vec2(0., uTexel.y)).x;
  o = vec4((l + r + b + t - texture(uDiv, vUv).x) * .25, 0., 0., 1.);
}`

const GRADIENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVel, uPressure;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.)).x, r = texture(uPressure, vUv + vec2(uTexel.x, 0.)).x;
  float b = texture(uPressure, vUv - vec2(0., uTexel.y)).x, t = texture(uPressure, vUv + vec2(0., uTexel.y)).x;
  o = vec4(texture(uVel, vUv).xy - .5 * vec2(r - l, t - b), 0., 1.);
}`

const VELOCITY_HEIGHT = 96
const DYE_HEIGHT = 192
const JACOBI_STEPS = 10
const STEP = 1 / 60
/** Kept per step: the flow lasts about a second, the film a bit less. */
const VELOCITY_KEEP = 0.985
const DYE_KEEP = 0.962
const DYE_FADE = 0.0016
const RADIUS = 0.05
const PUSH = 240
const DRAG = 0.5
const MAX_SPEED = 1100
const DYE_PER_SPEED = 0.0012

interface Pass {
  frame: WebGLFramebuffer
  texture: WebGLTexture
}

function pass(gl: WebGL2RenderingContext, width: number, height: number): Pass {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const frame = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  return { frame, texture }
}

const names = ['uVel', 'uSrc', 'uTexel', 'uDt', 'uKeep', 'uFade', 'uA', 'uB', 'uAdd', 'uAspect', 'uRadius', 'uPush', 'uCap', 'uPressure', 'uDiv'] as const

/** Needs float render targets. Returns null without them. */
export function createFluid(gl: WebGL2RenderingContext) {
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null
  const build = (source: string) => {
    const made = program(gl, source)
    return { made, at: Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(made, name)])) as Record<(typeof names)[number], WebGLUniformLocation | null> }
  }
  const advect = build(ADVECT)
  const splat = build(SPLAT)
  const divergence = build(DIVERGENCE)
  const jacobi = build(JACOBI)
  const gradient = build(GRADIENT)

  const size = { vw: 1, vh: VELOCITY_HEIGHT, dw: 1, dh: DYE_HEIGHT, aspect: 1, carry: 0 }
  const buffers = {
    velocity: [pass(gl, 1, 1), pass(gl, 1, 1)],
    pressure: [pass(gl, 1, 1), pass(gl, 1, 1)],
    dye: [pass(gl, 1, 1), pass(gl, 1, 1)],
    div: pass(gl, 1, 1),
  }

  const bind = (unit: number, texture: WebGLTexture, at: WebGLUniformLocation | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(at, unit)
  }
  const draw = (target: Pass, width: number, height: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.frame)
    gl.viewport(0, 0, width, height)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  const flip = (pair: Pass[]) => {
    pair.reverse()
  }
  const free = (item: Pass) => {
    gl.deleteTexture(item.texture)
    gl.deleteFramebuffer(item.frame)
  }

  const step = (a: readonly [number, number], b: readonly [number, number], moved: boolean) => {
    const { vw, vh, dw, dh } = size
    const texel = [1 / vw, 1 / vh] as const

    gl.useProgram(advect.made)
    gl.uniform2f(advect.at.uTexel, texel[0], texel[1])
    gl.uniform1f(advect.at.uDt, STEP)
    gl.uniform1f(advect.at.uKeep, VELOCITY_KEEP)
    gl.uniform1f(advect.at.uFade, 0)
    bind(0, buffers.velocity[0].texture, advect.at.uVel)
    bind(1, buffers.velocity[0].texture, advect.at.uSrc)
    draw(buffers.velocity[1], vw, vh)
    flip(buffers.velocity)

    gl.uniform1f(advect.at.uKeep, DYE_KEEP)
    gl.uniform1f(advect.at.uFade, DYE_FADE)
    bind(0, buffers.velocity[0].texture, advect.at.uVel)
    bind(1, buffers.dye[0].texture, advect.at.uSrc)
    draw(buffers.dye[1], dw, dh)
    flip(buffers.dye)

    if (moved) {
      const vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ((b[0] - a[0]) * vw) / STEP))
      const vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ((b[1] - a[1]) * vh) / STEP))
      const speed = Math.hypot(vx, vy)
      const strength = Math.min(1, speed / 400)
      gl.useProgram(splat.made)
      gl.uniform2f(splat.at.uA, a[0], a[1])
      gl.uniform2f(splat.at.uB, b[0], b[1])
      gl.uniform1f(splat.at.uAspect, size.aspect)
      gl.uniform1f(splat.at.uRadius, RADIUS)
      gl.uniform1f(splat.at.uPush, PUSH * strength)
      gl.uniform1f(splat.at.uCap, 1e4)
      gl.uniform3f(splat.at.uAdd, vx * DRAG, vy * DRAG, 0)
      bind(0, buffers.velocity[0].texture, splat.at.uSrc)
      draw(buffers.velocity[1], vw, vh)
      flip(buffers.velocity)

      gl.uniform1f(splat.at.uPush, 0)
      gl.uniform1f(splat.at.uCap, 1)
      gl.uniform1f(splat.at.uRadius, RADIUS * 0.8)
      gl.uniform3f(splat.at.uAdd, Math.min(0.3, speed * DYE_PER_SPEED), 0, 0)
      bind(0, buffers.dye[0].texture, splat.at.uSrc)
      draw(buffers.dye[1], dw, dh)
      flip(buffers.dye)
    }

    gl.useProgram(divergence.made)
    gl.uniform2f(divergence.at.uTexel, texel[0], texel[1])
    bind(0, buffers.velocity[0].texture, divergence.at.uVel)
    draw(buffers.div, vw, vh)

    gl.useProgram(jacobi.made)
    gl.uniform2f(jacobi.at.uTexel, texel[0], texel[1])
    bind(1, buffers.div.texture, jacobi.at.uDiv)
    for (let i = 0; i < JACOBI_STEPS; i++) {
      bind(0, buffers.pressure[0].texture, jacobi.at.uPressure)
      draw(buffers.pressure[1], vw, vh)
      flip(buffers.pressure)
    }

    gl.useProgram(gradient.made)
    gl.uniform2f(gradient.at.uTexel, texel[0], texel[1])
    bind(0, buffers.velocity[0].texture, gradient.at.uVel)
    bind(1, buffers.pressure[0].texture, gradient.at.uPressure)
    draw(buffers.velocity[1], vw, vh)
    flip(buffers.velocity)
  }

  return {
    get velocity() {
      return buffers.velocity[0].texture
    },
    get dye() {
      return buffers.dye[0].texture
    },
    resize(width: number, height: number) {
      size.aspect = width / height
      size.vw = Math.round(VELOCITY_HEIGHT * size.aspect)
      size.dw = Math.round(DYE_HEIGHT * size.aspect)
      for (const pair of [buffers.velocity, buffers.pressure]) {
        pair.forEach(free)
        pair.splice(0, 2, pass(gl, size.vw, size.vh), pass(gl, size.vw, size.vh))
      }
      buffers.dye.forEach(free)
      buffers.dye.splice(0, 2, pass(gl, size.dw, size.dh), pass(gl, size.dw, size.dh))
      free(buffers.div)
      buffers.div = pass(gl, size.vw, size.vh)
    },
    /** Moves it on by `elapsed` seconds in fixed steps, so it runs alike at 60Hz and 120Hz. */
    advance(elapsed: number, from: readonly [number, number], to: readonly [number, number], moved: boolean) {
      size.carry = Math.min(size.carry + elapsed, STEP * 3)
      const steps = Math.floor(size.carry / STEP)
      size.carry -= steps * STEP
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps
        const t1 = (i + 1) / steps
        step([from[0] + (to[0] - from[0]) * t0, from[1] + (to[1] - from[1]) * t0], [from[0] + (to[0] - from[0]) * t1, from[1] + (to[1] - from[1]) * t1], moved)
      }
      return steps > 0
    },
    destroy() {
      for (const item of [advect, splat, divergence, jacobi, gradient]) gl.deleteProgram(item.made)
      for (const item of [...buffers.velocity, ...buffers.pressure, ...buffers.dye, buffers.div]) free(item)
    },
  }
}
