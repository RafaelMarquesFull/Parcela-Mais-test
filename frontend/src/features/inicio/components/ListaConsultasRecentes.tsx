import { Link } from 'react-router'
import { formatarMoeda, type ConsultaResumo } from 'shared'
import { Badge } from '@/components/ui/badge'

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function resumoStatus(c: ConsultaResumo) {
  if (c.status === 'em_andamento') return { texto: 'Em andamento', classe: 'bg-muted text-muted-foreground' }
  if (c.aprovadas === 0) return { texto: 'Sem ofertas', classe: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' }
  return { texto: `${c.aprovadas} aprovada${c.aprovadas > 1 ? 's' : ''}`, classe: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400' }
}

export function ListaConsultasRecentes({ consultas, carregando }: { consultas: ConsultaResumo[]; carregando: boolean }) {
  if (carregando) return <p className="text-sm text-muted-foreground">Carregando consultas…</p>
  if (consultas.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma consulta ainda. A primeira aparece aqui assim que for feita.</p>
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {consultas.map(c => {
        const status = resumoStatus(c)
        return (
          <li key={c.id}>
            <Link to={`/consultas/${c.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[1fr_auto_auto_auto]">
              <span className="truncate font-medium">{c.pacienteNome}</span>
              <span className="text-right text-sm tabular-nums sm:order-3">{formatarMoeda(c.valorTratamento)}</span>
              <span className="text-sm text-muted-foreground sm:order-2">{dataCurta.format(new Date(c.criadaEm))}</span>
              <Badge variant="secondary" className={`justify-self-end border-transparent sm:order-4 ${status.classe}`}>
                {status.texto}
              </Badge>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
