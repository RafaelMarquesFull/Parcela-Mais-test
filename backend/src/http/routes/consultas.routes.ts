import type { FastifyInstance } from 'fastify'
import { cadastroSchema, escolhaSchema } from 'shared'
import type { Container } from '../../container'
import { chaveIdempotencia, exigirIdempotencia } from '../plugins/idempotency'
import { apresentarConsulta, apresentarEscolha } from '../presenters/consulta.presenter'

export async function consultasRoutes(app: FastifyInstance, opcoes: { container: Container }) {
  const { container } = opcoes

  app.addHook('preHandler', app.autenticar)

  app.post('/consultas', { preHandler: [exigirIdempotencia] }, async (request, reply) => {
    const entrada = cadastroSchema.parse(request.body)
    const { id } = await container.criarConsulta.executar(request.usuario.id, chaveIdempotencia(request), entrada)
    return reply.code(202).send({ id })
  })

  app.get('/consultas', async request => container.listarConsultas.executar(request.usuario.id))

  app.get<{ Params: { id: string } }>('/consultas/:id', async request => {
    return apresentarConsulta(await container.obterConsulta.executar(request.params.id))
  })

  app.put<{ Params: { id: string } }>('/consultas/:id/escolha', async request => {
    const entrada = escolhaSchema.parse(request.body)
    const escolha = await container.escolherOferta.executar(request.params.id, entrada)
    const resultados = await container.consultas.resultados(request.params.id)
    return apresentarEscolha(escolha, resultados)
  })
}
