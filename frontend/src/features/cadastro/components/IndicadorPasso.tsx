import type { Passo } from '../state/reducer'

const rotulos: Record<Passo, string> = { 1: 'Dados do paciente', 2: 'Valores' }

export function IndicadorPasso({ passo }: { passo: Passo }) {
  return (
    <div className="flex items-center gap-3 text-sm" aria-label={`Passo ${passo} de 2`}>
      {([1, 2] as Passo[]).map(p => (
        <div key={p} className="flex items-center gap-2">
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              p <= passo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {p}
          </span>
          <span className={p === passo ? 'font-medium' : 'text-muted-foreground'}>{rotulos[p]}</span>
          {p === 1 && <span className="mx-1 h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  )
}
