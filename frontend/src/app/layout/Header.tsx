import { LogOut } from 'lucide-react'
import { Link } from 'react-router'
import { Marca } from '@/components/Marca'
import { Button } from '@/components/ui/button'
import { AlternadorTema } from './AlternadorTema'

type Props = { usuario?: { nome: string } | null; aoSair?: () => void }

export function Header({ usuario, aoSair }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <Link to="/" className="rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Marca />
      </Link>
      <div className="flex items-center gap-2">
        {usuario && <span className="mr-1 hidden text-sm text-muted-foreground sm:inline">{usuario.nome}</span>}
        <AlternadorTema />
        {usuario && aoSair && (
          <Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={aoSair} aria-label="Sair" title="Sair">
            <LogOut />
          </Button>
        )}
      </div>
    </header>
  )
}
