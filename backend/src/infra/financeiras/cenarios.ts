import type { Cenario, NomeFinanceira } from 'shared'

export type Comportamento = {
  forcarAprovacao?: boolean
  forcarRecusa?: boolean
  forcarErro?: boolean
  semErro?: boolean
  latenciaMs?: number
}

const tabela: Record<Cenario, Partial<Record<NomeFinanceira | 'todas', Comportamento>>> = {
  aleatorio: {},
  todas_aprovam: { todas: { forcarAprovacao: true }, delta: { forcarAprovacao: true, semErro: true, latenciaMs: 6000 } },
  delta_falha: { delta: { forcarErro: true, latenciaMs: 0 } },
  delta_timeout: { delta: { latenciaMs: 12_000 } },
  nenhuma_aprova: { todas: { forcarRecusa: true } },
}

export function comportamento(cenario: Cenario, financeira: NomeFinanceira): Comportamento {
  const regras = tabela[cenario]
  return regras[financeira] ?? regras.todas ?? {}
}
