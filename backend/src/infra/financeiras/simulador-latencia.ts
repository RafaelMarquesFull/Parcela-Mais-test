import type { Relogio } from '../../domain/ports/relogio.port'

export class SimuladorLatencia {
  constructor(
    private readonly relogio: Relogio,
    private readonly aleatorio: () => number = Math.random,
  ) {}

  esperarEntre(minMs: number, maxMs: number): Promise<void> {
    const ms = minMs + Math.floor(this.aleatorio() * (maxMs - minMs + 1))
    return this.relogio.esperar(ms)
  }

  esperarExato(ms: number): Promise<void> {
    return this.relogio.esperar(ms)
  }
}
