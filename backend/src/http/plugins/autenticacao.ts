import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { Container } from '../../container'

export type UsuarioAutenticado = { id: string; nome: string }

declare module 'fastify' {
  interface FastifyRequest {
    usuario: UsuarioAutenticado
  }
}

export function registrarAutenticacao(app: FastifyInstance, container: Container) {
  app.decorateRequest('usuario', null as unknown as UsuarioAutenticado)
  app.decorate('autenticar', async (request: FastifyRequest) => {
    const usuario = await container.usuarios.buscarPorEmail('clinica@parcelamais.com')
    if (usuario) request.usuario = { id: usuario.id, nome: usuario.nome }
  })
}

declare module 'fastify' {
  interface FastifyInstance {
    autenticar: (request: FastifyRequest) => Promise<void>
  }
}
