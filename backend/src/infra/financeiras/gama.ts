import { calcularIdade } from 'shared'
import type { DadosPaciente } from '../../domain/entities/paciente'
import type { RespostaFinanceira } from '../../domain/ports/financeira.port'
import { FinanceiraSimulada } from './financeira-simulada'
import type { SimuladorLatencia } from './simulador-latencia'

export class Gama extends FinanceiraSimulada {
  readonly nome = 'gama' as const
  protected readonly taxaMensal = 329
  protected readonly prazos = [6, 10, 12]
  protected readonly latenciaMs: [number, number] = [1000, 3000]

  constructor(
    latencia: SimuladorLatencia,
    private readonly hoje: () => Date = () => new Date(),
  ) {
    super(latencia)
  }

  protected avaliar(paciente: DadosPaciente): RespostaFinanceira {
    const idade = calcularIdade(paciente.dataNascimento, this.hoje())
    if (idade < 25 || paciente.valorTratamento > 2_000_000) return { aprovada: false }
    return this.aprovar(paciente.valorTratamento)
  }
}
