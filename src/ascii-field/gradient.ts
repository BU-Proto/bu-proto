import { GRADIENT_COLORMAP } from './colormap'

const { width: MW, height: MH, rows } = GRADIENT_COLORMAP

const MAP = new Float32Array(MW * MH * 3)
rows.forEach((row, j) => {
  for (let i = 0; i < MW; i++) {
    const o = (j * MW + i) * 3
    const s = i * 6
    MAP[o] = parseInt(row.slice(s, s + 2), 16)
    MAP[o + 1] = parseInt(row.slice(s + 2, s + 4), 16)
    MAP[o + 2] = parseInt(row.slice(s + 4, s + 6), 16)
  }
})

/** Bilinearly sample the gradient at normalized (u, v), writing RGB (0–255) into `out`. */
export function sampleGradient(u: number, v: number, out: Float32Array): void {
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
