import { calcularOferta, type EscolhaInput } from 'shared'
import type { Escolha } from '../../domain/entities/escolha'
import { ConsultaNaoEncontrada, EscolhaConflitante, OfertaInvalida } from '../../domain/errors/domain-error'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'

export class EscolherOferta {
  constructor(private readonly consultas: ConsultaRepositorio) {}

  async executar(consultaId: string, usuarioId: string, entrada: EscolhaInput): Promise<Escolha> {
    const consulta = await this.consultas.buscarPorId(consultaId)
    if (!consulta || consulta.usuarioId !== usuarioId) throw new ConsultaNaoEncontrada()

    const resultado = (await this.consultas.resultados(consultaId)).find(r => r.financeira === entrada.financeira)
    if (!resultado || resultado.status !== 'aprovada' || resultado.valorAprovado === null || resultado.taxaMensal === null) {
      throw new OfertaInvalida('Esta financeira não aprovou a consulta')
    }
    if (!resultado.prazos.includes(entrada.prazoMeses)) throw new OfertaInvalida('Prazo não oferecido por esta financeira')

    const existente = await this.consultas.escolha(consultaId)
    if (existente) return this.conferir(existente, resultado.id, entrada.prazoMeses)

    const oferta = calcularOferta(resultado.valorAprovado, resultado.taxaMensal, entrada.prazoMeses)
    try {
      return await this.consultas.gravarEscolha({
        consultaId,
        resultadoId: resultado.id,
        prazoMeses: oferta.prazoMeses,
        valorParcela: oferta.valorParcela,
        totalPago: oferta.totalPago,
      })
    } catch (erro) {
      const concorrente = await this.consultas.escolha(consultaId)
      if (!concorrente) throw erro
      return this.conferir(concorrente, resultado.id, entrada.prazoMeses)
    }
  }

  private conferir(existente: Escolha, resultadoId: string, prazoMeses: number): Escolha {
    if (existente.resultadoId === resultadoId && existente.prazoMeses === prazoMeses) return existente
    throw new EscolhaConflitante()
  }
}
