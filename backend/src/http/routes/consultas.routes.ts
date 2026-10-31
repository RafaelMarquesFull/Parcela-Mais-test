import type { FastifyInstance } from 'fastify'
import { cadastroSchema, escolhaSchema } from 'shared'
import type { Container } from '../../container'
import { apresentarResultado } from '../../application/consultas/calcular-ofertas'
import { chaveIdempotencia, exigirIdempotencia } from '../plugins/idempotency'
import { apresentarConsulta, apresentarEscolha } from '../presenters/consulta.presenter'
import { iniciarStream } from '../sse/stream'

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

  app.get<{ Params: { id: string } }>('/consultas/:id/eventos', async (request, reply) => {
    const { id } = request.params
    await container.obterConsulta.executar(id)
    const stream = iniciarStream(reply)

    const encerrar = () => {
      cancelar()
      stream.fechar()
    }
    const cancelar = container.eventos.assinar(id, evento => {
      stream.enviar(evento)
      if (evento.tipo === 'consulta-finalizada') encerrar()
    })
    request.raw.on('close', encerrar)

    const atual = await container.obterConsulta.executar(id)
    for (const resultado of atual.resultados.filter(r => r.status !== 'consultando')) {
      stream.enviar({ tipo: 'resultado', resultado: apresentarResultado(resultado) }, resultado.id)
    }
    if (atual.consulta.status === 'finalizada') {
      stream.enviar({ tipo: 'consulta-finalizada', status: 'finalizada', finalizadaEm: atual.consulta.finalizadaEm?.toISOString() ?? '' })
      encerrar()
    }
    return reply
  })

  app.put<{ Params: { id: string } }>('/consultas/:id/escolha', async request => {
    const entrada = escolhaSchema.parse(request.body)
    const escolha = await container.escolherOferta.executar(request.params.id, entrada)
    const resultados = await container.consultas.resultados(request.params.id)
    return apresentarEscolha(escolha, resultados)
  })
}
