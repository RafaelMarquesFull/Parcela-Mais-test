import { construirApp, pacienteExemplo } from '../helpers/build-app'

let ctx: Awaited<ReturnType<typeof construirApp>>

beforeAll(async () => {
  ctx = await construirApp()
})
afterAll(() => ctx.limpar())

const post = (payload: Record<string, unknown> = pacienteExemplo, chave: string = crypto.randomUUID()) =>
  ctx.app.inject({ method: 'POST', url: '/consultas', headers: { ...ctx.auth, 'idempotency-key': chave }, payload })

describe('POST /consultas', () => {
  it('devolve 202 com id e grava a consulta', async () => {
    const res = await post()
    expect(res.statusCode).toBe(202)
    const { id } = res.json()
    expect(await ctx.prisma.consulta.findUnique({ where: { id } })).not.toBeNull()
  })

  it('snapshot logo após o 202 já tem as 4 financeiras como consultando', async () => {
    const res = await post()
    const snapshot = await ctx.app.inject({ method: 'GET', url: `/consultas/${res.json().id}`, headers: ctx.auth })
    expect(snapshot.json().resultados).toHaveLength(4)
    expect(snapshot.json().resultados.every((r: { status: string }) => r.status === 'consultando')).toBe(true)
  })

  it('mesma Idempotency-Key devolve o mesmo id e cria uma consulta só', async () => {
    const chave = crypto.randomUUID()
    const a = await post(pacienteExemplo, chave)
    const b = await post(pacienteExemplo, chave)
    expect(b.statusCode).toBe(202)
    expect(a.json().id).toBe(b.json().id)
    expect(await ctx.prisma.consulta.count({ where: { chaveIdempotencia: chave } })).toBe(1)
  })

  it('duas requisições simultâneas com a mesma chave criam uma consulta só', async () => {
    const chave = crypto.randomUUID()
    const [a, b] = await Promise.all([post(pacienteExemplo, chave), post(pacienteExemplo, chave)])
    expect(a.json().id).toBe(b.json().id)
    expect(await ctx.prisma.consulta.count({ where: { chaveIdempotencia: chave } })).toBe(1)
  })

  it('sem Idempotency-Key devolve 400', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: ctx.auth, payload: pacienteExemplo })
    expect(res.statusCode).toBe(400)
  })

  it('Idempotency-Key que não é UUID devolve 400', async () => {
    const res = await post(pacienteExemplo, 'abc')
    expect(res.statusCode).toBe(400)
  })

  it.each([
    { valorTratamento: '150000' },
    { valorTratamento: 1500.5 },
    { valorTratamento: -1 },
    { extra: 1 },
    { cpf: '52998224724' },
    { dataNascimento: '2026-02-30' },
  ])('payload hostil %j devolve 400 com lista de erros', async alteracao => {
    const res = await post({ ...pacienteExemplo, ...alteracao })
    expect(res.statusCode).toBe(400)
    expect(res.json().erros.length).toBeGreaterThan(0)
  })

  it('body vazio devolve 400', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { ...ctx.auth, 'idempotency-key': crypto.randomUUID() } })
    expect(res.statusCode).toBe(400)
  })

  it('cenario é ignorado quando simulação está desabilitada', async () => {
    const outro = await construirApp({ simulacao: false })
    const res = await outro.app.inject({ method: 'POST', url: '/consultas', headers: { ...outro.auth, 'idempotency-key': crypto.randomUUID() }, payload: { ...pacienteExemplo, cenario: 'delta_falha' } })
    const consulta = await outro.prisma.consulta.findUnique({ where: { id: res.json().id } })
    expect(consulta?.cenario).toBe('aleatorio')
    await outro.limpar()
  })
})
