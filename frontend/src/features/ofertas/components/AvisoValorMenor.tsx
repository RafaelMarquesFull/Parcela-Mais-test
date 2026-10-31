import { Info } from 'lucide-react'
import { formatarMoeda } from 'shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AvisoValorMenor({ valorAprovado, valorTratamento }: { valorAprovado: number; valorTratamento: number }) {
  return (
    <Alert>
      <Info />
      <AlertTitle>Valor aprovado menor que o tratamento</AlertTitle>
      <AlertDescription>
        Esta financeira aprovou {formatarMoeda(valorAprovado)} de {formatarMoeda(valorTratamento)}. Faltariam {formatarMoeda(valorTratamento - valorAprovado)}.
      </AlertDescription>
    </Alert>
  )
}
