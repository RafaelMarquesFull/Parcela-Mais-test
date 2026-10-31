import type { CadastroInput } from 'shared'
import type { Consulta } from '../../domain/entities/consulta'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'
import type { PacienteRepositorio } from '../../domain/ports/paciente.repository'
import type { OrquestradorDeConsulta } from './orquestrar-consulta'

type Dependencias = {
  consultas: ConsultaRepositorio
  pacientes: PacienteRepositorio
  orquestrador: OrquestradorDeConsulta
  simulacaoHabilitada: boolean
  registrarErro: (erro: unknown) => void
}

export class CriarConsulta {
  constructor(private readonly deps: Dependencias) {}

  async executar(usuarioId: string, chave: string, entrada: CadastroInput): Promise<{ id: string }> {
    const existente = await this.deps.consultas.buscarPorChave(chave)
    if (existente) return { id: existente.id }

    const { valorTratamento, cenario, ...dadosPaciente } = entrada
    const paciente = await this.deps.pacientes.criar(dadosPaciente)

    let consulta: Consulta
    try {
      consulta = await this.deps.consultas.criar({
        usuarioId,
        pacienteId: paciente.id,
        valorTratamento,
        cenario: this.deps.simulacaoHabilitada && cenario ? cenario : 'aleatorio',
        chaveIdempotencia: chave,
      })
    } catch (erro) {
      const concorrente = await this.deps.consultas.buscarPorChave(chave)
      if (concorrente) return { id: concorrente.id }
      throw erro
    }

    await this.deps.orquestrador.prepararResultados(consulta.id)
    this.deps.orquestrador.executar(consulta, paciente).catch(this.deps.registrarErro)
    return { id: consulta.id }
  }
}
