import type { DadosPaciente } from '../../domain/entities/paciente'
import type { RespostaFinanceira } from '../../domain/ports/financeira.port'
import { FinanceiraSimulada } from './financeira-simulada'

export class Beta extends FinanceiraSimulada {
  readonly nome = 'beta' as const
  protected readonly taxaMensal = 199
  protected readonly prazos = [12, 18, 24]
  protected readonly latenciaMs: [number, number] = [2000, 5000]

  protected avaliar(paciente: DadosPaciente): RespostaFinanceira {
    return this.aprovar(Math.round(paciente.valorTratamento * 0.6))
  }
}
