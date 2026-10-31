import { construirApp, pacienteExemplo } from '../helpers/build-app'
import { usuarioSemeado } from '../helpers/banco-temporario'

let ctx: Awaited<ReturnType<typeof construirApp>>

beforeAll(async () => {
  ctx = await construirApp()
})
afterAll(() => ctx.limpar())

const login = (senha = usuarioSemeado.senha) => ctx.app.inject({ method: 'POST', url: '/auth/login', payload: { email: usuarioSemeado.email, senha } })
const cookieDe = (res: { headers: Record<string, unknown> }) => String(res.headers['set-cookie']).split(';')[0]!

describe('autenticação', () => {
  it('login devolve access token e cookie httpOnly de refresh', async () => {
    const res = await login()
    expect(res.statusCode).toBe(200)
    expect(res.json().accessToken).toBeTypeOf('string')
    expect(res.json().usuario).toEqual({ nome: usuarioSemeado.nome })
    const cookie = String(res.headers['set-cookie'])
    expect(cookie).toContain('refresh=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/auth')
  })

  it('senha errada devolve 401', async () => {
    expect((await login('errada')).statusCode).toBe(401)
  })

  it('payload inválido devolve 400', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'x' } })
    expect(res.statusCode).toBe(400)
  })

  it('rotas de consulta sem Bearer devolvem 401', async () => {
    expect((await ctx.app.inject({ method: 'GET', url: '/consultas' })).statusCode).toBe(401)
    expect((await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { 'idempotency-key': crypto.randomUUID() }, payload: pacienteExemplo })).statusCode).toBe(401)
    expect((await ctx.app.inject({ method: 'GET', url: '/consultas', headers: { authorization: 'Bearer invalido' } })).statusCode).toBe(401)
  })

  it('com Bearer a rota responde e a consulta fica ligada ao usuário', async () => {
    const { accessToken } = (await login()).json()
    const criada = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { authorization: `Bearer ${accessToken}`, 'idempotency-key': crypto.randomUUID() }, payload: pacienteExemplo })
    expect(criada.statusCode).toBe(202)
    const consulta = await ctx.prisma.consulta.findUnique({ where: { id: criada.json().id } })
    expect(consulta?.usuarioId).toBe(usuarioSemeado.id)
  })

  it('refresh rotaciona e o cookie antigo passa a dar 401', async () => {
    const cookie = cookieDe(await login())
    const renovado = await ctx.app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie } })
    expect(renovado.statusCode).toBe(200)
    expect(renovado.json().accessToken).toBeTypeOf('string')
    const novoCookie = cookieDe(renovado)
    expect(novoCookie).not.toBe(cookie)
    expect((await ctx.app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie } })).statusCode).toBe(401)
    expect((await ctx.app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie: novoCookie } })).statusCode).toBe(401)
  })

  it('refresh sem cookie devolve 401', async () => {
    expect((await ctx.app.inject({ method: 'POST', url: '/auth/refresh' })).statusCode).toBe(401)
  })

  it('logout devolve 204, limpa o cookie e invalida o refresh', async () => {
    const cookie = cookieDe(await login())
    const saida = await ctx.app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie } })
    expect(saida.statusCode).toBe(204)
    expect(String(saida.headers['set-cookie'])).toMatch(/refresh=;|Max-Age=0|Expires=/)
    expect((await ctx.app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie } })).statusCode).toBe(401)
  })

  it('SSE aceita o token por query string', async () => {
    const { accessToken } = (await login()).json()
    const criada = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { authorization: `Bearer ${accessToken}`, 'idempotency-key': crypto.randomUUID() }, payload: pacienteExemplo })
    const semToken = await ctx.app.inject({ method: 'GET', url: `/consultas/${criada.json().id}/eventos` })
    expect(semToken.statusCode).toBe(401)
    const comToken = await ctx.app.inject({ method: 'GET', url: `/consultas/${criada.json().id}/eventos?token=${accessToken}` })
    expect(comToken.statusCode).toBe(200)
  })
})
