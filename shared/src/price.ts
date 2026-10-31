export type OfertaPrazo = { prazoMeses: number; valorParcela: number; totalPago: number }

export function calcularParcela(valorCentavos: number, taxaPontosBase: number, meses: number): number {
  const i = taxaPontosBase / 10_000
  return Math.round((valorCentavos * i) / (1 - (1 + i) ** -meses))
}

export function calcularOferta(valorCentavos: number, taxaPontosBase: number, meses: number): OfertaPrazo {
  const valorParcela = calcularParcela(valorCentavos, taxaPontosBase, meses)
  return { prazoMeses: meses, valorParcela, totalPago: valorParcela * meses }
}
