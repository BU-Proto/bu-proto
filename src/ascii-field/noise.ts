export interface ValueNoise {
  /** The size × size lattice of random values (row-major), shared with the GPU renderer. */
  readonly lattice: Float32Array
  readonly size: number
  /** Smooth value noise at (x, y) in lattice cells, wrapping, smoothstep-interpolated. */
  sample(x: number, y: number): number
}

export function createValueNoise(size: number, random: () => number = Math.random): ValueNoise {
  const lattice = new Float32Array(size * size)
  for (let k = 0; k < lattice.length; k++) lattice[k] = random()

  return {
    lattice,
    size,
    sample(x: number, y: number): number {
      const xi = Math.floor(x)
      const yi = Math.floor(y)
      let fx = x - xi
      let fy = y - yi
      fx = fx * fx * (3 - 2 * fx)
      fy = fy * fy * (3 - 2 * fy)
      const x0 = ((xi % size) + size) % size
      const y0 = ((yi % size) + size) % size
      const x1 = (x0 + 1) % size
      const y1 = (y0 + 1) % size
      const a = lattice[y0 * size + x0]
      const b = lattice[y0 * size + x1]
      const c = lattice[y1 * size + x0]
      const d = lattice[y1 * size + x1]
      const top = a + (b - a) * fx
      const bottom = c + (d - c) * fx
      return top + (bottom - top) * fy
    },
  }
}
