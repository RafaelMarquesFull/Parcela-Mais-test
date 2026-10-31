import type { Cenario } from 'shared'

export type Campo = 'nome' | 'cpf' | 'dataNascimento' | 'celular' | 'rendaMensal' | 'valorTratamento' | 'cenario'

export type Valores = {
  nome: string
  cpf: string
  dataNascimento: string
  celular: string
  rendaMensal: number | null
  valorTratamento: number | null
  cenario: Cenario
}

export type Passo = 1 | 2

export type EstadoCadastro = {
  passo: Passo
  valores: Valores
  tocados: Partial<Record<Campo, boolean>>
  chaveEnvio: string | null
  enviando: boolean
  enviado: boolean
  erroEnvio: string | null
}

export const camposPorPasso: Record<Passo, Campo[]> = {
  1: ['nome', 'cpf', 'dataNascimento', 'celular'],
  2: ['rendaMensal', 'valorTratamento'],
}

export const estadoInicial: EstadoCadastro = {
  passo: 1,
  valores: { nome: '', cpf: '', dataNascimento: '', celular: '', rendaMensal: null, valorTratamento: null, cenario: 'aleatorio' },
  tocados: {},
  chaveEnvio: null,
  enviando: false,
  enviado: false,
  erroEnvio: null,
}

export type Acao =
  | { tipo: 'alterar'; campo: Campo; valor: Valores[Campo] }
  | { tipo: 'tocar'; campo: Campo }
  | { tipo: 'tocarPasso'; passo: Passo }
  | { tipo: 'avancar' }
  | { tipo: 'voltar' }
  | { tipo: 'iniciarEnvio'; chave: string }
  | { tipo: 'falharEnvio'; mensagem: string }
  | { tipo: 'concluirEnvio' }

export function reducer(estado: EstadoCadastro, acao: Acao): EstadoCadastro {
  switch (acao.tipo) {
    case 'alterar':
      return { ...estado, valores: { ...estado.valores, [acao.campo]: acao.valor }, erroEnvio: null }
    case 'tocar':
      return { ...estado, tocados: { ...estado.tocados, [acao.campo]: true } }
    case 'tocarPasso':
      return { ...estado, tocados: { ...estado.tocados, ...Object.fromEntries(camposPorPasso[acao.passo].map(c => [c, true])) } }
    case 'avancar':
      return { ...estado, passo: 2 }
    case 'voltar':
      return { ...estado, passo: 1, erroEnvio: null }
    case 'iniciarEnvio':
      return { ...estado, chaveEnvio: acao.chave, enviando: true, erroEnvio: null }
    case 'falharEnvio':
      return { ...estado, enviando: false, erroEnvio: acao.mensagem }
    case 'concluirEnvio':
      return { ...estado, enviando: false, enviado: true }
  }
}
