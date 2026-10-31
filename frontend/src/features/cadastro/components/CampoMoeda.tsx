import { Banknote } from 'lucide-react'
import { useState } from 'react'
import { formatarMoeda, moedaParaCentavos } from 'shared'
import { CampoTexto } from './CampoTexto'

type Props = {
  id: string
  rotulo: string
  centavos: number | null
  erro?: string
  dica?: string
  aoAlterar(centavos: number | null): void
  aoSair(): void
}

export function CampoMoeda({ id, rotulo, centavos, erro, dica, aoAlterar, aoSair }: Props) {
  const [texto, setTexto] = useState(centavos === null ? '' : formatarMoeda(centavos))
  return (
    <CampoTexto
      id={id}
      rotulo={rotulo}
      valor={texto}
      erro={erro}
      dica={dica}
      icone={<Banknote />}
      inputMode="decimal"
      placeholder="R$ 0,00"
      aoAlterar={v => {
        setTexto(v)
        aoAlterar(v.trim() === '' ? null : moedaParaCentavos(v))
      }}
      aoSair={() => {
        if (centavos !== null) setTexto(formatarMoeda(centavos))
        aoSair()
      }}
    />
  )
}
