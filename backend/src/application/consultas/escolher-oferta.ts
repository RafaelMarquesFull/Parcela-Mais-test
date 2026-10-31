import { calcularOferta, type EscolhaInput } from 'shared'
import type { Escolha } from '../../domain/entities/escolha'
import { ConsultaNaoEncontrada, EscolhaConflitante, OfertaInvalida } from '../../domain/errors/domain-error'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'

export class EscolherOferta {
  constructor(private readonly consultas: ConsultaRepositorio) {}

  async executar(consultaId: string, entrada: EscolhaInput): Promise<Escolha> {
    const consulta = await this.consultas.buscarPorId(consultaId)
    if (!consulta) throw new ConsultaNaoEncontrada()

    const resultado = (await this.consultas.resultados(consultaId)).find(r => r.financeira === entrada.financeira)
    if (!resultado || resultado.status !== 'aprovada' || resultado.valorAprovado === null || resultado.taxaMensal === null) {
      throw new OfertaInvalida('Esta financeira não aprovou a consulta')
    }
    if (!resultado.prazos.includes(entrada.prazoMeses)) throw new OfertaInvalida('Prazo não oferecido por esta financeira')

    const existente = await this.consultas.escolha(consultaId)
    if (existente) {
      if (existente.resultadoId === resultado.id && existente.prazoMeses === entrada.prazoMeses) return existente
      throw new EscolhaConflitante()
    }

    const oferta = calcularOferta(resultado.valorAprovado, resultado.taxaMensal, entrada.prazoMeses)
    return this.consultas.gravarEscolha({
      consultaId,
      resultadoId: resultado.id,
      prazoMeses: oferta.prazoMeses,
      valorParcela: oferta.valorParcela,
      totalPago: oferta.totalPago,
    })
  }
}
