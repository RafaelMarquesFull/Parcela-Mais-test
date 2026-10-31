import type { ErroResposta } from 'shared'

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

export async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  if (resposta.status === 204) return undefined as T
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) throw new ErroHttp(resposta.status, corpo)
  return corpo as T
}
