import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import type { Env } from './config/env'
import type { Container } from './container'
import { registrarAutenticacao } from './http/plugins/autenticacao'
import { registrarErrorHandler } from './http/plugins/error-handler'
import { registrarRateLimit } from './http/plugins/rate-limit'
import { authRoutes } from './http/routes/auth.routes'
import { configRoutes } from './http/routes/config.routes'
import { consultasRoutes } from './http/routes/consultas.routes'

export function criarApp(opcoes: { env: Env; container: Container }) {
  const { env, container } = opcoes
  const app = Fastify({ bodyLimit: 16_384 })
  registrarErrorHandler(app)
  registrarAutenticacao(app, container.emissor)
  app.register(cookie)
  app.register(cors, { origin: env.ORIGEM_FRONT, credentials: true })
  app.register(registrarRateLimit, { max: env.RATE_LIMIT_MAX })
  app.register(configRoutes, { env })
  app.register(authRoutes, { container })
  app.register(consultasRoutes, { container })
  return app
}
