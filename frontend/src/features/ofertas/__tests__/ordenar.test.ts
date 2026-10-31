import type { ResultadoSnapshot } from 'shared'
import { achatarOfertas, ordenarOfertas, type OfertaPlana } from '../ordenar'

const oferta = (financeira: OfertaPlana['financeira'], prazoMeses: number, valorParcela: number, totalPago: number): OfertaPlana => ({
  financeira,
  valorAprovado: 800_000,
  taxaMensal: 200,
  prazoMeses,
  valorParcela,
  totalPago,
})

describe('ordenarOfertas', () => {
  const lista = [oferta('beta', 24, 30_000, 720_000), oferta('alfa', 6, 140_000, 840_000), oferta('gama', 12, 75_000, 900_000), oferta('alfa', 12, 75_000, 900_000)]

  it('ordena por menor parcela', () => {
    expect(ordenarOfertas(lista, 'menor_parcela').map(o => `${o.financeira}-${o.prazoMeses}`)).toEqual(['beta-24', 'alfa-12', 'gama-12', 'alfa-6'])
  })

  it('ordena por menor total', () => {
    expect(ordenarOfertas(lista, 'menor_total').map(o => `${o.financeira}-${o.prazoMeses}`)).toEqual(['beta-24', 'alfa-6', 'alfa-12', 'gama-12'])
  })

  it('não altera a lista original', () => {
    const copia = [...lista]
    ordenarOfertas(lista, 'menor_total')
    expect(lista).toEqual(copia)
  })
})

describe('achatarOfertas', () => {
  it('gera uma oferta por prazo só das financeiras aprovadas', () => {
    const resultados: ResultadoSnapshot[] = [
      { financeira: 'alfa', status: 'aprovada', motivo: null, valorAprovado: 800_000, taxaMensal: 249, duracaoMs: 1, ofertas: [{ prazoMeses: 6, valorParcela: 1, totalPago: 6 }, { prazoMeses: 12, valorParcela: 2, totalPago: 24 }] },
      { financeira: 'gama', status: 'recusada', motivo: 'regra', valorAprovado: null, taxaMensal: null, duracaoMs: 1, ofertas: [] },
    ]
    expect(achatarOfertas(resultados)).toEqual([
      { financeira: 'alfa', valorAprovado: 800_000, taxaMensal: 249, prazoMeses: 6, valorParcela: 1, totalPago: 6 },
      { financeira: 'alfa', valorAprovado: 800_000, taxaMensal: 249, prazoMeses: 12, valorParcela: 2, totalPago: 24 },
    ])
  })
})
