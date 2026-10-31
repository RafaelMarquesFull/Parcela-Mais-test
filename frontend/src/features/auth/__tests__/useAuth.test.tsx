import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../hooks/useAuth'
import { definirToken, obterToken, requisitar } from '@/services/http'

type Resposta = { status: number; corpo?: unknown }

function respostaDe({ status, corpo }: Resposta) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo ?? {} } as Response
}

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>()
const envolver = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  definirToken(null)
})
afterEach(() => vi.unstubAllGlobals())

describe('AuthProvider', () => {
  it('tenta renovar ao montar e popula o usuário quando há sessão', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/refresh')) return respostaDe({ status: 200, corpo: { accessToken: 'novo', usuario: { nome: 'Clínica Demo' } } })
      return respostaDe({ status: 404 })
    })
    const { result } = renderHook(() => useAuth(), { wrapper: envolver })
    expect(result.current.carregando).toBe(true)
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.usuario).toEqual({ nome: 'Clínica Demo' })
    expect(obterToken()).toBe('novo')
  })

  it('sem sessão, fica sem usuário', async () => {
    fetchMock.mockResolvedValue(respostaDe({ status: 401 }))
    const { result } = renderHook(() => useAuth(), { wrapper: envolver })
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.usuario).toBeNull()
  })

  it('entrar guarda o token e o usuário; sair limpa', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/auth/login')) return respostaDe({ status: 200, corpo: { accessToken: 'abc', usuario: { nome: 'Clínica Demo' } } })
      if (url.endsWith('/auth/logout')) return { ok: true, status: 204, json: async () => ({}) } as Response
      return respostaDe({ status: 401 })
    })
    const { result } = renderHook(() => useAuth(), { wrapper: envolver })
    await waitFor(() => expect(result.current.carregando).toBe(false))
    await act(() => result.current.entrar({ email: 'clinica@parcelamais.com', senha: 'parcela123' }))
    expect(result.current.usuario).toEqual({ nome: 'Clínica Demo' })
    expect(obterToken()).toBe('abc')
    await act(() => result.current.sair())
    expect(result.current.usuario).toBeNull()
    expect(obterToken()).toBeNull()
  })
})

describe('requisitar com renovação', () => {
  it('em 401 renova uma vez e repete a requisição com o novo token', async () => {
    definirToken('velho')
    const tokensUsados: string[] = []
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return respostaDe({ status: 200, corpo: { accessToken: 'novo' } })
      const auth = String((init?.headers as Record<string, string>)?.Authorization ?? '')
      tokensUsados.push(auth)
      return auth === 'Bearer novo' ? respostaDe({ status: 200, corpo: [] }) : respostaDe({ status: 401 })
    })
    const resultado = await requisitar('/consultas')
    expect(resultado).toEqual([])
    expect(tokensUsados).toEqual(['Bearer velho', 'Bearer novo'])
  })

  it('duas requisições 401 simultâneas disparam um refresh só', async () => {
    definirToken('velho')
    let refreshes = 0
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        refreshes += 1
        await new Promise(r => setTimeout(r, 10))
        return respostaDe({ status: 200, corpo: { accessToken: 'novo' } })
      }
      const auth = String((init?.headers as Record<string, string>)?.Authorization ?? '')
      return auth === 'Bearer novo' ? respostaDe({ status: 200, corpo: [] }) : respostaDe({ status: 401 })
    })
    await Promise.all([requisitar('/consultas'), requisitar('/consultas')])
    expect(refreshes).toBe(1)
  })

  it('se o refresh falha, limpa o token e dispara sessao-encerrada', async () => {
    definirToken('velho')
    const ouvinte = vi.fn()
    window.addEventListener('sessao-encerrada', ouvinte)
    fetchMock.mockResolvedValue(respostaDe({ status: 401 }))
    await expect(requisitar('/consultas')).rejects.toMatchObject({ status: 401 })
    expect(obterToken()).toBeNull()
    expect(ouvinte).toHaveBeenCalledTimes(1)
    window.removeEventListener('sessao-encerrada', ouvinte)
  })
})
