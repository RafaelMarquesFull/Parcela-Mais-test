import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'
import type { PublicadorEventos } from '../../domain/ports/publicador-eventos.port'
import type { Relogio } from '../../domain/ports/relogio.port'
import { encerrarPendentes } from './orquestrar-consulta'

type Dependencias = { consultas: ConsultaRepositorio; eventos: PublicadorEventos; relogio: Relogio; prazoMs: number }

export class FinalizarConsultasPresas {
  constructor(private readonly deps: Dependencias) {}

  async executar(): Promise<number> {
    const limite = new Date(this.deps.relogio.agora() - this.deps.prazoMs)
    const presas = await this.deps.consultas.listarEmAndamentoAntesDe(limite)
    for (const consulta of presas) await encerrarPendentes(this.deps, consulta.id, this.deps.prazoMs)
    return presas.length
  }
}
