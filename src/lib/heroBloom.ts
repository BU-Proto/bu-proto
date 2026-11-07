// Runs the hero's picture: a soft shading at a low size and rate, then a glyph pass at screen
// resolution. It watches its own frame times and steps down if the machine can't keep up, and ends
// at a still before it ever gets in the way of the page.

import { gradientPixels } from '../ascii-field/gradient'
import type { GradientMap } from '../ascii-field/shapes'
import { GLYPHS, PICTURE, VERTEX } from './heroBloomShaders'
import { createWakeBuffer } from './wakeField'

/** How long the gradient takes to rise out of the dark. */
const INTRO_S = 1.1
/** How long to keep the wake moving after the last pointer move. */
const WAKE_SETTLE_MS = 1000
/** Steps down the ladder when the median frame over a window of frames runs past this. */
const SLOW_FRAME_MS = 24
const WINDOW_FRAMES = 60
const TIERS = [
  { dpr: 1.5, picture: 960, pictureHz: 30 },
  { dpr: 1.25, picture: 720, pictureHz: 15 },
  { dpr: 1, picture: 540, pictureHz: 10 },
] as const
const CELL_CSS = 9
const CELL_CSS_PHONE = 7
const PHONE_WIDTH = 600

function program(gl: WebGL2RenderingContext, fragment: string) {
  const made = gl.createProgram()
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
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

function uniforms<K extends string>(gl: WebGL2RenderingContext, made: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(made, name)])) as Record<K, WebGLUniformLocation | null>
}

export interface HeroBloom {
  /** The canvas's box in CSS pixels, and the height of the hero inside it. */
  resize(width: number, height: number, heroHeight: number): void
  /** Draws one frame. `now` is in ms; `still` holds time and skips the opening. */
  frame(now: number, still: boolean): void
  /** The pointer in CSS pixels from the canvas's corner, or null when it's gone. */
  point(x: number | null, y: number): void
  scrolled(amount: number): void
  destroy(): void
}

/** Returns null where WebGL2 or the shaders aren't to be had: the field behind stays as the hero. */
export function createHeroBloom(canvas: HTMLCanvasElement, gradient: GradientMap, onLost: () => void, onReady: () => void): HeroBloom | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' })
  if (!gl) return null
  let picture: WebGLProgram
  let glyphs: WebGLProgram
  let wake: ReturnType<typeof createWakeBuffer>
  try {
    picture = program(gl, PICTURE)
    glyphs = program(gl, GLYPHS)
    gl.bindVertexArray(gl.createVertexArray())
    wake = createWakeBuffer(gl)
  } catch {
    return null
  }
  const U = uniforms(gl, picture, ['uMap', 'uT', 'uHeroH', 'uIntro', 'uView'])
  const V = uniforms(gl, glyphs, ['uPic', 'uWake', 'uRes', 'uCell', 'uT', 'uHeroPx', 'uIntro', 'uScroll'])
  const texture = gl.createTexture()
  const target = gl.createFramebuffer()

  const map = gradientPixels(gradient)
  const mapTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, mapTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, map.width, map.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, map.data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.activeTexture(gl.TEXTURE0)

  const box = { width: 0, height: 0, hero: 0 }
  const state = {
    tier: 0,
    dpr: 1,
    cell: CELL_CSS,
    pictureAt: -Infinity,
    startedAt: 0,
    lastAt: 0,
    scroll: 0,
    x: 0.5,
    y: 0.5,
    lastX: 0.5,
    lastY: 0.5,
    inside: false,
    moved: false,
    awakeUntil: 0,
    wakeAt: 0,
    warm: false,
  }
  const times: number[] = []

  const fit = () => {
    const tier = TIERS[state.tier]
    state.dpr = Math.min(window.devicePixelRatio || 1, tier.dpr)
    canvas.width = Math.round(box.width * state.dpr)
    canvas.height = Math.round(box.height * state.dpr)
    state.cell = Math.round((box.width < PHONE_WIDTH ? CELL_CSS_PHONE : CELL_CSS) * state.dpr)
    const scale = Math.min(1, tier.picture / Math.max(canvas.width, canvas.height))
    const width = Math.max(1, Math.round(canvas.width * scale))
    const height = Math.max(1, Math.round(canvas.height * scale))
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, target)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    state.pictureAt = -Infinity
    picSize.width = width
    picSize.height = height
  }
  const picSize = { width: 1, height: 1 }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  const pace = (now: number) => {
    if (state.lastAt) times.push(now - state.lastAt)
    state.lastAt = now
    if (times.length < WINDOW_FRAMES) return
    const median = [...times].sort((a, b) => a - b)[times.length >> 1]
    times.length = 0
    if (median > SLOW_FRAME_MS && state.tier < TIERS.length - 1) {
      state.tier++
      fit()
    }
  }

  return {
    resize(width, height, heroHeight) {
      box.width = width
      box.height = height
      box.hero = heroHeight
      fit()
      wake.resize(width, height)
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
      state.awakeUntil = performance.now() + WAKE_SETTLE_MS
    },
    scrolled(amount) {
      state.scroll = amount
    },
    frame(now, still) {
      if (box.width === 0) return
      if (!still && state.warm) pace(now)
      const seconds = state.warm ? (performance.now() - state.startedAt) / 1000 : 0
      const time = still ? 7 : seconds + 7
      const intro = still ? 1 : Math.min(1, seconds / INTRO_S)

      if (now < state.awakeUntil) {
        wake.advance(state.wakeAt ? Math.min(now - state.wakeAt, 100) / 1000 : 1 / 60, [state.lastX, state.lastY], [state.x, state.y], state.moved)
        state.lastX = state.x
        state.lastY = state.y
        state.moved = false
        state.wakeAt = now
      } else state.wakeAt = 0

      const hz = TIERS[state.tier].pictureHz
      if (still || now - state.pictureAt >= 1000 / hz - 2) {
        state.pictureAt = now
        gl.bindFramebuffer(gl.FRAMEBUFFER, target)
        gl.viewport(0, 0, picSize.width, picSize.height)
        gl.useProgram(picture)
        gl.uniform1f(U.uT, time)
        gl.uniform1f(U.uHeroH, box.hero)
        gl.uniform1f(U.uIntro, intro)
        gl.uniform1i(U.uMap, 1)
        gl.uniform2f(U.uView, box.width, box.height)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.generateMipmap(gl.TEXTURE_2D)
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(glyphs)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(V.uPic, 0)
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, wake.texture)
      gl.uniform1i(V.uWake, 2)
      gl.activeTexture(gl.TEXTURE0)
      gl.uniform2f(V.uRes, canvas.width, canvas.height)
      gl.uniform1f(V.uCell, state.cell)
      gl.uniform1f(V.uT, time)
      gl.uniform1f(V.uHeroPx, box.hero * state.dpr)
      gl.uniform1f(V.uIntro, intro)
      gl.uniform1f(V.uScroll, state.scroll)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      // The GPU may still be compiling these shaders, which took seconds on a fresh load. Reading a
      // pixel waits for it, so the opening starts once there's really something on screen.
      if (!state.warm) {
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
        state.warm = true
        state.startedAt = performance.now()
        onReady()
      }
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      wake.destroy()
      gl.deleteTexture(texture)
      gl.deleteTexture(mapTexture)
      gl.deleteFramebuffer(target)
      gl.deleteProgram(picture)
      gl.deleteProgram(glyphs)
    },
  }
}
