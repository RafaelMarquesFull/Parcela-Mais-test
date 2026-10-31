import { act, renderHook, waitFor } from '@testing-library/react'
import type { ConsultaSnapshot, ResultadoSnapshot } from 'shared'
import { useConsulta } from '../hooks/useConsulta'

class EventSourceFalso {
  static ultima: EventSourceFalso | null = null
  readonly ouvintes = new Map<string, Array<(e: MessageEvent) => void>>()
  readyState = 0
  constructor(readonly url: string) {
    EventSourceFalso.ultima = this
  }
  addEventListener(tipo: string, ouvinte: (e: MessageEvent) => void) {
    this.ouvintes.set(tipo, [...(this.ouvintes.get(tipo) ?? []), ouvinte])
  }
  close() {}
  emitir(tipo: string, dados?: unknown) {
    for (const ouvinte of this.ouvintes.get(tipo) ?? []) ouvinte({ data: JSON.stringify(dados) } as MessageEvent)
  }
}

const resultado = (financeira: ResultadoSnapshot['financeira'], status: ResultadoSnapshot['status']): ResultadoSnapshot => ({
  financeira,
  status,
  motivo: null,
  valorAprovado: null,
  taxaMensal: null,
  duracaoMs: null,
  ofertas: [],
})

const snapshot: ConsultaSnapshot = {
  id: 'abc',
  status: 'em_andamento',
  valorTratamento: 800_000,
  cenario: 'aleatorio',
  criadaEm: 'x',
  finalizadaEm: null,
  paciente: { nome: 'Ana', cpfMascarado: '***', dataNascimento: '1990-01-01', celular: '11', rendaMensal: 1 },
  resultados: [resultado('alfa', 'consultando'), resultado('beta', 'consultando')],
  escolha: null,
}

beforeEach(() => {
  vi.stubGlobal('EventSource', EventSourceFalso)
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot }) as Response))
})
afterEach(() => vi.unstubAllGlobals())

describe('useConsulta', () => {
  it('insere resultado de financeira que ainda não estava no snapshot', async () => {
    const { result } = renderHook(() => useConsulta('abc'))
    await waitFor(() => expect(result.current.consulta).not.toBeNull())
    act(() => EventSourceFalso.ultima!.emitir('open'))
    act(() => EventSourceFalso.ultima!.emitir('resultado', { tipo: 'resultado', resultado: resultado('gama', 'recusada') }))
    expect(result.current.consulta?.resultados.map(r => `${r.financeira}:${r.status}`)).toEqual(['alfa:consultando', 'beta:consultando', 'gama:recusada'])
  })

  it('substitui resultado de financeira já presente', async () => {
    const { result } = renderHook(() => useConsulta('abc'))
    await waitFor(() => expect(result.current.consulta).not.toBeNull())
    act(() => EventSourceFalso.ultima!.emitir('open'))
    act(() => EventSourceFalso.ultima!.emitir('resultado', { tipo: 'resultado', resultado: resultado('alfa', 'aprovada') }))
    expect(result.current.consulta?.resultados.map(r => `${r.financeira}:${r.status}`)).toEqual(['alfa:aprovada', 'beta:consultando'])
  })
})
