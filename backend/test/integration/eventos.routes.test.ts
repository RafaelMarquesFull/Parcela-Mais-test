import { aprovada, recusada } from '../helpers/fake-financeira'
import { construirApp, esperar, pacienteExemplo } from '../helpers/build-app'

let ctx: Awaited<ReturnType<typeof construirApp>>

beforeAll(async () => {
  ctx = await construirApp()
  ctx.fakes.alfa.respondeEm(30, aprovada)
  ctx.fakes.beta.respondeEm(60, aprovada)
  ctx.fakes.gama.respondeEm(90, recusada)
  ctx.fakes.delta.respondeEm(120, aprovada)
})
afterAll(() => ctx.limpar())

const criar = async () => {
  const res = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { 'idempotency-key': crypto.randomUUID() }, payload: pacienteExemplo })
  return res.json().id as string
}

const eventosDe = (corpo: string) => corpo.split('\n').filter(l => l.startsWith('event: ')).map(l => l.slice(7))

describe('GET /consultas/:id/eventos', () => {
  it('inexistente devolve 404', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/consultas/x/eventos' })
    expect(res.statusCode).toBe(404)
  })

  it('consulta em andamento recebe um resultado por financeira e termina com consulta-finalizada', async () => {
    const id = await criar()
    const res = await ctx.app.inject({ method: 'GET', url: `/consultas/${id}/eventos` })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toContain('text/event-stream')
    const eventos = eventosDe(res.body)
    expect(eventos.filter(e => e === 'resultado')).toHaveLength(4)
    expect(eventos.at(-1)).toBe('consulta-finalizada')
    const linhasData = res.body.split('\n').filter(l => l.startsWith('data: '))
    expect(JSON.parse(linhasData[0]!.slice(6))).toMatchObject({ tipo: 'resultado', resultado: { financeira: 'alfa', status: 'aprovada' } })
  })

  it('consulta finalizada devolve consulta-finalizada na hora e fecha', async () => {
    const id = await criar()
    await esperar(250)
    const res = await ctx.app.inject({ method: 'GET', url: `/consultas/${id}/eventos` })
    const eventos = eventosDe(res.body)
    expect(eventos.filter(e => e === 'resultado')).toHaveLength(4)
    expect(eventos.at(-1)).toBe('consulta-finalizada')
  })
})
