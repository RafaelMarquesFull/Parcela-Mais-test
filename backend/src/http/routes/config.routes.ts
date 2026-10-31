import type { FastifyInstance } from 'fastify'
import type { Env } from '../../config/env'

export async function configRoutes(app: FastifyInstance, opcoes: { env: Env }) {
  app.get('/config', async () => ({ simulacaoHabilitada: opcoes.env.SIMULACAO_CENARIOS }))
}
