import type { z } from 'zod'
import type { cenarioSchema } from '../schemas/cadastro.schema'
import type { financeiraSchema } from '../schemas/escolha.schema'
import type { OfertaPrazo } from '../price'

export type Cenario = z.infer<typeof cenarioSchema>
export type NomeFinanceira = z.infer<typeof financeiraSchema>
export type StatusResultado = 'consultando' | 'aprovada' | 'recusada' | 'indisponivel'
export type MotivoIndisponivel = 'regra' | 'erro' | 'timeout' | 'fila_cheia'
export type StatusConsulta = 'em_andamento' | 'finalizada'

export type ResultadoSnapshot = {
  financeira: NomeFinanceira
  status: StatusResultado
  motivo: MotivoIndisponivel | null
  valorAprovado: number | null
  taxaMensal: number | null
  duracaoMs: number | null
  ofertas: OfertaPrazo[]
}

export type EscolhaSnapshot = { financeira: NomeFinanceira; prazoMeses: number; valorParcela: number; totalPago: number }

export type PacienteSnapshot = { nome: string; cpfMascarado: string; dataNascimento: string; celular: string; rendaMensal: number }

export type ConsultaSnapshot = {
  id: string
  status: StatusConsulta
  valorTratamento: number
  cenario: Cenario
  criadaEm: string
  finalizadaEm: string | null
  paciente: PacienteSnapshot
  resultados: ResultadoSnapshot[]
  escolha: EscolhaSnapshot | null
}

export type ConsultaResumo = {
  id: string
  pacienteNome: string
  valorTratamento: number
  status: StatusConsulta
  aprovadas: number
  criadaEm: string
}

export type EventoResultado = { tipo: 'resultado'; resultado: ResultadoSnapshot }
export type EventoFinalizada = { tipo: 'consulta-finalizada'; status: StatusConsulta; finalizadaEm: string }
export type EventoConsulta = EventoResultado | EventoFinalizada

export type ConfigResposta = { simulacaoHabilitada: boolean }
export type LoginResposta = { accessToken: string; usuario: { nome: string } }
export type ErroResposta = { mensagem: string; erros?: { campo: string; mensagem: string }[] }
