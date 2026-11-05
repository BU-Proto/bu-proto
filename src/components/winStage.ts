// The wins' covers, drawn in WebGL on one canvas behind the tiles' words. The tiles stay ordinary
// DOM: each cover's box is measured every frame and its picture drawn there, which lets the whole
// grid bend with the scroll, the frame open out of itself, and the picture blur and warp as the
// cursor arrives. Anything this can't draw keeps its DOM picture and CSS entrance.

import { onFrame } from '../lib/smoothScroll'

const FRAME_START = 0.75
const FRAME_MS = 1500
const SWING_MS = 2000
const SWING_OFFSET = 0.035
const SWING_DEGREES = 2.3
const RADIUS = 16
/** The picture is cut this much larger than its box, so the cursor's follow never shows an edge. */
const BLEED = 12
const REST_SCALE = 1.026
const EASE_MS = 120
const SETTLE_MS = 700
const BLUR_PX = 3
const WARP_PX = 3
/** Scroll speed, in px per second, at which the tiles are fully bent, and the reach when they are. */
const BEND_SPEED = 2700
const BEND_PX = 38
const BEND_EASE_MS = 90
const MAX_DPR = 2
const COLUMNS = 40
const ROWS = 26

const VERTEX = `#version 300 es
in vec2 aUv;
uniform vec4 uBox;
uniform vec2 uView;
uniform vec2 uOffset;
uniform float uTurn;
uniform float uBend;
out vec2 vLocal;

void main() {
  vec2 local = (aUv - 0.5) * uBox.zw;
  vLocal = local;
  float c = cos(uTurn);
  float s = sin(uTurn);
  vec2 p = uBox.xy + uBox.zw * 0.5 + vec2(c * local.x - s * local.y, s * local.x + c * local.y) + uOffset;
  vec2 n = p / uView * 2.0 - 1.0;
  p.x += n.x * n.y * n.y * uBend;
  vec2 clip = p / uView * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform sampler2D uPicture;
uniform vec2 uSize;
uniform vec2 uPictureSize;
uniform vec2 uShift;
uniform float uFrame;
uniform float uScale;
uniform float uBlur;
uniform float uWarp;
uniform float uTime;
uniform float uBleed;
uniform float uRadius;
out vec4 color;

vec4 picture(vec2 local) {
  vec2 box = uSize + uBleed * 2.0;
  float cover = max(box.x / uPictureSize.x, box.y / uPictureSize.y);
  return texture(uPicture, 0.5 + local / (uScale * cover * uPictureSize));
}

void main() {
  vec2 half_ = uSize * 0.5 * uFrame;
  vec2 corner = abs(vLocal) - half_ + uRadius;
  float edge = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - uRadius;
  float alpha = clamp(0.5 - edge, 0.0, 1.0);
  if (alpha <= 0.0) discard;

  vec2 local = vLocal - uShift;
  local += uWarp * vec2(sin(local.y * 0.02 + uTime * 5.0), cos(local.x * 0.017 + uTime * 4.0));
  vec4 sum = picture(local) * 0.2;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7854;
    sum += picture(local + vec2(cos(a), sin(a)) * uBlur) * 0.1;
  }
  color = vec4(sum.rgb * alpha, alpha);
}`

interface Tile {
  media: HTMLElement
  item: Element
  /** 1 in the left column, -1 in the right: the way toward the centre. */
  side: number
  texture: WebGLTexture | null
  width: number
  height: number
  startedAt: number | null
  hoveredAt: number
  hovered: boolean
  scale: number
  x: number
  y: number
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

/** The cover's ASCII art as a picture, sharp at the box's size on this screen. */
async function asciiPicture(art: HTMLElement, box: DOMRect, dpr: number) {
  const lines = (art.textContent ?? '').split('\n')
  const longest = Math.max(...lines.map((line) => line.length), 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil((box.width + BLEED * 2) * dpr)
  canvas.height = Math.ceil((box.height + BLEED * 2) * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const size = canvas.width / longest / 0.6
  const font = `${size}px "JetBrains Mono"`
  await document.fonts.load(font)
  ctx.fillStyle = getComputedStyle(art.parentElement ?? art).backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = getComputedStyle(art).color
  ctx.font = font
  ctx.textBaseline = 'middle'
  const rowHeight = canvas.height / lines.length
  lines.forEach((line, row) => ctx.fillText(line, 0, (row + 0.5) * rowHeight))
  return canvas
}

function photoPicture(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function compile(gl: WebGL2RenderingContext) {
  const program = gl.createProgram()
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, FRAGMENT],
  ] as const) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

function planeGeometry() {
  const points: number[] = []
  const indices: number[] = []
  for (let row = 0; row <= ROWS; row++) {
    for (let column = 0; column <= COLUMNS; column++) points.push(column / COLUMNS, row / ROWS)
  }
  for (let row = 0; row < ROWS; row++) {
    for (let column = 0; column < COLUMNS; column++) {
      const at = row * (COLUMNS + 1) + column
      indices.push(at, at + 1, at + COLUMNS + 1, at + 1, at + COLUMNS + 2, at + COLUMNS + 1)
    }
  }
  return { points: new Float32Array(points), indices: new Uint16Array(indices) }
}

/** Starts drawing the sheet's covers onto `canvas`, and returns the way to stop. */
export function mountWinStage(sheet: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true })
  const program = gl && compile(gl)
  if (!gl || !program) return () => undefined

  gl.useProgram(program)
  const plane = planeGeometry()
  gl.bindVertexArray(gl.createVertexArray())
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, plane.points, gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'aUv')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plane.indices, gl.STATIC_DRAW)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.clearColor(0, 0, 0, 0)
  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const u = {
    box: uniform('uBox'),
    view: uniform('uView'),
    offset: uniform('uOffset'),
    turn: uniform('uTurn'),
    bend: uniform('uBend'),
    size: uniform('uSize'),
    pictureSize: uniform('uPictureSize'),
    shift: uniform('uShift'),
    frame: uniform('uFrame'),
    scale: uniform('uScale'),
    blur: uniform('uBlur'),
    warp: uniform('uWarp'),
    time: uniform('uTime'),
    bleed: uniform('uBleed'),
    radius: uniform('uRadius'),
  }
  gl.uniform1f(u.bleed, BLEED)
  gl.uniform1f(u.radius, RADIUS)

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const state = { stopped: false, visible: false, lastAt: 0, scrollY: window.scrollY, speed: 0 }

  const tiles: Tile[] = [...sheet.querySelectorAll<HTMLElement>('[data-side]')].map((media) => ({
    media,
    item: media.closest('[data-entrance]') ?? media,
    side: media.dataset.side === 'left' ? 1 : -1,
    texture: null,
    width: 1,
    height: 1,
    startedAt: null,
    hoveredAt: -Infinity,
    hovered: false,
    scale: REST_SCALE,
    x: 0,
    y: 0,
  }))

  const load = async (tile: Tile) => {
    const box = tile.media.getBoundingClientRect()
    const photo = tile.media.querySelector('img')
    const art = tile.media.querySelector('pre')
    const picture = photo ? await photoPicture(photo.currentSrc || photo.src) : art && (await asciiPicture(art, box, dpr))
    if (!picture || state.stopped) return
    try {
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      tile.texture = texture
      tile.width = picture.width
      tile.height = picture.height
      tile.media.dataset.gl = ''
    } catch {
      // A photo from a host that won't share its pixels stays a DOM picture.
    }
  }

  void document.fonts.ready.then(() => Promise.all(tiles.map(load)))

  const draw = (now: number) => {
    const elapsed = Math.max(now - state.lastAt, 1)
    state.lastAt = now
    const moved = (Math.abs(window.scrollY - state.scrollY) / elapsed) * 1000
    state.scrollY = window.scrollY
    state.speed += (moved - state.speed) * (1 - Math.exp(-elapsed / BEND_EASE_MS))
    if (!state.visible) return

    const view = { width: window.innerWidth, height: window.innerHeight }
    const pixelWidth = Math.round(view.width * dpr)
    const pixelHeight = Math.round(view.height * dpr)
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
      gl.viewport(0, 0, pixelWidth, pixelHeight)
    }
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform2f(u.view, view.width, view.height)
    gl.uniform1f(u.bend, BEND_PX * Math.min(1, state.speed / BEND_SPEED))
    gl.uniform1f(u.time, now / 1000)
    const follow = 1 - Math.exp(-elapsed / EASE_MS)

    for (const tile of tiles) {
      const entered = tile.item.hasAttribute('data-in')
      if (!entered) tile.startedAt = null
      else tile.startedAt ??= now
      if (!tile.texture || tile.startedAt === null) continue

      const box = tile.media.getBoundingClientRect()
      if (box.bottom < -box.height || box.top > view.height + box.height) continue

      const hovered = tile.media.matches(':hover')
      if (hovered && !tile.hovered) tile.hoveredAt = now
      tile.hovered = hovered
      tile.scale += ((hovered ? 1 : REST_SCALE) - tile.scale) * follow
      const style = tile.media.style
      tile.x += ((hovered ? Number(style.getPropertyValue('--mx')) * 10 : 0) - tile.x) * follow
      tile.y += ((hovered ? Number(style.getPropertyValue('--my')) * 10 : 0) - tile.y) * follow

      const sinceHover = (now - tile.hoveredAt) / SETTLE_MS
      const unsettled = sinceHover >= 1 ? 0 : 1 - easeOutExpo(sinceHover)
      const swing = 1 - easeOutExpo((now - tile.startedAt) / SWING_MS)
      const frame = FRAME_START + (1 - FRAME_START) * easeOutExpo((now - tile.startedAt) / FRAME_MS)

      gl.bindTexture(gl.TEXTURE_2D, tile.texture)
      gl.uniform4f(u.box, box.left, box.top, box.width, box.height)
      gl.uniform2f(u.size, box.width, box.height)
      gl.uniform2f(u.pictureSize, tile.width, tile.height)
      gl.uniform2f(u.offset, tile.side * SWING_OFFSET * view.width * swing, 0)
      gl.uniform1f(u.turn, ((-tile.side * SWING_DEGREES * Math.PI) / 180) * swing)
      gl.uniform2f(u.shift, tile.x, tile.y)
      gl.uniform1f(u.frame, frame)
      gl.uniform1f(u.scale, tile.scale)
      gl.uniform1f(u.blur, BLUR_PX * unsettled)
      gl.uniform1f(u.warp, WARP_PX * unsettled)
      gl.drawElements(gl.TRIANGLES, plane.indices.length, gl.UNSIGNED_SHORT, 0)
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    state.visible = Boolean(entry?.isIntersecting)
    if (!state.visible) gl.clear(gl.COLOR_BUFFER_BIT)
  })
  observer.observe(sheet)

  const release = () => {
    for (const tile of tiles) delete tile.media.dataset.gl
    delete sheet.dataset.gl
  }
  const lost = (event: Event) => {
    event.preventDefault()
    state.stopped = true
    stopFrames()
    release()
  }
  canvas.addEventListener('webglcontextlost', lost)
  sheet.dataset.gl = ''
  const stopFrames = onFrame(draw)

  return () => {
    state.stopped = true
    stopFrames()
    observer.disconnect()
    canvas.removeEventListener('webglcontextlost', lost)
    release()
    for (const tile of tiles) gl.deleteTexture(tile.texture)
  }
}
