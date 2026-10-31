import type { Consulta as ConsultaLinha } from '@prisma/client'
import type { Cenario, StatusConsulta } from 'shared'
import type { Consulta } from '../../../domain/entities/consulta'

export function paraConsulta(linha: ConsultaLinha): Consulta {
  return {
    id: linha.id,
    usuarioId: linha.usuarioId,
    pacienteId: linha.pacienteId,
    valorTratamento: linha.valorTratamento,
    cenario: linha.cenario as Cenario,
    chaveIdempotencia: linha.chaveIdempotencia,
    status: linha.status as StatusConsulta,
    criadaEm: linha.criadaEm,
    finalizadaEm: linha.finalizadaEm,
  }
}
