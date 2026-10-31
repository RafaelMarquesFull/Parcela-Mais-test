import type { ConsultaResumo } from 'shared'
import type { Consulta, NovaConsulta } from '../entities/consulta'
import type { Escolha, NovaEscolha } from '../entities/escolha'
import type { NovoResultado, ResultadoFinanceira } from '../entities/resultado-financeira'

export interface ConsultaRepositorio {
  criar(dados: NovaConsulta): Promise<Consulta>
  buscarPorId(id: string): Promise<Consulta | null>
  buscarPorChave(chave: string): Promise<Consulta | null>
  listar(usuarioId: string): Promise<ConsultaResumo[]>
  resultados(consultaId: string): Promise<ResultadoFinanceira[]>
  gravarResultado(dados: NovoResultado): Promise<ResultadoFinanceira>
  finalizar(id: string, finalizadaEm: Date): Promise<void>
  escolha(consultaId: string): Promise<Escolha | null>
  gravarEscolha(dados: NovaEscolha): Promise<Escolha>
}
