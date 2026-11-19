/**
 * The journey frame's grow, drawn the way Lusion's home reel is: the frame is a 32 x 32 grid of
 * points, and each point travels from the small card to the full frame on its own clock.
 *
 * Every point has a weight, 1 - (x^1.5 + (1 - y)^1.5) / 2, with x across and y down the frame. The
 * top-right corner weighs 0 and sets off first; the bottom-left weighs 1 and sets off last. A
 * point's own progress is smoothstep(0.3w, 0.7 + 0.3w, ratio), and it takes its place and its size
 * from the card and the frame by that progress. Mid-way each point also drifts right by up to a
 * tenth of its width and turns a few degrees about the frame's middle, which is what makes the
 * edges run like liquid. The picture is mapped onto the grid, so it stretches with it; it starts
 * printed in one blue (each colour lifted to at least #1a2ffb) and comes up to full colour by
 * the same per-point progress. The corners are rounded at the frame's own radius throughout.
 */

export type Box = { x: number; y: number; w: number; h: number }

const VERTEX = `#version 300 es
in vec2 aPoint;            // 0..1 across, 0..1 down
uniform vec2 uView;        // the canvas size in CSS pixels
uniform vec4 uFrom;        // the card: x, y, width, height, on screen
uniform vec4 uTo;          // the frame
uniform float uRatio;
out vec2 vUv;
out vec2 vSize;
out float vShow;

void main() {
  float weight = 1. - (pow(aPoint.x * aPoint.x, .75) + pow(1. - aPoint.y, 1.5)) / 2.;
  float show = smoothstep(weight * .3, .7 + weight * .3, uRatio);
  vec2 at = mix(uFrom.xy, uTo.xy, show);
  vec2 size = mix(uFrom.zw, uTo.zw, show);
  at.x += mix(size.x, 0., cos(show * 6.2831853) * .5 + .5) * .1;
  vec2 pivot = uTo.zw * .5;
  vec2 local = aPoint * size - pivot;
  float turn = (smoothstep(0., 1., show) - show) * -1.;
  float c = cos(turn);
  float s = sin(turn);
  local = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
  vec2 screen = local + pivot + at;
  gl_Position = vec4(screen / uView * vec2(2., -2.) + vec2(-1., 1.), 0., 1.);
  vUv = aPoint;
  vSize = size;
  vShow = show;
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vSize;
in float vShow;
uniform sampler2D uPicture;
uniform float uRadius;
uniform vec3 uPrint;
out vec4 colour;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r;
}

void main() {
  float d = roundedBox((vUv - .5) * vSize, vSize * .5, uRadius);
  float alpha = smoothstep(0., -fwidth(d), d);
  vec4 picture = texture(uPicture, vUv);
  vec3 rgb = picture.a > 0. ? picture.rgb / picture.a : vec3(0.);
  vec3 printed = max(uPrint, vec3(dot(rgb, vec3(.299, .587, .114))));
  vec3 shown = mix(printed, rgb, vShow);
  float a = alpha * picture.a;
  colour = vec4(shown * a, a);
}`

const GRID = 32
/** The one blue the small card is printed in. */
const PRINT: [number, number, number] = [0x1a / 255, 0x2f / 255, 0xfb / 255]

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader))
    return null
  }
  return shader
}

export type ReelMorph = {
  /** Draws the frame between the card (`from`) and its full place (`to`) at `ratio`. */
  draw: (from: Box, to: Box, ratio: number, picture: HTMLCanvasElement, radius: number) => void
  clear: () => void
  release: () => void
}

/** Null when WebGL2 is missing; the caller then keeps the plain frame. */
export function createReelMorph(canvas: HTMLCanvasElement): ReelMorph | null {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: true, alpha: true })
  if (!gl) return null
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const points = new Float32Array((GRID + 1) * (GRID + 1) * 2)
  for (let y = 0, i = 0; y <= GRID; y++) {
    for (let x = 0; x <= GRID; x++) {
      points[i++] = x / GRID
      points[i++] = y / GRID
    }
  }
  const order = new Uint16Array(GRID * GRID * 6)
  for (let y = 0, i = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const a = y * (GRID + 1) + x
      order.set([a, a + GRID + 1, a + 1, a + 1, a + GRID + 1, a + GRID + 2], i)
      i += 6
    }
  }
  gl.bindVertexArray(gl.createVertexArray())
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW)
  const aPoint = gl.getAttribLocation(program, 'aPoint')
  gl.enableVertexAttribArray(aPoint)
  gl.vertexAttribPointer(aPoint, 2, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, order, gl.STATIC_DRAW)

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)

  const u = (name: string) => gl.getUniformLocation(program, name)
  const uView = u('uView')
  const uFrom = u('uFrom')
  const uTo = u('uTo')
  const uRatio = u('uRatio')
  const uRadius = u('uRadius')
  gl.uniform3fv(u('uPrint'), PRINT)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
  }

  return {
    draw: (from, to, ratio, picture, radius) => {
      fit()
      gl.uniform2f(uView, canvas.clientWidth, canvas.clientHeight)
      gl.uniform4f(uFrom, from.x, from.y, from.w, from.h)
      gl.uniform4f(uTo, to.x, to.y, to.w, to.h)
      gl.uniform1f(uRatio, ratio)
      gl.uniform1f(uRadius, radius)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawElements(gl.TRIANGLES, order.length, gl.UNSIGNED_SHORT, 0)
    },
    clear: () => {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },
    release: () => {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

/**
 * Paints the frame as it looks at full size into `target`, for the grid to carry: its ground and
 * low light, its rim, the live art, and the steps' words where the page sets them. The ground and
 * the words are painted once into `still` (call `paintStill` again on resize or when fonts land);
 * each frame only lays the art over a copy of them.
 */
export function paintStill(frame: HTMLElement, still: HTMLCanvasElement, art: HTMLCanvasElement | null) {
  const box = frame.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  still.width = Math.max(1, Math.round(box.width * dpr))
  still.height = Math.max(1, Math.round(box.height * dpr))
  const ctx = still.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const css = getComputedStyle(document.documentElement)
  const rgb = (name: string, fallback: string) => (css.getPropertyValue(name).trim() || fallback).split(/[\s,]+/).join(', ')
  const style = getComputedStyle(frame)
  const radius = parseFloat(style.borderTopLeftRadius) || 0
  const { width: w, height: h } = box

  // Ground: navy, lit low from both ends (the frame's own background, in canvas terms).
  ctx.fillStyle = css.getPropertyValue('--navy').trim() || '#131313'
  ctx.fillRect(0, 0, w, h)
  const glow = (x: number, colour: string) => {
    ctx.save()
    ctx.translate(x, h)
    ctx.scale(0.52 * w, 0.78 * h)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    g.addColorStop(0, `rgba(${colour}, 0.3)`)
    g.addColorStop(0.72, `rgba(${colour}, 0)`)
    ctx.fillStyle = g
    ctx.fillRect(-2, -2, 4, 4)
    ctx.restore()
  }
  glow(0, rgb('--sky-deep-rgb', '26 143 192'))
  glow(w, rgb('--rose-deep-rgb', '194 64 122'))

  // The steps' words, each word where the page has set it.
  const steps = frame.querySelector('ol')
  if (steps) {
    const walker = document.createTreeWalker(steps, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement
      if (!parent || !node.textContent) continue
      const look = getComputedStyle(parent)
      ctx.font = `${look.fontStyle} ${look.fontWeight} ${look.fontSize} ${look.fontFamily}`
      ctx.fillStyle = look.color
      if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = look.letterSpacing === 'normal' ? '0px' : look.letterSpacing
      ctx.textBaseline = 'alphabetic'
      for (const word of node.textContent.matchAll(/\S+/g)) {
        range.setStart(node, word.index)
        range.setEnd(node, word.index + word[0].length)
        const at = range.getBoundingClientRect()
        const metrics = ctx.measureText(word[0])
        const ascent = metrics.fontBoundingBoxAscent ?? at.height * 0.8
        const descent = metrics.fontBoundingBoxDescent ?? at.height * 0.2
        const baseline = at.top - box.top + (at.height - ascent - descent) / 2 + ascent
        ctx.fillText(word[0], at.left - box.left, baseline)
      }
    }
  }

  // The rim every slab has.
  ctx.strokeStyle = style.borderTopColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(0.5, 0.5, w - 1, h - 1, Math.max(0, radius - 0.5))
  ctx.stroke()

  return { art: art ? art.getBoundingClientRect() : null, box }
}

/** Lays the live art over the still ground into `picture`, both at the still's scale. */
export function paintPicture(picture: HTMLCanvasElement, still: HTMLCanvasElement, art: HTMLCanvasElement | null, frame: DOMRect, artBox: DOMRect | null) {
  if (picture.width !== still.width || picture.height !== still.height) {
    picture.width = still.width
    picture.height = still.height
  }
  const ctx = picture.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, picture.width, picture.height)
  ctx.drawImage(still, 0, 0)
  if (art && artBox && art.width > 0) {
    const k = still.width / frame.width
    ctx.drawImage(art, (artBox.left - frame.left) * k, (artBox.top - frame.top) * k, artBox.width * k, artBox.height * k)
  }
}
