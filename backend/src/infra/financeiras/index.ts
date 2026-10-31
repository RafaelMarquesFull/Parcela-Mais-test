import type { Financeira } from '../../domain/ports/financeira.port'
import type { Relogio } from '../../domain/ports/relogio.port'
import { Alfa } from './alfa'
import { Beta } from './beta'
import { Delta } from './delta'
import { Gama } from './gama'
import { SimuladorLatencia } from './simulador-latencia'

export const latenciaMaximaMs = { alfa: 1500, beta: 5000, gama: 3000, delta: 15_000 } as const

export function criarFinanceiras(relogio: Relogio): Financeira[] {
  const latencia = new SimuladorLatencia(relogio)
  return [new Alfa(latencia), new Beta(latencia), new Gama(latencia), new Delta(latencia)]
}
