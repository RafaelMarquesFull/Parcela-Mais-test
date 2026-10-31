import type { ConsultaResumo } from 'shared'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'

export class ListarConsultas {
  constructor(private readonly consultas: ConsultaRepositorio) {}

  executar(usuarioId: string): Promise<ConsultaResumo[]> {
    return this.consultas.listar(usuarioId)
  }
}
