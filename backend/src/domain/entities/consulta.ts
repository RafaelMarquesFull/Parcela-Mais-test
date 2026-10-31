import type { Cenario, StatusConsulta } from 'shared'

export type Consulta = {
  id: string
  usuarioId: string
  pacienteId: string
  valorTratamento: number
  cenario: Cenario
  chaveIdempotencia: string
  status: StatusConsulta
  criadaEm: Date
  finalizadaEm: Date | null
}

export type NovaConsulta = Omit<Consulta, 'id' | 'status' | 'criadaEm' | 'finalizadaEm'>
