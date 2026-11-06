import { driftPose, swayPhases } from './ambient'
import { gradientPixels } from './gradient'
import type { FieldFrame, FieldGeometry, FieldRenderer, GlyphAtlas } from './renderer'
import { FIELD, TRAIL_COLORS } from './settings'
import { shapeMap, type GradientMap } from './shapes'

/** A number as a GLSL float literal. */
const glsl = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))

// One triangle that covers the viewport; no vertex buffers needed.
const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`

// Per pixel: the gradient (swaying, never pushed by the cursor) as a wash over the dark ground,
// then the glyph of whichever character the wind has carried over this pixel, tinted with the
// gradient here, or the trail's glyph in its place. Each character's glyph comes from the
// gradient's brightness at its home cell, with the fluted-glass rib, a faint shimmer and the
// drifting noise, the same rule the engine applies on the CPU for the Canvas 2D fallback.
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uGradient;
uniform sampler2D uAtlas;
uniform sampler2D uCells;
uniform sampler2D uWarp;
uniform float uWarpOn;
uniform vec2 uView;
uniform vec2 uCellCss;
uniform float uRibK;
uniform float uRibBase;
uniform float uRibAmp;
uniform vec2 uShimmer;
uniform float uDrift;
uniform float uRibShift;
uniform vec4 uDriftFlow;
uniform float uSteps;
uniform float uToGlyph;
uniform vec2 uWarpScale;
uniform vec2 uWarpSize;
uniform vec2 uCanvas;
uniform float uDpr;
uniform vec2 uCell;
uniform ivec2 uGrid;
uniform vec2 uSway;
uniform float uSlotW;
uniform float uPad;
uniform vec2 uAtlasSize;
uniform float uTrailBase;
uniform vec3 uTrailColor;
uniform float uBaseColor;
uniform float uContrast;
uniform vec2 uMapSize;

out vec4 fragColor;

const vec3 BASE = vec3(${FIELD.BASE_RGB.map((c) => glsl(c / 255)).join(', ')});

vec3 gradient(vec2 uv) {
  vec2 st = (clamp(uv, 0.0, 1.0) * (uMapSize - 1.0) + 0.5) / uMapSize;
  return texture(uGradient, st).rgb;
}

float coverage(float slot, vec2 local) {
  return texture(uAtlas, (vec2(slot * uSlotW + uPad, uPad) + local) / uAtlasSize).a;
}

vec2 sway(vec2 css) {
  return vec2(
    ${glsl(FIELD.SWAY_X)} * sin(css.y * ${glsl(FIELD.SWAY_X_FREQ)} + uSway.x),
    ${glsl(FIELD.SWAY_Y)} * sin(css.x * ${glsl(FIELD.SWAY_Y_FREQ)} + uSway.y)
  );
}

// A stable random number in [0, 1) per cell, for the shimmer's phase.
float hash(ivec2 cell) {
  uvec2 q = uvec2(cell);
  uint h = (q.x * 0x27d4eb2du) ^ (q.y * 0x165667b1u + 0x9e3779b9u);
  h ^= h >> 15;
  h *= 0x85ebca6bu;
  h ^= h >> 13;
  h *= 0xc2b2ae35u;
  h ^= h >> 16;
  return float(h) * (1.0 / 4294967296.0);
}

// Smooth value noise on a lattice that repeats every 256 cells.
float valueNoise(vec2 p) {
  vec2 whole = floor(p);
  vec2 f = p - whole;
  f = f * f * (3.0 - 2.0 * f);
  ivec2 c = ivec2(whole);
  float top = mix(hash(c & 255), hash((c + ivec2(1, 0)) & 255), f.x);
  float bottom = mix(hash((c + ivec2(0, 1)) & 255), hash((c + ivec2(1, 1)) & 255), f.x);
  return mix(top, bottom, f.y);
}

float pickGlyph(ivec2 cell, float calm) {
  vec2 home = (vec2(cell) + 0.5) * uCellCss;
  vec3 g = gradient(home / uView + sway(home));
  float bright = 0.7 * dot(g, vec3(0.2126, 0.7152, 0.0722)) + 0.3 * max(g.r, max(g.g, g.b));
  float rib = 0.5 + 0.5 * sin(home.x * uRibK + uRibShift);
  float phase = hash(cell) * 6.2831853;
  float density = bright * (uRibBase + uRibAmp * rib) + uShimmer.x * cos(phase) + uShimmer.y * sin(phase);
  if (uDrift > 0.0 && calm > 0.0) {
    vec2 wave = home * ${glsl(FIELD.DRIFT_SCALE)};
    density += uDrift * calm * (valueNoise(wave + uDriftFlow.xy) + valueNoise(wave * 1.7 + uDriftFlow.zw) - 1.0);
  }
  return clamp(floor((density - ${glsl(FIELD.DENSITY_LO)}) * uToGlyph + 0.5), 0.0, uSteps);
}

void main() {
  // Device px from the top-left corner; pixel centers sit on .5.
  vec2 px = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y);
  vec2 css = px / uDpr;

  vec3 color = gradient(px / uCanvas + sway(css));
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float light = clamp((lum - ${glsl(FIELD.LIGHT_FROM)}) / ${glsl(FIELD.LIGHT_SPAN)}, 0.0, 1.0);
  float lift = min(1.0, (${glsl(FIELD.LIFT)} + ${glsl(FIELD.LIFT_LIGHT)} * light) * uContrast);
  vec3 tint = mix(color, vec3(1.0), lift);
  vec3 rgb = mix(BASE, color, uBaseColor);

  // The character over this pixel lives, at rest, this far upwind.
  vec2 home = px;
  if (uWarpOn > 0.5) {
    home += texture(uWarp, (css * uWarpScale + 0.5) / uWarpSize).rg * uDpr;
  }
  ivec2 cell = ivec2(clamp(floor(home / uCell), vec2(0.0), vec2(uGrid - 1)));
  vec2 local = home - vec2(cell) * uCell;
  if (all(greaterThanEqual(local, vec2(0.0))) && all(lessThan(local, uCell))) {
    // From the CPU: the cell's share of the drift, the veil's opacity, and the trail's glyph
    // and opacity.
    vec4 state = floor(texelFetch(uCells, cell, 0) * 255.0 + 0.5);
    if (state.b > 0.0) {
      rgb = mix(rgb, uTrailColor, coverage(uTrailBase + state.b - 1.0, local) * state.a / 255.0);
    } else {
      float glyph = pickGlyph(cell, state.r / 255.0);
      if (glyph > 0.0) rgb = mix(rgb, tint, coverage(glyph, local) * state.g / 255.0);
    }
  }
  fragColor = vec4(rgb, 1.0);
}
`

const UNIFORMS = [
  'uGradient',
  'uAtlas',
  'uCells',
  'uWarp',
  'uWarpOn',
  'uWarpScale',
  'uWarpSize',
  'uView',
  'uCellCss',
  'uRibK',
  'uRibBase',
  'uRibAmp',
  'uShimmer',
  'uDrift',
  'uRibShift',
  'uDriftFlow',
  'uSteps',
  'uToGlyph',
  'uCanvas',
  'uDpr',
  'uCell',
  'uGrid',
  'uSway',
  'uSlotW',
  'uPad',
  'uAtlasSize',
  'uTrailBase',
  'uTrailColor',
  'uBaseColor',
  'uContrast',
  'uMapSize',
] as const

type UniformName = (typeof UNIFORMS)[number]

interface GLState {
  program: WebGLProgram
  vao: WebGLVertexArrayObject
  gradient: WebGLTexture
  atlas: WebGLTexture
  cells: WebGLTexture
  warp: WebGLTexture
  /** Size the warp texture was allocated at. */
  warpCols: number
  warpRows: number
  uniforms: Record<UniformName, WebGLUniformLocation | null>
}

/** #rrggbb to 0–1 channels. */
function hexToUnit(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Could not create a shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader failed to compile: ${log}`)
  }
  return shader
}

function texture(gl: WebGL2RenderingContext, unit: number, filter: number): WebGLTexture {
  const tex = gl.createTexture()
  if (!tex) throw new Error('Could not create a texture')
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

const UNIT_GRADIENT = 0
const UNIT_ATLAS = 1
const UNIT_CELLS = 2
const UNIT_WARP = 3

/**
 * Draws the field with one fullscreen fragment shader. The CPU uploads a few bytes per
 * character cell and the wind's displacement each frame; the GPU resolves every pixel's color,
 * glyph and trail glyph.
 */
export class WebGLFieldRenderer implements FieldRenderer {
  readonly kind = 'webgl2'
  readonly canWarp = true
  readonly picksGlyphs = true
  private readonly canvas: HTMLCanvasElement
  private readonly gl: WebGL2RenderingContext
  private readonly onRestored: () => void
  private state: GLState | null = null
  private geometry: FieldGeometry | null = null
  private atlas: GlyphAtlas | null = null
  private trailColor = ''
  /** The shape colors in the gradient texture (a moving shape hands back a new map as it moves). */
  private map: GradientMap | null = null
  /** The cells texture was (re)allocated and holds nothing yet. */
  private cellsStale = true

  constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, onRestored: () => void) {
    this.canvas = canvas
    this.gl = gl
    this.onRestored = onRestored
    this.state = this.init()
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)
  }

  setGeometry(geometry: FieldGeometry, atlas: GlyphAtlas): void {
    this.geometry = geometry
    const { canvas, gl, state } = this
    canvas.width = geometry.pixelWidth
    canvas.height = geometry.pixelHeight
    canvas.style.width = `${geometry.width}px`
    canvas.style.height = `${geometry.height}px`
    if (state) {
      gl.viewport(0, 0, geometry.pixelWidth, geometry.pixelHeight)
      gl.activeTexture(gl.TEXTURE0 + UNIT_CELLS)
      gl.bindTexture(gl.TEXTURE_2D, state.cells)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, geometry.cols, geometry.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      this.cellsStale = true
      const u = state.uniforms
      gl.uniform2f(u.uCanvas, geometry.pixelWidth, geometry.pixelHeight)
      gl.uniform1f(u.uDpr, geometry.dpr)
      gl.uniform2f(u.uCell, geometry.cellPxW, geometry.cellPxH)
      gl.uniform2i(u.uGrid, geometry.cols, geometry.rows)
      gl.uniform2f(u.uView, geometry.width, geometry.height)
      gl.uniform2f(u.uCellCss, geometry.cellW, geometry.cellH)
      gl.uniform1f(u.uRibK, (Math.PI * 2) / geometry.ribPeriod)
    }
    this.setAtlas(atlas)
  }

  setAtlas(atlas: GlyphAtlas): void {
    this.atlas = atlas
    const { gl, state } = this
    if (!state) return
    gl.activeTexture(gl.TEXTURE0 + UNIT_ATLAS)
    gl.bindTexture(gl.TEXTURE_2D, state.atlas)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas.canvas)
    const u = state.uniforms
    gl.uniform1f(u.uSlotW, atlas.slotW)
    gl.uniform1f(u.uPad, atlas.pad)
    gl.uniform2f(u.uAtlasSize, atlas.canvas.width, atlas.canvas.height)
    gl.uniform1f(u.uTrailBase, atlas.trailBase)
    // The ramp's glyphs fill the slots before the trail's.
    const steps = atlas.trailBase - 1
    gl.uniform1f(u.uSteps, steps)
    gl.uniform1f(u.uToGlyph, steps / (FIELD.DENSITY_HI - FIELD.DENSITY_LO))
  }

  draw(frame: FieldFrame): void {
    const { gl, state, geometry } = this
    if (!state || !geometry || gl.isContextLost()) return
    const u = state.uniforms
    const { settings } = frame

    if (frame.cellsChanged || this.cellsStale) {
      this.cellsStale = false
      gl.activeTexture(gl.TEXTURE0 + UNIT_CELLS)
      gl.bindTexture(gl.TEXTURE_2D, state.cells)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, geometry.cols, geometry.rows, gl.RGBA, gl.UNSIGNED_BYTE, frame.cells)
    }

    gl.uniform2f(u.uSway, ...swayPhases(frame.time))
    gl.uniform1f(u.uBaseColor, settings.baseColor)
    gl.uniform1f(u.uContrast, settings.glyphContrast)
    gl.uniform1f(u.uRibBase, 1 - settings.ribbing * 0.08)
    gl.uniform1f(u.uRibAmp, settings.ribbing * 0.16)
    const shimmer = frame.time * FIELD.SHIMMER_SPEED
    gl.uniform2f(u.uShimmer, FIELD.SHIMMER * Math.sin(shimmer), FIELD.SHIMMER * Math.cos(shimmer))
    const { amount, ribShift, flow } = driftPose(frame.time, settings.drift)
    gl.uniform1f(u.uDrift, amount)
    gl.uniform1f(u.uRibShift, ribShift)
    gl.uniform4f(u.uDriftFlow, ...flow)
    const { warp } = frame
    gl.uniform1f(u.uWarpOn, warp ? 1 : 0)
    if (warp) {
      gl.activeTexture(gl.TEXTURE0 + UNIT_WARP)
      gl.bindTexture(gl.TEXTURE_2D, state.warp)
      if (warp.cols !== state.warpCols || warp.rows !== state.warpRows) {
        state.warpCols = warp.cols
        state.warpRows = warp.rows
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, warp.cols, warp.rows, 0, gl.RG, gl.FLOAT, warp.data)
        gl.uniform2f(u.uWarpSize, warp.cols, warp.rows)
      } else {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, warp.cols, warp.rows, gl.RG, gl.FLOAT, warp.data)
      }
      gl.uniform2f(u.uWarpScale, warp.scaleX, warp.scaleY)
    }
    const shape = shapeMap(settings.shape, frame.time)
    if (shape !== this.map) {
      this.map = shape
      const map = gradientPixels(shape)
      gl.activeTexture(gl.TEXTURE0 + UNIT_GRADIENT)
      gl.bindTexture(gl.TEXTURE_2D, state.gradient)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, map.width, map.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, map.data)
      gl.uniform2f(u.uMapSize, map.width, map.height)
    }
    if (settings.trailColor !== this.trailColor) {
      this.trailColor = settings.trailColor
      gl.uniform3f(u.uTrailColor, ...hexToUnit(TRAIL_COLORS[settings.trailColor]))
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy(): void {
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    const { gl, state } = this
    this.state = null
    if (!state || gl.isContextLost()) return
    // The context itself stays with the canvas (React may mount a new engine on it).
    gl.deleteTexture(state.gradient)
    gl.deleteTexture(state.atlas)
    gl.deleteTexture(state.cells)
    gl.deleteTexture(state.warp)
    gl.deleteVertexArray(state.vao)
    gl.deleteProgram(state.program)
  }

  private init(): GLState {
    const { gl } = this
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    const program = gl.createProgram()
    if (!program) throw new Error('Could not create a shader program')
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      const log = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`Shader program failed to link: ${log}`)
    }
    gl.useProgram(program)

    const vao = gl.createVertexArray()
    if (!vao) throw new Error('Could not create a vertex array')
    gl.bindVertexArray(vao)
    gl.disable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

    const gradient = texture(gl, UNIT_GRADIENT, gl.LINEAR)
    const atlas = texture(gl, UNIT_ATLAS, gl.LINEAR)
    const cells = texture(gl, UNIT_CELLS, gl.NEAREST)
    const warp = texture(gl, UNIT_WARP, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, 1, 1, 0, gl.RG, gl.FLOAT, new Float32Array(2))

    const uniforms = {} as Record<UniformName, WebGLUniformLocation | null>
    for (const name of UNIFORMS) uniforms[name] = gl.getUniformLocation(program, name)
    gl.uniform1i(uniforms.uGradient, UNIT_GRADIENT)
    gl.uniform1i(uniforms.uAtlas, UNIT_ATLAS)
    gl.uniform1i(uniforms.uCells, UNIT_CELLS)
    gl.uniform1i(uniforms.uWarp, UNIT_WARP)
    gl.uniform2f(uniforms.uWarpSize, 1, 1)
    this.trailColor = ''
    this.map = null
    return { program, vao, gradient, atlas, cells, warp, warpCols: 1, warpRows: 1, uniforms }
  }

  private readonly onContextLost = (event: Event): void => {
    // Ask the browser to restore the context; until then draw() is a no-op.
    event.preventDefault()
    this.state = null
  }

  private readonly onContextRestored = (): void => {
    try {
      this.state = this.init()
    } catch (error) {
      console.warn('[ascii-field] Could not restore the WebGL context.', error)
      return
    }
    if (this.geometry && this.atlas) this.setGeometry(this.geometry, this.atlas)
    this.onRestored()
  }
}
