import type { ListagemInput, PaginaConsultas } from 'shared'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'

export class ListarConsultas {
  constructor(private readonly consultas: ConsultaRepositorio) {}

  async executar(usuarioId: string, filtro: ListagemInput): Promise<PaginaConsultas> {
    const { itens, total } = await this.consultas.listar(usuarioId, filtro)
    return { itens, total, pagina: filtro.pagina, porPagina: filtro.porPagina }
  }
}
