import { Moon, Sun } from 'lucide-react'
import { useTema } from '../theme/useTema'

export function AlternadorTema() {
  const { tema, alternar } = useTema()
  const escuro = tema === 'escuro'
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
