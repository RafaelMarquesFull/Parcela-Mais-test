import { estadoInicial, type EstadoCadastro } from './reducer'

const CHAVE = 'parcela-mais:cadastro'

type Rascunho = Pick<EstadoCadastro, 'passo' | 'valores' | 'tocados'>

export function salvarRascunho(estado: EstadoCadastro): void {
  const rascunho: Rascunho = { passo: estado.passo, valores: estado.valores, tocados: estado.tocados }
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(rascunho))
  } catch {}
}

export function lerRascunho(): EstadoCadastro | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    if (!bruto) return null
    const rascunho = JSON.parse(bruto) as Rascunho
    return { ...estadoInicial, passo: rascunho.passo, valores: { ...estadoInicial.valores, ...rascunho.valores }, tocados: rascunho.tocados ?? {} }
  } catch {
    return null
  }
}

export function limparRascunho(): void {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {}
}
