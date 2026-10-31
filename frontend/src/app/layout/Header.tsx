import { LogOut } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { AlternadorTema } from './AlternadorTema'

type Props = { usuario?: { nome: string } | null; aoSair?: () => void }

export function Header({ usuario, aoSair }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">P+</span>
        Parcela Mais
      </Link>
      <div className="flex items-center gap-1">
        {usuario && <span className="mr-2 hidden text-sm text-muted-foreground sm:inline">{usuario.nome}</span>}
        <AlternadorTema />
        {usuario && aoSair && (
          <Button variant="ghost" size="icon" onClick={aoSair} aria-label="Sair" title="Sair">
            <LogOut />
          </Button>
        )}
      </div>
    </header>
  )
}
