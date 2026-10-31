import type { MotivoIndisponivel, NomeFinanceira, StatusResultado } from 'shared'

export type ResultadoFinanceira = {
  id: string
  consultaId: string
  financeira: NomeFinanceira
  status: StatusResultado
  motivo: MotivoIndisponivel | null
  valorAprovado: number | null
  taxaMensal: number | null
  prazos: number[]
  duracaoMs: number | null
  respondidoEm: Date | null
}

export type NovoResultado = Omit<ResultadoFinanceira, 'id'>
