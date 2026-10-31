import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { Env } from './config/env'
import { configRoutes } from './http/routes/config.routes'

export function criarApp(opcoes: { env: Env }) {
  const app = Fastify({ bodyLimit: 16_384 })
  app.register(cors, { origin: opcoes.env.ORIGEM_FRONT, credentials: true })
  app.register(configRoutes, { env: opcoes.env })
  return app
}
