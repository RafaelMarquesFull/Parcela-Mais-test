import { act, renderHook, waitFor } from '@testing-library/react'
import { useConsultas } from '../hooks/useConsultas'

const chamadas: string[] = []

beforeEach(() => {
  chamadas.length = 0
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      chamadas.push(url)
      const parametros = new URL(url).searchParams
      const pagina = Number(parametros.get('pagina'))
      return { ok: true, status: 200, json: async () => ({ itens: [{ id: `c${pagina}` }], total: 12, pagina, porPagina: Number(parametros.get('porPagina')) }) } as Response
    }),
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useConsultas', () => {
  it('carrega a primeira página com o tamanho pedido e calcula o total de páginas', async () => {
    const { result } = renderHook(() => useConsultas({ porPagina: 5 }))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(chamadas[0]).toContain('pagina=1')
    expect(chamadas[0]).toContain('porPagina=5')
    expect(result.current.pagina.itens[0]?.id).toBe('c1')
    expect(result.current.totalPaginas).toBe(3)
  })

  it('avança e volta de página dentro dos limites', async () => {
    const { result } = renderHook(() => useConsultas({ porPagina: 5 }))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    act(() => result.current.irPara(3))
    await waitFor(() => expect(result.current.pagina.pagina).toBe(3))
    act(() => result.current.irPara(4))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.pagina.pagina).toBe(3)
    act(() => result.current.irPara(0))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.pagina.pagina).toBe(3)
  })

  it('buscar espera a digitação parar, volta para a página 1 e envia o termo', async () => {
    const { result } = renderHook(() => useConsultas({ porPagina: 5 }))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    act(() => result.current.irPara(2))
    await waitFor(() => expect(result.current.pagina.pagina).toBe(2))
    const antes = chamadas.length
    act(() => result.current.buscar('car'))
    act(() => result.current.buscar('carla'))
    expect(chamadas.length).toBe(antes)
    await act(() => vi.advanceTimersByTimeAsync(400))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(chamadas.length).toBe(antes + 1)
    expect(chamadas.at(-1)).toContain('busca=carla')
    expect(chamadas.at(-1)).toContain('pagina=1')
  })
})
