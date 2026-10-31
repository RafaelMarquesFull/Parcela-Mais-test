import type { Campo, Valores } from '../state/reducer'
import type { Erros } from '../state/validacao'
import { CampoMoeda } from './CampoMoeda'
import { SeletorCenario } from './SeletorCenario'

type Props = {
  valores: Valores
  erros: Erros
  simulacaoHabilitada: boolean
  aoAlterar<C extends Campo>(campo: C, valor: Valores[C]): void
  aoTocar(campo: Campo): void
}

export function PassoValores({ valores, erros, simulacaoHabilitada, aoAlterar, aoTocar }: Props) {
  return (
    <div className="grid gap-5">
      <CampoMoeda
        id="rendaMensal"
        rotulo="Renda mensal"
        centavos={valores.rendaMensal}
        erro={erros.rendaMensal}
        aoAlterar={v => aoAlterar('rendaMensal', v)}
        aoSair={() => aoTocar('rendaMensal')}
      />
      <CampoMoeda
        id="valorTratamento"
        rotulo="Valor do tratamento"
        centavos={valores.valorTratamento}
        erro={erros.valorTratamento}
        dica="Entre R$ 1.000,00 e R$ 50.000,00"
        aoAlterar={v => aoAlterar('valorTratamento', v)}
        aoSair={() => aoTocar('valorTratamento')}
      />
      {simulacaoHabilitada && <SeletorCenario valor={valores.cenario} aoAlterar={v => aoAlterar('cenario', v)} />}
    </div>
  )
}
