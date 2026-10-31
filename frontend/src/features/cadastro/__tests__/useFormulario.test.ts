import { act, renderHook } from '@testing-library/react'
import { useFormulario } from '../hooks/useFormulario'
import { lerRascunho, limparRascunho } from '../state/rascunho'

const dadosValidos = { nome: 'Ana Souza', cpf: '52998224725', dataNascimento: '1996-05-10', celular: '11912345678' }

function preencher(result: { current: ReturnType<typeof useFormulario> }, valores: Record<string, string | number | null>) {
  act(() => {
    for (const [campo, valor] of Object.entries(valores)) result.current.alterar(campo as never, valor as never)
  })
}

beforeEach(() => {
  limparRascunho()
  vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111') })
})
afterEach(() => vi.unstubAllGlobals())

describe('useFormulario', () => {
  it('começa no passo 1 com avançar bloqueado', () => {
    const { result } = renderHook(() => useFormulario({ aoEnviar: vi.fn() }))
    expect(result.current.estado.passo).toBe(1)
    expect(result.current.passoValido).toBe(false)
  })

  it('não avança com CPF inválido e mostra erro após tocar o campo', () => {
    const { result } = renderHook(() => useFormulario({ aoEnviar: vi.fn() }))
    preencher(result, { ...dadosValidos, cpf: '52998224724' })
    act(() => result.current.tocar('cpf'))
    act(() => result.current.avancar())
    expect(result.current.estado.passo).toBe(1)
    expect(result.current.estado.erros.cpf).toBe('CPF inválido')
  })

  it('não mostra erro de campo que ainda não foi tocado', () => {
    const { result } = renderHook(() => useFormulario({ aoEnviar: vi.fn() }))
    preencher(result, { cpf: '123' })
    expect(result.current.estado.erros.cpf).toBeUndefined()
  })

  it('avança com dados válidos e voltar preserva os valores', () => {
    const { result } = renderHook(() => useFormulario({ aoEnviar: vi.fn() }))
    preencher(result, dadosValidos)
    act(() => result.current.avancar())
    expect(result.current.estado.passo).toBe(2)
    act(() => result.current.voltar())
    expect(result.current.estado.passo).toBe(1)
    expect(result.current.estado.valores.nome).toBe('Ana Souza')
  })

  it('restaura o rascunho do sessionStorage ao montar', () => {
    const primeiro = renderHook(() => useFormulario({ aoEnviar: vi.fn() }))
    preencher(primeiro.result, dadosValidos)
    act(() => primeiro.result.current.avancar())
    expect(lerRascunho()?.passo).toBe(2)
    primeiro.unmount()
    const segundo = renderHook(() => useFormulario({ aoEnviar: vi.fn() }))
    expect(segundo.result.current.estado.passo).toBe(2)
    expect(segundo.result.current.estado.valores.cpf).toBe('52998224725')
  })

  it('aplica valorInicial ao valor do tratamento', () => {
    const { result } = renderHook(() => useFormulario({ aoEnviar: vi.fn(), valorInicial: 640_000 }))
    expect(result.current.estado.valores.valorTratamento).toBe(640_000)
  })

  it('envia centavos e reutiliza a mesma chave após uma falha', async () => {
    const aoEnviar = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useFormulario({ aoEnviar }))
    preencher(result, dadosValidos)
    act(() => result.current.avancar())
    preencher(result, { rendaMensal: 1_000_000, valorTratamento: 800_000, cenario: 'delta_falha' })
    expect(result.current.passoValido).toBe(true)
    await act(() => result.current.enviar())
    expect(result.current.estado.erroEnvio).toBe('rede')
    await act(() => result.current.enviar())
    expect(aoEnviar).toHaveBeenCalledTimes(2)
    expect(aoEnviar.mock.calls[0]![0]).toMatchObject({ cpf: '52998224725', rendaMensal: 1_000_000, valorTratamento: 800_000, cenario: 'delta_falha' })
    expect(aoEnviar.mock.calls[0]![1]).toBe(aoEnviar.mock.calls[1]![1])
    expect(lerRascunho()).toBeNull()
  })

  it('editar um campo depois de uma falha gera nova chave de idempotência', async () => {
    const chaves = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']
    vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: vi.fn(() => chaves.shift()) })
    const aoEnviar = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useFormulario({ aoEnviar }))
    preencher(result, dadosValidos)
    act(() => result.current.avancar())
    preencher(result, { rendaMensal: 1_000_000, valorTratamento: 800_000 })
    await act(() => result.current.enviar())
    preencher(result, { valorTratamento: 700_000 })
    await act(() => result.current.enviar())
    expect(aoEnviar.mock.calls[0]![1]).toBe('11111111-1111-4111-8111-111111111111')
    expect(aoEnviar.mock.calls[1]![1]).toBe('22222222-2222-4222-8222-222222222222')
  })

  it('não envia com passo 2 inválido', async () => {
    const aoEnviar = vi.fn()
    const { result } = renderHook(() => useFormulario({ aoEnviar }))
    preencher(result, dadosValidos)
    act(() => result.current.avancar())
    preencher(result, { rendaMensal: 1_000_000, valorTratamento: 50_000 })
    await act(() => result.current.enviar())
    expect(aoEnviar).not.toHaveBeenCalled()
    expect(result.current.estado.erros.valorTratamento).toContain('R$ 1.000,00')
  })
})
