import type { FastifyReply, FastifyRequest } from 'fastify'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function exigirIdempotencia(request: FastifyRequest, reply: FastifyReply) {
  const chave = request.headers['idempotency-key']
  if (typeof chave !== 'string' || !uuid.test(chave)) {
    return reply.code(400).send({ mensagem: 'Header Idempotency-Key ausente ou inválido' })
  }
}

export function chaveIdempotencia(request: FastifyRequest): string {
  return request.headers['idempotency-key'] as string
}
