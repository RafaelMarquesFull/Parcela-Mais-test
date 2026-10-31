import type { ResultadoFinanceira as ResultadoLinha } from '@prisma/client'
import type { MotivoIndisponivel, NomeFinanceira, StatusResultado } from 'shared'
import type { ResultadoFinanceira } from '../../../domain/entities/resultado-financeira'

export function paraResultado(linha: ResultadoLinha): ResultadoFinanceira {
  return {
    id: linha.id,
    consultaId: linha.consultaId,
    financeira: linha.financeira as NomeFinanceira,
    status: linha.status as StatusResultado,
    motivo: linha.motivo as MotivoIndisponivel | null,
    valorAprovado: linha.valorAprovado,
    taxaMensal: linha.taxaMensal,
    prazos: JSON.parse(linha.prazos) as number[],
    duracaoMs: linha.duracaoMs,
    respondidoEm: linha.respondidoEm,
  }
}
