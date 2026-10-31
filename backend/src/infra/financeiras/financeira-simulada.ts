import type { Cenario, NomeFinanceira } from 'shared'
import type { DadosPaciente } from '../../domain/entities/paciente'
import type { Financeira, RespostaFinanceira } from '../../domain/ports/financeira.port'
import { comportamento, type Comportamento } from './cenarios'
import type { SimuladorLatencia } from './simulador-latencia'

export abstract class FinanceiraSimulada implements Financeira {
  abstract readonly nome: NomeFinanceira
  protected abstract readonly taxaMensal: number
  protected abstract readonly prazos: number[]
  protected abstract readonly latenciaMs: [number, number]

  constructor(protected readonly latencia: SimuladorLatencia) {}

  async consultar(paciente: DadosPaciente, cenario: Cenario): Promise<RespostaFinanceira> {
    const regra = comportamento(cenario, this.nome)
    const [min, max] = this.latenciaMs
    await (regra.latenciaMs === undefined ? this.latencia.esperarEntre(min, max) : this.latencia.esperarExato(regra.latenciaMs))
    if (regra.forcarErro) throw new Error(`${this.nome} indisponível`)
    if (regra.forcarRecusa) return { aprovada: false }
    if (regra.forcarAprovacao) return this.aprovar(paciente.valorTratamento)
    return this.avaliar(paciente, regra)
  }

  protected aprovar(valorAprovado: number): RespostaFinanceira {
    return { aprovada: true, valorAprovado, taxaMensal: this.taxaMensal, prazos: this.prazos }
  }

  protected abstract avaliar(paciente: DadosPaciente, regra: Comportamento): RespostaFinanceira
}
