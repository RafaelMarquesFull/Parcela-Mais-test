import type { Consulta } from '../../domain/entities/consulta'
import type { Escolha } from '../../domain/entities/escolha'
import type { Paciente } from '../../domain/entities/paciente'
import type { ResultadoFinanceira } from '../../domain/entities/resultado-financeira'
import { ConsultaNaoEncontrada } from '../../domain/errors/domain-error'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'
import type { PacienteRepositorio } from '../../domain/ports/paciente.repository'

export type ConsultaCompleta = { consulta: Consulta; paciente: Paciente; resultados: ResultadoFinanceira[]; escolha: Escolha | null }

export class ObterConsulta {
  constructor(
    private readonly consultas: ConsultaRepositorio,
    private readonly pacientes: PacienteRepositorio,
  ) {}

  async executar(id: string, usuarioId: string): Promise<ConsultaCompleta> {
    const consulta = await this.consultas.buscarPorId(id)
    if (!consulta || consulta.usuarioId !== usuarioId) throw new ConsultaNaoEncontrada()
    const paciente = await this.pacientes.buscarPorId(consulta.pacienteId)
    if (!paciente) throw new ConsultaNaoEncontrada()
    const [resultados, escolha] = await Promise.all([this.consultas.resultados(id), this.consultas.escolha(id)])
    return { consulta, paciente, resultados, escolha }
  }
}
