// Deterministic PRNG so instanced particle layouts are stable across reloads
// and we can A/B lighting without chasing seed drift.

export class SeededRandom {
  private s: number

  constructor(seed = 1337) {
    this.s = seed >>> 0
    if (this.s === 0) this.s = 1
  }

  /** Xorshift32. Fast, good enough for particle distribution. */
  next(): number {
    let x = this.s
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.s = x >>> 0
    return this.s / 0xffffffff
  }

  range(min: number, max: number) {
    return min + this.next() * (max - min)
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
}
