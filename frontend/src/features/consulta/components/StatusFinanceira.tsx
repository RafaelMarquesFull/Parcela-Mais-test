import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { StatusResultado } from 'shared'
import { Badge } from '@/components/ui/badge'
import { rotuloStatus } from '../nomes'

const estilo: Record<StatusResultado, string> = {
  consultando: 'bg-muted text-muted-foreground',
  aprovada: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  recusada: 'bg-destructive/10 text-destructive',
  indisponivel: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
}

const icone: Record<StatusResultado, typeof Loader2> = { consultando: Loader2, aprovada: CheckCircle2, recusada: XCircle, indisponivel: AlertTriangle }

export function StatusFinanceira({ status }: { status: StatusResultado }) {
  const Icone = icone[status]
  return (
    <Badge variant="secondary" className={`status-trocar gap-1 border-transparent ${estilo[status]}`}>
      <Icone className={status === 'consultando' ? 'animate-spin' : ''} />
      {rotuloStatus[status]}
    </Badge>
  )
}
