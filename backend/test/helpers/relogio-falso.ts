import type { Relogio } from '../../src/domain/ports/relogio.port'

export function criarRelogioFalso(): Relogio {
  return {
    agora: () => Date.now(),
    esperar: ms => new Promise(resolve => setTimeout(resolve, ms)),
  }
}

export function criarRelogioAcelerado(fator: number): Relogio {
  return {
    agora: () => Date.now() * fator,
    esperar: ms => new Promise(resolve => setTimeout(resolve, ms / fator)),
  }
}
