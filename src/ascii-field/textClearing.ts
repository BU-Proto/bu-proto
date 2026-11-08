import { FOG } from './settings'

/**
 * Elements the trail should step back from so the copy stays legible.
 * `data-fog-clear="box"` clears the element's whole box (pills, buttons), as does
 * `data-trail-skip` (a region whose own art draws the trail);
 * any other value clears just the line boxes of its text.
 */
export const CLEAR_SELECTOR = '[data-fog-clear]'

/**
 * Rasterize the marked elements onto the character grid (cols × rows cells of
 * cellW × cellH px), then blur and boost the coverage so the trail fades out smoothly as it
 * approaches text: 0 = no effect, 1 = fully cleared.
 */
export function buildClearMask(
  elements: Iterable<Element>,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
): Float32Array {
  const coverage = new Float32Array(cols * rows)
  const pad = FOG.CLEAR_PAD
  const fill = (rect: DOMRect) => {
    if (rect.width <= 1 || rect.height <= 1) return
    const i0 = Math.max(0, Math.floor((rect.left - pad) / cellW))
    const i1 = Math.min(cols - 1, Math.floor((rect.right + pad) / cellW))
    const j0 = Math.max(0, Math.floor((rect.top - pad) / cellH))
    const j1 = Math.min(rows - 1, Math.floor((rect.bottom + pad) / cellH))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) coverage[j * cols + i] = 1
    }
  }

  const viewHeight = window.innerHeight
  for (const element of elements) {
    // Off screen: nothing to clear, and no need to pay for its style.
    const box = element.getBoundingClientRect()
    if (box.bottom < -pad || box.top > viewHeight + pad || box.width <= 1 || box.height <= 1) continue
    if (getComputedStyle(element).visibility !== 'visible') continue
    if (element.getAttribute('data-fog-clear') === 'box' || element.hasAttribute('data-trail-skip')) {
      fill(box)
    } else {
      const range = document.createRange()
      range.selectNodeContents(element)
      for (const rect of range.getClientRects()) fill(rect)
    }
  }

  const blurred = boxBlur(coverage, cols, rows, FOG.CLEAR_BLUR)
  for (let k = 0; k < blurred.length; k++) {
    blurred[k] = Math.min(1, blurred[k] * FOG.CLEAR_GAIN)
  }
  return blurred
}

/**
 * The opposite of the clear mask: where the trail may run at all, as the boxes of the given elements
 * on the character grid, softened at their edges. 1 = inside, 0 = outside.
 */
export function buildAllowMask(
  elements: Iterable<Element>,
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
): Float32Array {
  const coverage = new Float32Array(cols * rows)
  const viewHeight = window.innerHeight
  for (const element of elements) {
    const box = element.getBoundingClientRect()
    if (box.bottom < 0 || box.top > viewHeight || box.width <= 1 || box.height <= 1) continue
    const i0 = Math.max(0, Math.floor(box.left / cellW))
    const i1 = Math.min(cols - 1, Math.floor(box.right / cellW))
    const j0 = Math.max(0, Math.floor(box.top / cellH))
    const j1 = Math.min(rows - 1, Math.floor(box.bottom / cellH))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) coverage[j * cols + i] = 1
    }
  }
  return boxBlur(coverage, cols, rows, FOG.CLEAR_BLUR)
}

/** Separable box blur with clamped edges. */
function boxBlur(src: Float32Array, width: number, height: number, radius: number): Float32Array {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const norm = 1 / (2 * radius + 1)
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let sum = 0
      for (let o = -radius; o <= radius; o++) {
        const ii = i + o
        if (ii >= 0 && ii < width) sum += src[j * width + ii]
      }
      tmp[j * width + i] = sum * norm
    }
  }
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let sum = 0
      for (let o = -radius; o <= radius; o++) {
        const jj = j + o
        if (jj >= 0 && jj < height) sum += tmp[jj * width + i]
      }
      out[j * width + i] = sum * norm
    }
  }
  return out
}
