// A screen edge lit from behind: a tight, saturated line of light around a rounded frame that throws
// a long faint tint into the dark and slowly travels around the frame. It tops out at the film's own
// colour, the same film as the cursor's wake. It's dithered, since nearly all of it is dark.

import { FILM, program } from './wakeField'

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform vec2 uRes, uPointer;
uniform float uT, uDpr, uPower, uNear;
${FILM}
float h(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }

void main() {
  vec2 px = vUv * uRes;
  vec2 half_ = uRes * .5, c = px - half_;
  float radius = 52. * uDpr;
  vec2 q = abs(c) - half_ + radius;
  float d = (min(max(q.x, q.y), 0.) + length(max(q, 0.)) - radius) / -uDpr;

  float turn = atan(c.y * uRes.x / uRes.y, c.x) / 6.28318;
  vec3 hue = film(turn + uT * .035);
  /* the opposite side runs a little behind, so the two ends of the frame never match */
  hue = mix(hue, film(turn * 2. - uT * .02 + .3), .3);

  float near = uNear * exp(-dot((px - uPointer) / uDpr, (px - uPointer) / uDpr) / 90000.);
  float edge = max(d, 0.);
  float line = exp(-edge / 9.) * 1.1 + exp(-edge / 30.) * .21;
  float wash = exp(-edge / 240.) * .056 + exp(-edge / 90.) * .032;
  /* However bright it gets, the light tops out at the film's own colour instead of clipping to white. */
  vec3 col = hue * (1. - exp(-(line * (1. + near * .9) + wash + near * .06) * 1.6));
  col *= uPower;
  col += (h(px * .37 + fract(uT)) + h(px * .71 + fract(uT * 1.3)) - 1.) * 2. / 255.;
  o = vec4(clamp(col, 0., 1.), 1.);
}`

const POINTER_EASE = 0.08

export interface EdgeLight {
  resize(width: number, height: number): void
  point(x: number | null, y: number): void
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
  const at = Object.fromEntries(['uRes', 'uPointer', 'uT', 'uDpr', 'uPower', 'uNear'].map((name) => [name, gl.getUniformLocation(made, name)]))
  gl.bindVertexArray(gl.createVertexArray())
  gl.useProgram(made)
  const state = { dpr: 1, startedAt: 0, x: 0, y: 0, goalX: 0, goalY: 0, near: 0, goalNear: 0 }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  return {
    resize(width, height) {
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * state.dpr)
      canvas.height = Math.round(height * state.dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    },
    point(x, y) {
      state.goalNear = x === null ? 0 : 1
      if (x === null) return
      state.goalX = x * state.dpr
      state.goalY = canvas.height - y * state.dpr
    },
    frame(now, power) {
      if (!state.startedAt) state.startedAt = now
      state.x += (state.goalX - state.x) * POINTER_EASE
      state.y += (state.goalY - state.y) * POINTER_EASE
      state.near += (state.goalNear - state.near) * POINTER_EASE
      gl.uniform2f(at.uRes, canvas.width, canvas.height)
      gl.uniform2f(at.uPointer, state.x, state.y)
      gl.uniform1f(at.uT, (now - state.startedAt) / 1000 + 4)
      gl.uniform1f(at.uDpr, state.dpr)
      gl.uniform1f(at.uPower, power)
      gl.uniform1f(at.uNear, state.near)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      gl.deleteProgram(made)
    },
  }
}
