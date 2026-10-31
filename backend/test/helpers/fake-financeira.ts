import type { NomeFinanceira } from 'shared'
import type { Financeira, RespostaFinanceira } from '../../src/domain/ports/financeira.port'

export type FakeFinanceira = Financeira & {
  respondeEm(ms: number, resposta: RespostaFinanceira): void
  falha(): void
  nuncaResponde(): void
}

export const aprovada: RespostaFinanceira = { aprovada: true, valorAprovado: 800_000, taxaMensal: 249, prazos: [6, 12, 18] }
export const recusada: RespostaFinanceira = { aprovada: false }

export function criarFakeFinanceira(nome: NomeFinanceira): FakeFinanceira {
  let modo: { tipo: 'responde'; ms: number; resposta: RespostaFinanceira } | { tipo: 'falha' } | { tipo: 'nunca' } = { tipo: 'responde', ms: 100, resposta: aprovada }
  return {
    nome,
    respondeEm: (ms, resposta) => (modo = { tipo: 'responde', ms, resposta }),
    falha: () => (modo = { tipo: 'falha' }),
    nuncaResponde: () => (modo = { tipo: 'nunca' }),
    consultar: () =>
      new Promise((resolve, reject) => {
        if (modo.tipo === 'falha') return reject(new Error(`${nome} falhou`))
        if (modo.tipo === 'nunca') return
        const { ms, resposta } = modo
        setTimeout(() => resolve(resposta), ms)
      }),
  }
}

export function criarQuatroFakes() {
  return {
    alfa: criarFakeFinanceira('alfa'),
    beta: criarFakeFinanceira('beta'),
    gama: criarFakeFinanceira('gama'),
    delta: criarFakeFinanceira('delta'),
  }
}
