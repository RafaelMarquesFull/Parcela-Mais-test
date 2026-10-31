import { aprovada, recusada } from '../helpers/fake-financeira'
import { construirApp, esperar, pacienteExemplo } from '../helpers/build-app'

let ctx: Awaited<ReturnType<typeof construirApp>>
let id: string

beforeAll(async () => {
  ctx = await construirApp()
  ctx.fakes.alfa.respondeEm(20, aprovada)
  ctx.fakes.beta.respondeEm(20, { aprovada: true, valorAprovado: 480_000, taxaMensal: 199, prazos: [12, 18, 24] })
  ctx.fakes.gama.respondeEm(20, recusada)
  ctx.fakes.delta.respondeEm(20, recusada)
  const criada = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { ...ctx.auth, 'idempotency-key': crypto.randomUUID() }, payload: pacienteExemplo })
  id = criada.json().id
  await esperar(200)
})
afterAll(() => ctx.limpar())

const escolher = (payload: Record<string, unknown>) => ctx.app.inject({ method: 'PUT', url: `/consultas/${id}/escolha`, headers: ctx.auth, payload })

describe('PUT /consultas/:id/escolha', () => {
  it('prazo inexistente devolve 422', async () => {
    expect((await escolher({ financeira: 'beta', prazoMeses: 48 })).statusCode).toBe(422)
  })

  it('financeira recusada devolve 422', async () => {
    expect((await escolher({ financeira: 'gama', prazoMeses: 6 })).statusCode).toBe(422)
  })

  it('payload inválido devolve 400', async () => {
    expect((await escolher({ financeira: 'beta' })).statusCode).toBe(400)
  })

  it('escolha válida devolve 200 com valores calculados e aparece no snapshot', async () => {
    const res = await escolher({ financeira: 'beta', prazoMeses: 24 })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ financeira: 'beta', prazoMeses: 24 })
    expect(res.json().valorParcela).toBeGreaterThan(0)
    const snapshot = await ctx.app.inject({ method: 'GET', url: `/consultas/${id}`, headers: ctx.auth })
    expect(snapshot.json().escolha).toMatchObject({ financeira: 'beta', prazoMeses: 24 })
  })

  it('repetir a mesma escolha devolve 200', async () => {
    expect((await escolher({ financeira: 'beta', prazoMeses: 24 })).statusCode).toBe(200)
  })

  it('escolha diferente devolve 409', async () => {
    expect((await escolher({ financeira: 'beta', prazoMeses: 12 })).statusCode).toBe(409)
  })

  it('consulta inexistente devolve 404', async () => {
    const res = await ctx.app.inject({ method: 'PUT', url: '/consultas/x/escolha', headers: ctx.auth, payload: { financeira: 'beta', prazoMeses: 12 } })
    expect(res.statusCode).toBe(404)
  })
})
