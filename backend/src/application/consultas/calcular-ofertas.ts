import { calcularOferta, type OfertaPrazo, type ResultadoSnapshot } from 'shared'
import type { ResultadoFinanceira } from '../../domain/entities/resultado-financeira'

export function calcularOfertas(resultado: ResultadoFinanceira): OfertaPrazo[] {
  if (resultado.status !== 'aprovada' || resultado.valorAprovado === null || resultado.taxaMensal === null) return []
  const { valorAprovado, taxaMensal } = resultado
  return resultado.prazos.map(meses => calcularOferta(valorAprovado, taxaMensal, meses))
}

export function apresentarResultado(resultado: ResultadoFinanceira): ResultadoSnapshot {
  return {
    financeira: resultado.financeira,
    status: resultado.status,
    motivo: resultado.motivo,
    valorAprovado: resultado.valorAprovado,
    taxaMensal: resultado.taxaMensal,
    duracaoMs: resultado.duracaoMs,
    ofertas: calcularOfertas(resultado),
  }
}
