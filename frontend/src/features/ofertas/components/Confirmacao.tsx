import { CheckCircle2, PlusCircle } from 'lucide-react'
import { formatarMoeda, type ConsultaSnapshot } from 'shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { nomeFinanceira } from '@/features/consulta/nomes'

export function Confirmacao({ consulta, aoNovaConsulta }: { consulta: ConsultaSnapshot; aoNovaConsulta(): void }) {
  const escolha = consulta.escolha
  if (!escolha) return null
  return (
    <Card className="passo-entrar">
      <CardHeader>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 />
          <CardTitle>Oferta escolhida</CardTitle>
        </div>
        <CardDescription>Registramos a escolha de {consulta.paciente.nome}.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Financeira</dt>
          <dd className="text-right font-medium">{nomeFinanceira[escolha.financeira]}</dd>
          <dt className="text-muted-foreground">Parcelas</dt>
          <dd className="text-right font-medium">
            {escolha.prazoMeses}x de {formatarMoeda(escolha.valorParcela)}
          </dd>
          <dt className="text-muted-foreground">Total pago</dt>
          <dd className="text-right font-medium">{formatarMoeda(escolha.totalPago)}</dd>
          <dt className="text-muted-foreground">Valor do tratamento</dt>
          <dd className="text-right">{formatarMoeda(consulta.valorTratamento)}</dd>
        </dl>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={aoNovaConsulta}>
          <PlusCircle /> Nova consulta
        </Button>
      </CardFooter>
    </Card>
  )
}
