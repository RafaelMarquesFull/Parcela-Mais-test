import type { NomeFinanceira } from 'shared'
import type { Consulta } from '../../domain/entities/consulta'
import type { DadosPaciente, Paciente } from '../../domain/entities/paciente'
import type { NovoResultado } from '../../domain/entities/resultado-financeira'
import type { ConsultaRepositorio } from '../../domain/ports/consulta.repository'
import type { Financeira, RespostaFinanceira } from '../../domain/ports/financeira.port'
import type { PublicadorEventos } from '../../domain/ports/publicador-eventos.port'
import type { Relogio } from '../../domain/ports/relogio.port'
import type { LimitadorDeConcorrencia } from '../../infra/financeiras/limitador-concorrencia'
import { apresentarResultado } from './calcular-ofertas'

type Dependencias = {
  financeiras: Financeira[]
  limitadores: Record<NomeFinanceira, LimitadorDeConcorrencia>
  consultas: ConsultaRepositorio
  eventos: PublicadorEventos
  relogio: Relogio
  prazoMs: number
}

type Desfecho = Pick<NovoResultado, 'status' | 'motivo' | 'valorAprovado' | 'taxaMensal' | 'prazos'>

const consultando: Desfecho = { status: 'consultando', motivo: null, valorAprovado: null, taxaMensal: null, prazos: [] }
const indisponivel = (motivo: NovoResultado['motivo']): Desfecho => ({ ...consultando, status: 'indisponivel', motivo })

export class OrquestradorDeConsulta {
  constructor(private readonly deps: Dependencias) {}

  async prepararResultados(consultaId: string): Promise<void> {
    for (const financeira of this.deps.financeiras) {
      await this.deps.consultas.gravarResultado({ consultaId, financeira: financeira.nome, ...consultando, duracaoMs: null, respondidoEm: null })
    }
  }

  async executar(consulta: Consulta, paciente: Paciente): Promise<void> {
    const { financeiras, consultas, eventos, relogio, prazoMs } = this.deps
    const dados: DadosPaciente = { ...paciente, valorTratamento: consulta.valorTratamento }
    const inicio = relogio.agora()
    let encerrada = false

    if ((await consultas.resultados(consulta.id)).length === 0) await this.prepararResultados(consulta.id)

    const registrar = async (financeira: NomeFinanceira, desfecho: Desfecho, inicioChamada: number) => {
      if (encerrada) return
      const agora = relogio.agora()
      const gravado = await consultas.gravarResultado({
        consultaId: consulta.id,
        financeira,
        ...desfecho,
        duracaoMs: agora - inicioChamada,
        respondidoEm: new Date(agora),
      })
      eventos.publicar(consulta.id, { tipo: 'resultado', resultado: apresentarResultado(gravado) })
    }

    const consultar = async (financeira: Financeira) => {
      const inicioChamada = relogio.agora()
      const restante = prazoMs - (inicioChamada - inicio)
      const liberar = await this.deps.limitadores[financeira.nome].adquirir(restante)
      if (liberar === null) return registrar(financeira.nome, indisponivel('fila_cheia'), inicioChamada)
      try {
        const resposta = await financeira.consultar(dados, consulta.cenario)
        await registrar(financeira.nome, desfechoDe(resposta), inicioChamada)
      } catch {
        await registrar(financeira.nome, indisponivel('erro'), inicioChamada)
      } finally {
        liberar()
      }
    }

    await Promise.race([Promise.all(financeiras.map(consultar)), relogio.esperar(prazoMs)])
    encerrada = true

    const pendentes = (await consultas.resultados(consulta.id)).filter(r => r.status === 'consultando')
    for (const pendente of pendentes) {
      const gravado = await consultas.gravarResultado({ ...pendente, ...indisponivel('timeout'), duracaoMs: prazoMs, respondidoEm: new Date(relogio.agora()) })
      eventos.publicar(consulta.id, { tipo: 'resultado', resultado: apresentarResultado(gravado) })
    }

    const finalizadaEm = new Date(relogio.agora())
    await consultas.finalizar(consulta.id, finalizadaEm)
    eventos.publicar(consulta.id, { tipo: 'consulta-finalizada', status: 'finalizada', finalizadaEm: finalizadaEm.toISOString() })
  }
}

function desfechoDe(resposta: RespostaFinanceira): Desfecho {
  if (!resposta.aprovada) return { ...consultando, status: 'recusada', motivo: 'regra' }
  return { status: 'aprovada', motivo: null, valorAprovado: resposta.valorAprovado, taxaMensal: resposta.taxaMensal, prazos: resposta.prazos }
}
