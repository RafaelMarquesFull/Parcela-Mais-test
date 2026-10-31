export type Escolha = {
  id: string
  consultaId: string
  resultadoId: string
  prazoMeses: number
  valorParcela: number
  totalPago: number
  criadaEm: Date
}

export type NovaEscolha = Omit<Escolha, 'id' | 'criadaEm'>
