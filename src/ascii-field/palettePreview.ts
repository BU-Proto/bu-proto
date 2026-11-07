// A preview of the proposed palette, for comparing by eye: add ?palette=v2 to any URL in
// development. It lifts the field's greyed violets toward iris and applies the token fixes in
// index.css. Nothing changes without the flag, and it does nothing in production.

export const PALETTE_V2 = import.meta.env.DEV && new URLSearchParams(window.location.search).get('palette') === 'v2'

if (PALETTE_V2) document.documentElement.dataset.palette = 'v2'

/** The lowest chroma a violet cell may have, and the hues (OKLCH degrees) that count as violet. */
const MIN_CHROMA = 0.1
const VIOLET_FROM = 245
const VIOLET_TO = 335

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

function toOklab(r: number, g: number, b: number): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}

function fromOklab(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}

function liftCell(hex: string): string {
  const [r, g, b] = [0, 2, 4].map((at) => toLinear(Number.parseInt(hex.slice(at, at + 2), 16) / 255)) as [number, number, number]
  const [L, A, B] = toOklab(r, g, b)
  const chroma = Math.hypot(A, B)
  const hue = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  if (chroma >= MIN_CHROMA || chroma < 0.015 || hue < VIOLET_FROM || hue > VIOLET_TO) return hex
  const scale = MIN_CHROMA / chroma
  return fromOklab(L, A * scale, B * scale)
    .map((v) => Math.round(toGamma(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0'))
    .join('')
}

/** The hero map with its violet cells lifted, under the flag; otherwise as it came. */
export function previewRows(rows: readonly string[]): readonly string[] {
  if (!PALETTE_V2) return rows
  return rows.map((row) => (row.match(/.{6}/g) ?? []).map(liftCell).join(''))
}
