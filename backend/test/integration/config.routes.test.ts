import { criarApp } from '../../src/app'
import { carregarEnv } from '../../src/config/env'

it('GET /config devolve simulacaoHabilitada', async () => {
  const env = carregarEnv({ SIMULACAO_CENARIOS: 'true', JWT_SECRET: 'x', DATABASE_URL: 'file:./test.db' })
  const app = criarApp({ env })
  const res = await app.inject({ method: 'GET', url: '/config' })
  expect(res.statusCode).toBe(200)
  expect(res.json()).toEqual({ simulacaoHabilitada: true })
})
