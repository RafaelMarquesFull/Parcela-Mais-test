import { aprovada, recusada } from '../helpers/fake-financeira'
import { construirApp, esperar, pacienteExemplo } from '../helpers/build-app'

let ctx: Awaited<ReturnType<typeof construirApp>>

beforeAll(async () => {
  ctx = await construirApp()
})
afterAll(() => ctx.limpar())

describe('GET /consultas/:id', () => {
  it('inexistente devolve 404', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/consultas/nao-existe', headers: ctx.auth })
    expect(res.statusCode).toBe(404)
  })

  it('devolve snapshot com ofertas calculadas e CPF mascarado', async () => {
    ctx.fakes.alfa.respondeEm(50, aprovada)
    ctx.fakes.beta.respondeEm(50, { aprovada: true, valorAprovado: 480_000, taxaMensal: 199, prazos: [12, 18, 24] })
    ctx.fakes.gama.respondeEm(50, recusada)
    ctx.fakes.delta.falha()
    const criada = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { ...ctx.auth, 'idempotency-key': crypto.randomUUID() }, payload: pacienteExemplo })
    await esperar(300)
    const res = await ctx.app.inject({ method: 'GET', url: `/consultas/${criada.json().id}`, headers: ctx.auth })
    expect(res.statusCode).toBe(200)
    const corpo = res.json()
    expect(corpo.status).toBe('finalizada')
    expect(corpo.paciente.cpfMascarado).toBe('***.982.247-**')
    expect(corpo.paciente).not.toHaveProperty('cpf')
    const alfa = corpo.resultados.find((r: { financeira: string }) => r.financeira === 'alfa')
    expect(alfa.ofertas).toHaveLength(3)
    expect(alfa.ofertas[0]).toMatchObject({ prazoMeses: 6 })
    expect(corpo.resultados.find((r: { financeira: string }) => r.financeira === 'delta')).toMatchObject({ status: 'indisponivel', motivo: 'erro', ofertas: [] })
    expect(corpo.escolha).toBeNull()
  })

  it('GET /consultas lista resumos', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/consultas', headers: ctx.auth })
    expect(res.statusCode).toBe(200)
    expect(res.json()[0]).toMatchObject({ pacienteNome: 'Ana Souza', valorTratamento: 800_000 })
  })
})
