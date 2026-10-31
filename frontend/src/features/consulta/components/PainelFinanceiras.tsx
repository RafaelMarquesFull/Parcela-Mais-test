import { Radio, RefreshCw } from 'lucide-react'
import type { ConsultaSnapshot } from 'shared'
import type { ModoEventos } from '../hooks/useEventosConsulta'
import { CardFinanceira } from './CardFinanceira'

const rotuloModo: Partial<Record<ModoEventos, { texto: string; Icone: typeof Radio }>> = {
  sse: { texto: 'Ao vivo', Icone: Radio },
  polling: { texto: 'Atualizando', Icone: RefreshCw },
}

export function PainelFinanceiras({ consulta, modo }: { consulta: ConsultaSnapshot; modo: ModoEventos }) {
  const respondidas = consulta.resultados.filter(r => r.status !== 'consultando').length
  const indicador = rotuloModo[modo]
  return (
    <section className="grid gap-4" aria-live="polite">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Consultando financeiras</h2>
          <p className="text-sm text-muted-foreground">
            {respondidas} de {consulta.resultados.length} responderam. Esperamos no máximo 10 segundos.
          </p>
        </div>
        {indicador && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <indicador.Icone className="size-3.5" /> {indicador.texto}
          </span>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {consulta.resultados.map(r => (
          <CardFinanceira key={r.financeira} resultado={r} />
        ))}
      </div>
    </section>
  )
}
