// The events section's ground: giant words, barely there, stacked behind the ledger. Each row of
// words slides sideways as the page scrolls, every other row the other way, and leans with the
// scroll's speed. The letters are a faint frost fill with a hairline at their edges, slightly sky on
// one side of the screen and rose on the other.
//
// Ported from main's wakeField. On main the cursor's wake (a small GPU fluid) is switched off in
// this section, so its film is always empty; here it's left out, and with it every term the film
// would have lit. What remains draws exactly what main draws.

const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`

const WORDS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform float uPitch, uRow, uScroll, uShift, uSkew, uT, uCount;
uniform float uWidths[8];

/* The field's sky and rose (index.css), and frost for the ink. */
const vec3 SKY = vec3(.486, .78, .957), ROSE = vec3(.957, .635, .753), FROST = vec3(.965, .984, 1.);

float h(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }

/* How much letter is at this pixel: a stack of words sliding past, each row its own way. */
float letters(vec2 p) {
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
  return textureLod(uAtlas, vec2(u, 1. - (r + v) / uCount), 0.).a;
}

void main() {
  vec2 px = vec2(vUv.x, 1. - vUv.y) * uRes;
  float c = letters(px);
  /* the faintest fill and a hairline, slightly warmer on one side of the screen */
  float line = 1. - abs(c * 2. - 1.);
  vec3 col = FROST * c * .03 + mix(SKY, ROSE, vUv.x) * line * .1 + FROST * line * .07;
  /* a little dither, so the faint fill doesn't band */
  col += (h(px * .37 + fract(uT)) + h(px * .71 + fract(uT * 1.3)) - 1.) * 2. / 255. * step(.004, length(col));
  col = clamp(col, 0., 1.);
  o = vec4(col, max(col.r, max(col.g, col.b)));
}`

const MAX_DPR = 1.5
/** How long to keep drawing after the page last moved, while the lean settles. */
const SETTLE_MS = 1800
const SKEW_PER_PX = 0.9
const SHIFT_PER_PX = 0.16
const MAX_SKEW = 90

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

/** The words, white on clear, one row each, and each one's width as a share of its height. */
function drawAtlas(words: readonly string[], size: number, font: string) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')
  const row = size / words.length
  const fontSize = row * 0.92
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  ctx.font = font.replace('{size}', `${fontSize}px`)
  const inset = row * 0.1
  const widest = Math.max(...words.map((word) => ctx.measureText(word).width)) + inset * 2
  const squeeze = Math.min(1, size / widest)
  const widths = words.map((word, index) => {
    ctx.save()
    // Sentence case has descenders (the p in Repeat), so the baseline sits a little higher than for capitals.
    ctx.translate(inset, row * index + row * 0.76)
    ctx.scale(squeeze, 1)
    ctx.fillText(word, 0, 0)
    ctx.restore()
    return (size / row) * (1 / squeeze)
  })
  return { canvas, widths }
}

export interface LedgerWords {
  resize(width: number, height: number): void
  /** How far the section's top has gone up past the top of the screen, in CSS pixels. */
  scrolled(y: number): void
  /** Draws if anything moved. True while there's still something settling. */
  frame(now: number): boolean
  destroy(): void
}

/**
 * Returns null where WebGL2 or the shaders aren't to be had: the section stands on the plain ground.
 * `font` is a canvas font with `{size}` where the size goes, e.g. `300 {size} Inter, sans-serif`.
 */
export function createLedgerWords(canvas: HTMLCanvasElement, words: readonly string[], font: string, onLost: () => void): LedgerWords | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  let picture: WebGLProgram
  try {
    picture = program(gl, WORDS)
    gl.bindVertexArray(gl.createVertexArray())
  } catch {
    return null
  }
  const names = ['uAtlas', 'uRes', 'uPitch', 'uRow', 'uScroll', 'uShift', 'uSkew', 'uT', 'uCount', 'uWidths'] as const
  const P = Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(picture, name)])) as Record<
    (typeof names)[number],
    WebGLUniformLocation | null
  >

  const atlasSize = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number)
  const atlas = drawAtlas(words, atlasSize, font)
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
  const widths = new Float32Array([...atlas.widths, ...Array<number>(8).fill(1)].slice(0, 8))

  const box = { width: 1, height: 1, dpr: 1 }
  const state = { scroll: 0, drawnScroll: Number.NaN, skew: 0, awakeUntil: 0, startedAt: 0 }

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
      state.drawnScroll = Number.NaN
    },
    scrolled(y) {
      if (y !== state.scroll) state.awakeUntil = Math.max(state.awakeUntil, performance.now() + SETTLE_MS)
      state.scroll = y
    },
    frame(now) {
      if (!state.startedAt) state.startedAt = now
      const awake = now < state.awakeUntil
      if (!awake && state.scroll === state.drawnScroll) return false
      const delta = Number.isNaN(state.drawnScroll) ? 0 : state.scroll - state.drawnScroll
      state.drawnScroll = state.scroll
      const aim = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, delta * SKEW_PER_PX))
      state.skew += (aim - state.skew) * 0.12

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
      gl.uniform2f(P.uRes, canvas.width, canvas.height)
      gl.uniform1f(P.uPitch, pitch)
      gl.uniform1f(P.uRow, pitch * 0.96)
      gl.uniform1f(P.uScroll, state.scroll * px)
      gl.uniform1f(P.uShift, state.scroll * SHIFT_PER_PX * px)
      gl.uniform1f(P.uSkew, state.skew * px)
      gl.uniform1f(P.uT, (now - state.startedAt) / 1000)
      gl.uniform1f(P.uCount, words.length)
      gl.uniform1fv(P.uWidths, widths)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      return true
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      gl.deleteProgram(picture)
      gl.deleteTexture(atlasTexture)
    },
  }
}
