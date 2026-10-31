import { calcularOferta, calcularParcela } from '../src/price'

describe('calcularParcela', () => {
  it('R$ 10.000 a 2,49% em 12x dá parcela de R$ 974,28', () => {
    expect(calcularParcela(1_000_000, 249, 12)).toBe(97_428)
  })

  it('n = 1 devolve valor mais um mês de juros', () => {
    expect(calcularParcela(100_000, 200, 1)).toBe(102_000)
  })

  it('arredonda em centavos, nunca devolve fração', () => {
    expect(Number.isInteger(calcularParcela(123_457, 329, 10))).toBe(true)
  })
})

describe('calcularOferta', () => {
  it('total pago é parcela vezes meses', () => {
    expect(calcularOferta(1_000_000, 249, 12)).toEqual({ prazoMeses: 12, valorParcela: 97_428, totalPago: 1_169_136 })
  })
})
