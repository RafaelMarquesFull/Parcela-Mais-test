import type { Cenario, ResultadoSnapshot } from 'shared'
import { criarFinanceiras } from '../../src/infra/financeiras'
import { construirApp, esperar, pacienteExemplo } from '../helpers/build-app'
import { criarRelogioAcelerado } from '../helpers/relogio-falso'

const FATOR = 100
let ctx: Awaited<ReturnType<typeof construirApp>>

beforeAll(async () => {
  const relogio = criarRelogioAcelerado(FATOR)
  ctx = await construirApp({ financeiras: criarFinanceiras(relogio), relogio })
})
afterAll(() => ctx.limpar())

async function rodar(cenario: Cenario) {
  const criada = await ctx.app.inject({ method: 'POST', url: '/consultas', headers: { 'idempotency-key': crypto.randomUUID() }, payload: { ...pacienteExemplo, cenario } })
  await esperar((10_000 / FATOR) + 150)
  const snapshot = (await ctx.app.inject({ method: 'GET', url: `/consultas/${criada.json().id}` })).json()
  const por = Object.fromEntries((snapshot.resultados as ResultadoSnapshot[]).map(r => [r.financeira, r]))
  return { snapshot, por }
}

describe('cenários forçados', () => {
  it('todas_aprovam: 4 aprovadas', async () => {
    const { snapshot, por } = await rodar('todas_aprovam')
    expect(snapshot.status).toBe('finalizada')
    expect(snapshot.cenario).toBe('todas_aprovam')
    expect(Object.values(por).every(r => r.status === 'aprovada')).toBe(true)
  })

  it('delta_falha: delta indisponivel/erro, outras aprovadas', async () => {
    const { por } = await rodar('delta_falha')
    expect(por.delta).toMatchObject({ status: 'indisponivel', motivo: 'erro' })
    expect([por.alfa, por.beta, por.gama].every(r => r?.status === 'aprovada')).toBe(true)
  })

  it('delta_timeout: delta indisponivel/timeout', async () => {
    const { snapshot, por } = await rodar('delta_timeout')
    expect(por.delta).toMatchObject({ status: 'indisponivel', motivo: 'timeout' })
    expect(snapshot.status).toBe('finalizada')
  })

  it('nenhuma_aprova: 4 recusadas por regra', async () => {
    const { por } = await rodar('nenhuma_aprova')
    expect(Object.values(por).every(r => r.status === 'recusada' && r.motivo === 'regra')).toBe(true)
  })
})
