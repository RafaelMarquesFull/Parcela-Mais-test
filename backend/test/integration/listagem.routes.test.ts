import { aprovada, recusada } from '../helpers/fake-financeira'
import { construirApp, esperar, pacienteExemplo } from '../helpers/build-app'

let ctx: Awaited<ReturnType<typeof construirApp>>

beforeAll(async () => {
  ctx = await construirApp()
  ctx.fakes.alfa.respondeEm(10, aprovada)
  ctx.fakes.beta.respondeEm(10, aprovada)
  ctx.fakes.gama.respondeEm(10, recusada)
  ctx.fakes.delta.respondeEm(10, recusada)
  const nomes = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Melo', 'Elisa Rocha', 'Fábio Nunes', 'Gabi Prado']
  for (const [i, nome] of nomes.entries()) {
    if (i === 6) Object.values(ctx.fakes).forEach(f => f.respondeEm(10, recusada))
    await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { ...ctx.auth, 'idempotency-key': crypto.randomUUID() }, payload: { ...pacienteExemplo, nome, valorTratamento: 800_000 + i * 100_000 } })
    await esperar(15)
  }
  await esperar(200)
})
afterAll(() => ctx.limpar())

const listar = (query: string) => ctx.app.inject({ method: 'GET', url: `/consultas${query}`, headers: ctx.auth })

describe('GET /consultas paginado', () => {
  it('devolve a primeira página com total e mais recentes primeiro', async () => {
    const res = await listar('?pagina=1&porPagina=3')
    expect(res.statusCode).toBe(200)
    const corpo = res.json()
    expect(corpo.total).toBe(7)
    expect(corpo.pagina).toBe(1)
    expect(corpo.porPagina).toBe(3)
    expect(corpo.itens).toHaveLength(3)
    expect(corpo.itens[0].pacienteNome).toBe('Gabi Prado')
  })

  it('última página vem incompleta', async () => {
    const corpo = (await listar('?pagina=3&porPagina=3')).json()
    expect(corpo.itens).toHaveLength(1)
    expect(corpo.itens[0].pacienteNome).toBe('Ana Souza')
  })

  it('busca por nome do paciente, sem distinguir maiúsculas', async () => {
    const corpo = (await listar('?busca=carla')).json()
    expect(corpo.total).toBe(1)
    expect(corpo.itens[0].pacienteNome).toBe('Carla Dias')
  })

  it('página inválida devolve 400 e padrão é 5 por página', async () => {
    expect((await listar('?pagina=0')).statusCode).toBe(400)
    expect((await listar('?porPagina=500')).statusCode).toBe(400)
    expect((await listar('')).json().porPagina).toBe(5)
  })
})

describe('GET /consultas/metricas', () => {
  it('conta consultas de hoje, taxa de aprovação e volume do usuário', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/consultas/metricas', headers: ctx.auth })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      consultasHoje: 7,
      consultasOntem: 0,
      finalizadas: 7,
      comCredito: 6,
      volumeSolicitado: 7 * 800_000 + 100_000 * 21,
    })
  })

  it('não mistura usuários', async () => {
    const outro = await construirApp()
    const res = await outro.app.inject({ method: 'GET', url: '/consultas/metricas', headers: outro.auth })
    expect(res.json()).toMatchObject({ consultasHoje: 0, finalizadas: 0, volumeSolicitado: 0 })
    await outro.limpar()
  })
})
