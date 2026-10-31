import { LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Marca } from '@/components/Marca'
import { Button } from '@/components/ui/button'
import { AlternadorTema } from './AlternadorTema'

type Props = { usuario?: { nome: string } | null; aoSair?: () => void }

function trilha(caminho: string): [string, string] {
  if (caminho === '/consultas/nova') return ['Consultas', 'Nova consulta']
  if (caminho === '/consultas') return ['Consultas', 'Todas']
  if (caminho.startsWith('/consultas/')) return ['Consultas', 'Detalhe']
  return ['Painel geral', 'Visão geral']
}

export function Header({ usuario, aoSair }: Props) {
  const [secao, pagina] = trilha(useLocation().pathname)
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6 md:h-20">
      <div className="flex items-center gap-4">
        <Link to="/" className="rounded-md md:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Marca />
        </Link>
        <nav aria-label="Trilha" className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
          <span>{secao}</span>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{pagina}</span>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        {usuario && (
          <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium sm:inline-flex">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
            {usuario.nome}
          </span>
        )}
        <AlternadorTema />
        {usuario && aoSair && (
          <Button variant="outline" size="icon" className="size-10 rounded-full" onClick={aoSair} aria-label="Sair" title="Sair">
            <LogOut />
          </Button>
        )}
      </div>
    </header>
  )
}
