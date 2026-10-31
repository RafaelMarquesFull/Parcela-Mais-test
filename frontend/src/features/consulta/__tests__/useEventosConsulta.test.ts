import { act, renderHook } from '@testing-library/react'
import type { ResultadoSnapshot } from 'shared'
import { useEventosConsulta } from '../hooks/useEventosConsulta'

class EventSourceFalso {
  static instancias: EventSourceFalso[] = []
  readonly ouvintes = new Map<string, Array<(e: MessageEvent) => void>>()
  fechado = false
  constructor(readonly url: string) {
    EventSourceFalso.instancias.push(this)
  }
  addEventListener(tipo: string, ouvinte: (e: MessageEvent) => void) {
    this.ouvintes.set(tipo, [...(this.ouvintes.get(tipo) ?? []), ouvinte])
  }
  close() {
    this.fechado = true
  }
  emitir(tipo: string, dados?: unknown) {
    for (const ouvinte of this.ouvintes.get(tipo) ?? []) ouvinte({ data: JSON.stringify(dados) } as MessageEvent)
  }
}

const resultadoAlfa: ResultadoSnapshot = { financeira: 'alfa', status: 'aprovada', motivo: null, valorAprovado: 1, taxaMensal: 249, duracaoMs: 700, ofertas: [] }

function montar(ativo = true) {
  const aoResultado = vi.fn()
  const aoFinalizar = vi.fn()
  const recarregar = vi.fn().mockResolvedValue(undefined)
  const hook = renderHook(
    ({ ativo }) =>
      useEventosConsulta({
        id: 'abc',
        ativo,
        aoResultado,
        aoFinalizar,
        recarregar,
        criarEventSource: url => new EventSourceFalso(url) as unknown as EventSource,
        esperaOpenMs: 2000,
        intervaloPollingMs: 1000,
      }),
    { initialProps: { ativo } },
  )
  return { hook, aoResultado, aoFinalizar, recarregar, fonte: () => EventSourceFalso.instancias.at(-1)! }
}

beforeEach(() => {
  vi.useFakeTimers()
  EventSourceFalso.instancias = []
})
afterEach(() => vi.useRealTimers())

describe('useEventosConsulta', () => {
  it('abre o EventSource na URL da consulta e entra em modo sse após open', () => {
    const { hook, fonte } = montar()
    expect(fonte().url).toContain('/consultas/abc/eventos')
    act(() => fonte().emitir('open'))
    expect(hook.result.current.modo).toBe('sse')
  })

  it('evento resultado chama aoResultado com o snapshot da financeira', () => {
    const { aoResultado, fonte } = montar()
    act(() => fonte().emitir('open'))
    act(() => fonte().emitir('resultado', { tipo: 'resultado', resultado: resultadoAlfa }))
    expect(aoResultado).toHaveBeenCalledWith(resultadoAlfa)
  })

  it('consulta-finalizada chama aoFinalizar e fecha a conexão', () => {
    const { hook, aoFinalizar, fonte } = montar()
    act(() => fonte().emitir('open'))
    act(() => fonte().emitir('consulta-finalizada', { tipo: 'consulta-finalizada', status: 'finalizada', finalizadaEm: 'x' }))
    expect(aoFinalizar).toHaveBeenCalledTimes(1)
    expect(fonte().fechado).toBe(true)
    expect(hook.result.current.modo).toBe('parado')
  })

  it('sem open em 2 s cai para polling e recarrega a cada 1 s', async () => {
    const { hook, recarregar, fonte } = montar()
    await act(() => vi.advanceTimersByTimeAsync(1999))
    expect(hook.result.current.modo).toBe('conectando')
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(hook.result.current.modo).toBe('polling')
    expect(fonte().fechado).toBe(true)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(recarregar).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(recarregar).toHaveBeenCalledTimes(2)
  })

  it('ativo=false para o polling e fecha tudo', async () => {
    const { hook, recarregar } = montar()
    await act(() => vi.advanceTimersByTimeAsync(3000))
    expect(recarregar).toHaveBeenCalledTimes(1)
    hook.rerender({ ativo: false })
    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(recarregar).toHaveBeenCalledTimes(1)
    expect(hook.result.current.modo).toBe('parado')
  })

  it('erro na conexão recarrega o snapshot', () => {
    const { recarregar, fonte } = montar()
    act(() => fonte().emitir('open'))
    act(() => fonte().emitir('error'))
    expect(recarregar).toHaveBeenCalledTimes(1)
  })

  it('não abre conexão quando inativo', () => {
    montar(false)
    expect(EventSourceFalso.instancias).toHaveLength(0)
  })
})
