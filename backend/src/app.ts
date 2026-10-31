import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { Env } from './config/env'
import type { Container } from './container'
import { registrarAutenticacao } from './http/plugins/autenticacao'
import { registrarErrorHandler } from './http/plugins/error-handler'
import { registrarRateLimit } from './http/plugins/rate-limit'
import { configRoutes } from './http/routes/config.routes'
import { consultasRoutes } from './http/routes/consultas.routes'

export function criarApp(opcoes: { env: Env; container: Container }) {
  const { env, container } = opcoes
  const app = Fastify({ bodyLimit: 16_384 })
  registrarErrorHandler(app)
  registrarAutenticacao(app, container)
  app.register(cors, { origin: env.ORIGEM_FRONT, credentials: true })
  app.register(registrarRateLimit)
  app.register(configRoutes, { env })
  app.register(consultasRoutes, { container })
  return app
}
