import type { Relogio } from '../../src/domain/ports/relogio.port'

export function criarRelogioFalso(): Relogio {
  return {
    agora: () => Date.now(),
    esperar: ms => new Promise(resolve => setTimeout(resolve, ms)),
  }
}
