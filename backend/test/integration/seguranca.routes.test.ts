import bcrypt from 'bcryptjs'
import { aprovada } from '../helpers/fake-financeira'
import { construirApp, esperar, pacienteExemplo } from '../helpers/build-app'

let ctx: Awaited<ReturnType<typeof construirApp>>
let outroAuth: { authorization: string }

beforeAll(async () => {
  ctx = await construirApp()
  await ctx.prisma.usuario.create({ data: { id: 'outra-clinica', email: 'outra@clinica.com', nome: 'Outra Clínica', senhaHash: await bcrypt.hash('segredo', 4) } })
  const login = await ctx.app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'outra@clinica.com', senha: 'segredo' } })
  outroAuth = { authorization: `Bearer ${login.json().accessToken}` }
  Object.values(ctx.fakes).forEach(f => f.respondeEm(20, aprovada))
})
afterAll(() => ctx.limpar())

const criar = async (auth = ctx.auth, chave = crypto.randomUUID()) => {
  const res = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { ...auth, 'idempotency-key': chave }, payload: pacienteExemplo })
  return res.json().id as string
}

describe('isolamento entre usuários', () => {
  it('outro usuário não vê a consulta nem seus eventos', async () => {
    const id = await criar()
    expect((await ctx.app.inject({ method: 'GET', url: `/consultas/${id}`, headers: outroAuth })).statusCode).toBe(404)
    expect((await ctx.app.inject({ method: 'GET', url: `/consultas/${id}/eventos`, headers: outroAuth })).statusCode).toBe(404)
  })

  it('outro usuário não consegue escolher oferta na consulta alheia', async () => {
    const id = await criar()
    await esperar(150)
    const res = await ctx.app.inject({ method: 'PUT', url: `/consultas/${id}/escolha`, headers: outroAuth, payload: { financeira: 'alfa', prazoMeses: 6 } })
    expect(res.statusCode).toBe(404)
  })

  it('a mesma Idempotency-Key em usuários diferentes cria consultas diferentes', async () => {
    const chave = crypto.randomUUID()
    const a = await criar(ctx.auth, chave)
    const b = await criar(outroAuth, chave)
    expect(a).not.toBe(b)
  })

  it('token por query string só vale na rota de eventos', async () => {
    const token = ctx.auth.authorization.slice(7)
    const res = await ctx.app.inject({ method: 'GET', url: `/consultas?x=/eventos&token=${token}` })
    expect(res.statusCode).toBe(401)
  })
})

describe('concorrência', () => {
  it('duas requisições simultâneas com a mesma chave não deixam paciente órfão', async () => {
    const antes = await ctx.prisma.paciente.count()
    const chave = crypto.randomUUID()
    await Promise.all([criar(ctx.auth, chave), criar(ctx.auth, chave)])
    expect(await ctx.prisma.paciente.count()).toBe(antes + 1)
  })

  it('duas escolhas diferentes simultâneas: uma 200 e outra 409, nunca 500', async () => {
    const id = await criar()
    await esperar(150)
    const escolher = (prazoMeses: number) => ctx.app.inject({ method: 'PUT', url: `/consultas/${id}/escolha`, headers: ctx.auth, payload: { financeira: 'alfa', prazoMeses } })
    const [a, b] = await Promise.all([escolher(6), escolher(12)])
    expect([a.statusCode, b.statusCode].sort()).toEqual([200, 409])
  })
})
