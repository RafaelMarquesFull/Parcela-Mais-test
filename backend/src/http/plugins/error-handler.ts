import type { FastifyError, FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { ConsultaNaoEncontrada, CredenciaisInvalidas, DomainError, EscolhaConflitante, OfertaInvalida, RefreshInvalido } from '../../domain/errors/domain-error'

const statusPorErro: Array<[new (...args: never[]) => DomainError, number]> = [
  [ConsultaNaoEncontrada, 404],
  [EscolhaConflitante, 409],
  [OfertaInvalida, 422],
  [CredenciaisInvalidas, 401],
  [RefreshInvalido, 401],
]

export function registrarErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((erro: FastifyError | ZodError | DomainError, _req, reply) => {
    if (erro instanceof ZodError) {
      const erros = erro.issues.map(i => ({ campo: i.path.join('.') || 'body', mensagem: i.message }))
      return reply.code(400).send({ mensagem: 'Dados inválidos', erros })
    }
    if (erro instanceof DomainError) {
      const status = statusPorErro.find(([classe]) => erro instanceof classe)?.[1] ?? 400
      return reply.code(status).send({ mensagem: erro.message, codigo: erro.codigo })
    }
    const statusCode = 'statusCode' in erro && typeof erro.statusCode === 'number' ? erro.statusCode : 500
    if (statusCode >= 500) app.log.error(erro)
    return reply.code(statusCode).send({ mensagem: statusCode >= 500 ? 'Erro interno' : erro.message })
  })
}
