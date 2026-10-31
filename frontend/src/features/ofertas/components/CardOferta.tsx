import { Loader2 } from 'lucide-react'
import { formatarMoeda } from 'shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { nomeFinanceira } from '@/features/consulta/nomes'
import type { OfertaPlana } from '../ordenar'
import { AvisoValorMenor } from './AvisoValorMenor'

type Props = { oferta: OfertaPlana; valorTratamento: number; indice: number; escolhendo: boolean; aoEscolher(): void }

export function CardOferta({ oferta, valorTratamento, indice, escolhendo, aoEscolher }: Props) {
  const parcial = oferta.valorAprovado < valorTratamento
  return (
    <Card className="oferta-entrar" style={{ '--i': indice } as React.CSSProperties}>
      <CardHeader className="flex flex-row items-baseline justify-between space-y-0">
        <CardTitle className="text-base">
          {nomeFinanceira[oferta.financeira]} · {oferta.prazoMeses}x
        </CardTitle>
        <span className="text-xs text-muted-foreground">{(oferta.taxaMensal / 100).toFixed(2).replace('.', ',')}% a.m.</span>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tracking-tight">{formatarMoeda(oferta.valorParcela)}</span>
          <span className="text-sm text-muted-foreground">por mês</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 text-sm">
          <dt className="text-muted-foreground">Valor aprovado</dt>
          <dd className="text-right">{formatarMoeda(oferta.valorAprovado)}</dd>
          <dt className="text-muted-foreground">Total pago</dt>
          <dd className="text-right">{formatarMoeda(oferta.totalPago)}</dd>
        </dl>
        {parcial && <AvisoValorMenor valorAprovado={oferta.valorAprovado} valorTratamento={valorTratamento} />}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={aoEscolher} disabled={escolhendo}>
          {escolhendo && <Loader2 className="animate-spin" />}
          Escolher esta oferta
        </Button>
      </CardFooter>
    </Card>
  )
}
