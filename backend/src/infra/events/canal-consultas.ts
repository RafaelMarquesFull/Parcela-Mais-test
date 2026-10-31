import { EventEmitter } from 'node:events'
import type { EventoConsulta } from 'shared'
import type { OuvinteEventos, PublicadorEventos } from '../../domain/ports/publicador-eventos.port'

export class CanalConsultas implements PublicadorEventos {
  private readonly emissor = new EventEmitter({ captureRejections: false })

  constructor() {
    this.emissor.setMaxListeners(0)
  }

  publicar(consultaId: string, evento: EventoConsulta): void {
    this.emissor.emit(consultaId, evento)
  }

  assinar(consultaId: string, ouvinte: OuvinteEventos): () => void {
    this.emissor.on(consultaId, ouvinte)
    return () => this.emissor.off(consultaId, ouvinte)
  }
}
