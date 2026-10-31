import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export async function registrarRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
}
