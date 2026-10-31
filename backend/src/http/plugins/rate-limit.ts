import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export async function registrarRateLimit(app: FastifyInstance, opcoes: { max: number }) {
  await app.register(rateLimit, { max: opcoes.max, timeWindow: '1 minute' })
}
