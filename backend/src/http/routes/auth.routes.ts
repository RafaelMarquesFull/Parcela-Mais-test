import type { FastifyInstance, FastifyReply } from 'fastify'
import { loginSchema } from 'shared'
import { DURACAO_REFRESH_MS } from '../../application/auth/sessao'
import type { Container } from '../../container'

const NOME_COOKIE = 'refresh'

function gravarCookie(reply: FastifyReply, refreshToken: string) {
  reply.setCookie(NOME_COOKIE, refreshToken, { httpOnly: true, sameSite: 'strict', path: '/auth', maxAge: DURACAO_REFRESH_MS / 1000, secure: 'auto' })
}

export async function authRoutes(app: FastifyInstance, opcoes: { container: Container }) {
  const { container } = opcoes

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const entrada = loginSchema.parse(request.body)
    const { accessToken, refreshToken, usuario } = await container.autenticar.executar(entrada)
    gravarCookie(reply, refreshToken)
    return { accessToken, usuario }
  })

  app.post('/auth/refresh', async (request, reply) => {
    const atual = request.cookies[NOME_COOKIE]
    if (!atual) return reply.code(401).send({ mensagem: 'Sessão necessária' })
    const { accessToken, refreshToken } = await container.renovarSessao.executar(atual)
    gravarCookie(reply, refreshToken)
    return { accessToken }
  })

  app.post('/auth/logout', async (request, reply) => {
    const atual = request.cookies[NOME_COOKIE]
    if (atual) await container.encerrarSessao.executar(atual)
    reply.clearCookie(NOME_COOKIE, { path: '/auth' })
    return reply.code(204).send()
  })
}
