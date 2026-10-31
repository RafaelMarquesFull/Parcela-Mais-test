import { RotateCcw } from 'lucide-react'
import { formatarMoeda, type ConsultaSnapshot } from 'shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { descricaoMotivo, nomeFinanceira } from '@/features/consulta/nomes'

export function SemOfertas({ consulta, aoTentarValorMenor }: { consulta: ConsultaSnapshot; aoTentarValorMenor(): void }) {
  const sugerido = Math.round(consulta.valorTratamento * 0.8)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nenhuma financeira aprovou desta vez</CardTitle>
        <CardDescription>Veja o que cada uma respondeu e tente com um valor menor.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 text-sm">
          {consulta.resultados.map(r => (
            <li key={r.financeira} className="flex justify-between gap-4">
              <span className="font-medium">{nomeFinanceira[r.financeira]}</span>
              <span className="text-muted-foreground">{r.motivo ? descricaoMotivo[r.motivo] : 'sem resposta'}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={aoTentarValorMenor}>
          <RotateCcw /> Tentar com {formatarMoeda(sugerido)}
        </Button>
      </CardFooter>
    </Card>
  )
}
