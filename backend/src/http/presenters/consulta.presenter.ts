import { mascararCpf, type ConsultaSnapshot, type EscolhaSnapshot } from 'shared'
import { apresentarResultado } from '../../application/consultas/calcular-ofertas'
import type { ConsultaCompleta } from '../../application/consultas/obter-consulta'
import type { Escolha } from '../../domain/entities/escolha'
import type { ResultadoFinanceira } from '../../domain/entities/resultado-financeira'

export function apresentarEscolha(escolha: Escolha, resultados: ResultadoFinanceira[]): EscolhaSnapshot {
  const resultado = resultados.find(r => r.id === escolha.resultadoId)
  return {
    financeira: resultado?.financeira ?? 'alfa',
    prazoMeses: escolha.prazoMeses,
    valorParcela: escolha.valorParcela,
    totalPago: escolha.totalPago,
  }
}

export function apresentarConsulta({ consulta, paciente, resultados, escolha }: ConsultaCompleta): ConsultaSnapshot {
  return {
    id: consulta.id,
    status: consulta.status,
    valorTratamento: consulta.valorTratamento,
    cenario: consulta.cenario,
    criadaEm: consulta.criadaEm.toISOString(),
    finalizadaEm: consulta.finalizadaEm?.toISOString() ?? null,
    paciente: {
      nome: paciente.nome,
      cpfMascarado: mascararCpf(paciente.cpf),
      dataNascimento: paciente.dataNascimento,
      celular: paciente.celular,
      rendaMensal: paciente.rendaMensal,
    },
    resultados: resultados.map(apresentarResultado),
    escolha: escolha ? apresentarEscolha(escolha, resultados) : null,
  }
}
