import type { Relogio } from '../domain/ports/relogio.port'

export const relogioReal: Relogio = {
  agora: () => Date.now(),
  esperar: ms => new Promise(resolve => setTimeout(resolve, ms)),
}
