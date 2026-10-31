import type { NomeFinanceira, ResultadoSnapshot } from 'shared'

export type Ordenacao = 'menor_parcela' | 'menor_total'

export type OfertaPlana = {
  financeira: NomeFinanceira
  valorAprovado: number
  taxaMensal: number
  prazoMeses: number
  valorParcela: number
  totalPago: number
}

export function achatarOfertas(resultados: ResultadoSnapshot[]): OfertaPlana[] {
  return resultados.flatMap(r => {
    if (r.status !== 'aprovada' || r.valorAprovado === null || r.taxaMensal === null) return []
    const { valorAprovado, taxaMensal } = r
    return r.ofertas.map(o => ({ financeira: r.financeira, valorAprovado, taxaMensal, ...o }))
  })
}

const chave: Record<Ordenacao, keyof OfertaPlana> = { menor_parcela: 'valorParcela', menor_total: 'totalPago' }

export function ordenarOfertas(ofertas: OfertaPlana[], criterio: Ordenacao): OfertaPlana[] {
  const campo = chave[criterio]
  return [...ofertas].sort((a, b) => (a[campo] as number) - (b[campo] as number) || a.financeira.localeCompare(b.financeira))
}
