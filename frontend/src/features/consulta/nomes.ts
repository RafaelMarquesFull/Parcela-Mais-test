import type { MotivoIndisponivel, NomeFinanceira, StatusResultado } from 'shared'

export const nomeFinanceira: Record<NomeFinanceira, string> = { alfa: 'Alfa', beta: 'Beta', gama: 'Gama', delta: 'Delta' }

export const rotuloStatus: Record<StatusResultado, string> = {
  consultando: 'Consultando',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
  indisponivel: 'Indisponível',
}

export const descricaoMotivo: Record<MotivoIndisponivel, string> = {
  regra: 'recusou pela política de crédito',
  erro: 'falhou ao responder',
  timeout: 'não respondeu a tempo',
  fila_cheia: 'estava sobrecarregada',
}
