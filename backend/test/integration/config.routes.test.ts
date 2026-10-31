import { construirApp } from '../helpers/build-app'

it('GET /config devolve simulacaoHabilitada', async () => {
  const { app, limpar } = await construirApp({ simulacao: true })
  const res = await app.inject({ method: 'GET', url: '/config' })
  expect(res.statusCode).toBe(200)
  expect(res.json()).toEqual({ simulacaoHabilitada: true })
  await limpar()
})
