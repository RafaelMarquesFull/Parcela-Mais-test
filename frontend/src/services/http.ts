import type { ErroResposta, LoginResposta } from 'shared'

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ErroHttp extends Error {
  constructor(
    public readonly status: number,
    public readonly corpo: ErroResposta | null,
  ) {
    super(corpo?.mensagem ?? `Erro ${status}`)
    this.name = 'ErroHttp'
  }
}

let tokenAtual: string | null = null
let renovacaoEmCurso: Promise<LoginResposta | null> | null = null

export function definirToken(token: string | null): void {
  tokenAtual = token
}

export function obterToken(): string | null {
  return tokenAtual
}

export function renovarToken(): Promise<LoginResposta | null> {
  if (!renovacaoEmCurso) {
    renovacaoEmCurso = fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async resposta => {
        if (!resposta.ok) return null
        const sessao = (await resposta.json()) as LoginResposta
        definirToken(sessao.accessToken)
        return sessao
      })
      .catch(() => null)
      .finally(() => {
        renovacaoEmCurso = null
      })
  }
  return renovacaoEmCurso
}

function encerrarSessao(): void {
  definirToken(null)
  window.dispatchEvent(new Event('sessao-encerrada'))
}

async function executar(caminho: string, init: RequestInit): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> | undefined) }
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`
  return fetch(`${BASE_URL}${caminho}`, { ...init, credentials: 'include', headers })
}

export async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  let resposta = await executar(caminho, init)
  if (resposta.status === 401 && !caminho.startsWith('/auth/')) {
    const renovada = await renovarToken()
    if (!renovada) {
      encerrarSessao()
      throw new ErroHttp(401, await resposta.json().catch(() => null))
    }
    resposta = await executar(caminho, init)
  }
  if (resposta.status === 204) return undefined as T
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) throw new ErroHttp(resposta.status, corpo)
  return corpo as T
}
