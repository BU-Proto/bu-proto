import type { GradientMap } from './shapes'

/** A shape's colors as RGBA bytes (width × height, row-major), for uploading as a texture. */
export function gradientPixels(map: GradientMap): { width: number; height: number; data: Uint8Array } {
  const { width, height, data: rgb } = map
  const data = new Uint8Array(width * height * 4)
  for (let k = 0; k < width * height; k++) {
    data[k * 4] = rgb[k * 3]
    data[k * 4 + 1] = rgb[k * 3 + 1]
    data[k * 4 + 2] = rgb[k * 3 + 2]
    data[k * 4 + 3] = 255
  }
  return { width, height, data }
}

/** Bilinearly sample a shape at normalized (u, v), writing RGB (0–255) into `out`. */
export function sampleGradient(map: GradientMap, u: number, v: number, out: Float32Array): void {
  const { width: MW, height: MH, data: MAP } = map
  u = u < 0 ? 0 : u > 1 ? 1 : u
  v = v < 0 ? 0 : v > 1 ? 1 : v
  const x = u * (MW - 1)
  const y = v * (MH - 1)
  const i0 = x | 0
  const j0 = y | 0
  const i1 = i0 + 1 < MW ? i0 + 1 : i0
  const j1 = j0 + 1 < MH ? j0 + 1 : j0
  const fx = x - i0
  const fy = y - j0
  const a = (j0 * MW + i0) * 3
  const b = (j0 * MW + i1) * 3
  const c = (j1 * MW + i0) * 3
  const d = (j1 * MW + i1) * 3
  const w00 = (1 - fx) * (1 - fy)
  const w10 = fx * (1 - fy)
  const w01 = (1 - fx) * fy
  const w11 = fx * fy
  out[0] = MAP[a] * w00 + MAP[b] * w10 + MAP[c] * w01 + MAP[d] * w11
  out[1] = MAP[a + 1] * w00 + MAP[b + 1] * w10 + MAP[c + 1] * w01 + MAP[d + 1] * w11
  out[2] = MAP[a + 2] * w00 + MAP[b + 2] * w10 + MAP[c + 2] * w01 + MAP[d + 2] * w11
}
