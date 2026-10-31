import type { Escolha as EscolhaLinha } from '@prisma/client'
import type { Escolha } from '../../../domain/entities/escolha'

export function paraEscolha(linha: EscolhaLinha): Escolha {
  return {
    id: linha.id,
    consultaId: linha.consultaId,
    resultadoId: linha.resultadoId,
    prazoMeses: linha.prazoMeses,
    valorParcela: linha.valorParcela,
    totalPago: linha.totalPago,
    criadaEm: linha.criadaEm,
  }
}
