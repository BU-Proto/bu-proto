/**
 * Smooth value noise on a wrapping size x size lattice of random values,
 * interpolated with smoothstep. Coordinates are in lattice cells.
 */
export function createValueNoise(size: number, random: () => number = Math.random) {
  const lattice = new Float32Array(size * size)
  for (let k = 0; k < lattice.length; k++) lattice[k] = random()

  return function valueNoise(x: number, y: number): number {
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
  }
}
