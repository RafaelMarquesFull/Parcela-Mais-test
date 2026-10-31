import type { Cenario, NomeFinanceira } from 'shared'
import type { DadosPaciente } from '../entities/paciente'

export type RespostaFinanceira =
  | { aprovada: true; valorAprovado: number; taxaMensal: number; prazos: number[] }
  | { aprovada: false }

export interface Financeira {
  readonly nome: NomeFinanceira
  consultar(paciente: DadosPaciente, cenario: Cenario): Promise<RespostaFinanceira>
}
