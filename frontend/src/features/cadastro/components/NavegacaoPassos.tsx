import { ArrowLeft, ArrowRight, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Passo } from '../state/reducer'

type Props = {
  passo: Passo
  podeAvancar: boolean
  enviando: boolean
  aoVoltar(): void
  aoAvancar(): void
}

export function NavegacaoPassos({ passo, podeAvancar, enviando, aoVoltar, aoAvancar }: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      {passo === 2 ? (
        <Button type="button" variant="outline" onClick={aoVoltar} disabled={enviando}>
          <ArrowLeft /> Voltar
        </Button>
      ) : (
        <span />
      )}
      {passo === 1 ? (
        <Button type="button" onClick={aoAvancar} disabled={!podeAvancar}>
          Avançar <ArrowRight />
        </Button>
      ) : (
        <Button type="submit" disabled={!podeAvancar || enviando}>
          {enviando ? <Loader2 className="animate-spin" /> : <Search />}
          Consultar financeiras
        </Button>
      )}
    </div>
  )
}
