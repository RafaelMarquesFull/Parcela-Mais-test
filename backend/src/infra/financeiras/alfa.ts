import type { DadosPaciente } from '../../domain/entities/paciente'
import type { RespostaFinanceira } from '../../domain/ports/financeira.port'
import { FinanceiraSimulada } from './financeira-simulada'

export class Alfa extends FinanceiraSimulada {
  readonly nome = 'alfa' as const
  protected readonly taxaMensal = 249
  protected readonly prazos = [6, 12, 18]
  protected readonly latenciaMs: [number, number] = [500, 1500]

  protected avaliar(paciente: DadosPaciente): RespostaFinanceira {
    if (paciente.rendaMensal * 10 >= paciente.valorTratamento) return this.aprovar(paciente.valorTratamento)
    return { aprovada: false }
  }
}
