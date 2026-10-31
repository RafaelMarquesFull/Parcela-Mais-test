import type { CadastroInput } from 'shared'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'
import type { Financeira } from '../../domain/ports/financeira.port'
import type { OrquestradorDeConsulta } from './orquestrar-consulta'

type Dependencias = {
  consultas: ConsultaRepositorio
  financeiras: Financeira[]
  orquestrador: OrquestradorDeConsulta
  simulacaoHabilitada: boolean
  registrarErro: (erro: unknown) => void
}

export class CriarConsulta {
  constructor(private readonly deps: Dependencias) {}

  async executar(usuarioId: string, chave: string, entrada: CadastroInput): Promise<{ id: string }> {
    const existente = await this.deps.consultas.buscarPorChave(usuarioId, chave)
    if (existente) return { id: existente.id }

    const { valorTratamento, cenario, ...dadosPaciente } = entrada
    const dadosConsulta = {
      usuarioId,
      valorTratamento,
      cenario: this.deps.simulacaoHabilitada && cenario ? cenario : ('aleatorio' as const),
      chaveIdempotencia: chave,
    }

    try {
      const { consulta, paciente } = await this.deps.consultas.criarCompleta(dadosPaciente, dadosConsulta, this.deps.financeiras.map(f => f.nome))
      this.deps.orquestrador.executar(consulta, paciente).catch(this.deps.registrarErro)
      return { id: consulta.id }
    } catch (erro) {
      const concorrente = await this.deps.consultas.buscarPorChave(usuarioId, chave)
      if (concorrente) return { id: concorrente.id }
      throw erro
    }
  }
}
