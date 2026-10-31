import type { ConsultaResumo, MetricasConsultas, NomeFinanceira } from 'shared'
import type { Consulta, NovaConsulta } from '../entities/consulta'
import type { Escolha, NovaEscolha } from '../entities/escolha'
import type { NovoResultado, ResultadoFinanceira } from '../entities/resultado-financeira'
import type { NovoPaciente, Paciente } from '../entities/paciente'

export type ConsultaCriada = { consulta: Consulta; paciente: Paciente }

export type FiltroListagem = { pagina: number; porPagina: number; busca?: string }
export type ListaPaginada = { itens: ConsultaResumo[]; total: number }
export type JanelaMetricas = { inicioHoje: Date; inicioOntem: Date }

export interface ConsultaRepositorio {
  criar(dados: NovaConsulta): Promise<Consulta>
  criarCompleta(paciente: NovoPaciente, consulta: Omit<NovaConsulta, 'pacienteId'>, financeiras: NomeFinanceira[]): Promise<ConsultaCriada>
  buscarPorId(id: string): Promise<Consulta | null>
  buscarPorChave(usuarioId: string, chave: string): Promise<Consulta | null>
  listarEmAndamentoAntesDe(limite: Date): Promise<Consulta[]>
  listar(usuarioId: string, filtro: FiltroListagem): Promise<ListaPaginada>
  metricas(usuarioId: string, janela: JanelaMetricas): Promise<MetricasConsultas>
  resultados(consultaId: string): Promise<ResultadoFinanceira[]>
  gravarResultado(dados: NovoResultado): Promise<ResultadoFinanceira>
  gravarResultados(lista: NovoResultado[]): Promise<void>
  concluirResultado(dados: NovoResultado): Promise<ResultadoFinanceira | null>
  finalizar(id: string, finalizadaEm: Date): Promise<void>
  escolha(consultaId: string): Promise<Escolha | null>
  gravarEscolha(dados: NovaEscolha): Promise<Escolha>
}
