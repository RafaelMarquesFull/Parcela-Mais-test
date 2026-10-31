import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { EmissorToken } from '../../domain/ports/emissor-token.port'

export type UsuarioAutenticado = { id: string; nome: string }

declare module 'fastify' {
  interface FastifyRequest {
    usuario: UsuarioAutenticado
  }
  interface FastifyInstance {
    autenticar: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

function extrairToken(request: FastifyRequest): string | null {
  const cabecalho = request.headers.authorization
  if (cabecalho?.startsWith('Bearer ')) return cabecalho.slice(7)
  const query = request.query as { token?: unknown }
  if (request.routeOptions.url === '/consultas/:id/eventos' && typeof query.token === 'string') return query.token
  return null
}

export function registrarAutenticacao(app: FastifyInstance, emissor: EmissorToken) {
  app.decorateRequest('usuario', null as unknown as UsuarioAutenticado)
  app.decorate('autenticar', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extrairToken(request)
    const payload = token ? emissor.verificar(token) : null
    if (!payload) return reply.code(401).send({ mensagem: 'Sessão necessária' })
    request.usuario = { id: payload.sub, nome: payload.nome }
  })
}
