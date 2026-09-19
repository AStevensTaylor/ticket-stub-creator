/** Deterministic pseudo-random bar widths from a seed string (decorative, not scannable). */
export function barcodeBars(seed: string, count = 48): number[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    bars.push(1 + (Math.abs(h) % 3))
  }
  return bars
}
