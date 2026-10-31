import { PassThrough } from 'node:stream'
import type { FastifyReply } from 'fastify'
import type { EventoConsulta } from 'shared'

export type StreamEventos = {
  enviar(evento: EventoConsulta, id?: string): void
  fechar(): void
}

export function iniciarStream(reply: FastifyReply): StreamEventos {
  const corpo = new PassThrough()
  reply
    .code(200)
    .headers({
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    })
    .send(corpo)

  let aberto = true
  return {
    enviar(evento, id) {
      if (!aberto) return
      const linhas = [id ? `id: ${id}` : null, `event: ${evento.tipo}`, `data: ${JSON.stringify(evento)}`].filter(Boolean)
      corpo.write(`${linhas.join('\n')}\n\n`)
    },
    fechar() {
      if (!aberto) return
      aberto = false
      corpo.end()
    },
  }
}
