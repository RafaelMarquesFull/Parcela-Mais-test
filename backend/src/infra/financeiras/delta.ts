import type { DadosPaciente } from '../../domain/entities/paciente'
import type { RespostaFinanceira } from '../../domain/ports/financeira.port'
import type { Comportamento } from './cenarios'
import { FinanceiraSimulada } from './financeira-simulada'
import type { SimuladorLatencia } from './simulador-latencia'

export class Delta extends FinanceiraSimulada {
  readonly nome = 'delta' as const
  protected readonly taxaMensal = 219
  protected readonly prazos = [12, 24, 36]
  protected readonly latenciaMs: [number, number] = [4000, 15_000]

  constructor(
    latencia: SimuladorLatencia,
    private readonly aleatorio: () => number = Math.random,
  ) {
    super(latencia)
  }

  protected avaliar(paciente: DadosPaciente, regra: Comportamento): RespostaFinanceira {
    if (!regra.semErro && this.aleatorio() < 0.3) throw new Error('delta respondeu 500')
    return this.aprovar(paciente.valorTratamento)
  }
}
