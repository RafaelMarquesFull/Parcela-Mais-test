import type { MetricasConsultas } from 'shared'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'
import type { Relogio } from '../../domain/ports/relogio.port'

const DIA_MS = 24 * 60 * 60 * 1000

export class ObterMetricas {
  constructor(
    private readonly consultas: ConsultaRepositorio,
    private readonly relogio: Relogio,
  ) {}

  executar(usuarioId: string): Promise<MetricasConsultas> {
    const inicioHoje = new Date(this.relogio.agora())
    inicioHoje.setHours(0, 0, 0, 0)
    const inicioOntem = new Date(inicioHoje.getTime() - DIA_MS)
    return this.consultas.metricas(usuarioId, { inicioHoje, inicioOntem })
  }
}
