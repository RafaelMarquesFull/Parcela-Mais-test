import { formatarMoeda, type ResultadoSnapshot } from 'shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { descricaoMotivo, nomeFinanceira } from '../nomes'
import { StatusFinanceira } from './StatusFinanceira'

function taxa(pontosBase: number) {
  return `${(pontosBase / 100).toFixed(2).replace('.', ',')}% ao mês`
}

export function CardFinanceira({ resultado }: { resultado: ResultadoSnapshot }) {
  return (
    <Card className="card-status" data-status={resultado.status}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{nomeFinanceira[resultado.financeira]}</CardTitle>
        <StatusFinanceira key={resultado.status} status={resultado.status} />
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {resultado.status === 'consultando' && <p>Aguardando resposta…</p>}
        {resultado.status === 'aprovada' && resultado.valorAprovado !== null && resultado.taxaMensal !== null && (
          <p>
            <span className="font-medium text-foreground">{formatarMoeda(resultado.valorAprovado)}</span> a {taxa(resultado.taxaMensal)}
          </p>
        )}
        {resultado.status === 'recusada' && <p>Recusou pela política de crédito.</p>}
        {resultado.status === 'indisponivel' && resultado.motivo && <p>A financeira {descricaoMotivo[resultado.motivo]}.</p>}
        {resultado.duracaoMs !== null && <p className="mt-1 text-xs">Respondeu em {(resultado.duracaoMs / 1000).toFixed(1)} s</p>}
      </CardContent>
    </Card>
  )
}
