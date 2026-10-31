import { Home, List, PlusCircle } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { Marca } from '@/components/Marca'
import { cn } from '@/lib/utils'

const itens = [
  { para: '/', rotulo: 'Início', Icone: Home, fim: true },
  { para: '/consultas/nova', rotulo: 'Nova consulta', Icone: PlusCircle, fim: false },
  { para: '/consultas', rotulo: 'Consultas', Icone: List, fim: true },
]

const parceiros = ['Alfa', 'Beta', 'Gama', 'Delta']

export function Sidebar() {
  return (
    <aside className="flex flex-col border-b border-border bg-sidebar md:w-64 md:border-r md:border-b-0">
      <div className="hidden h-20 items-center border-b border-border px-6 md:flex">
        <Link to="/" className="rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Marca tamanho="lg" />
        </Link>
      </div>
      <nav aria-label="Principal" className="flex gap-1 px-2 py-2 md:flex-col md:px-4 md:py-5">
        {itens.map(({ para, rotulo, Icone, fim }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) =>
              cn(
                'flex flex-1 items-center justify-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-sm text-sidebar-foreground transition-colors md:flex-none md:justify-start',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                isActive && 'border-primary/25 bg-sidebar-accent font-medium text-sidebar-accent-foreground',
              )
            }
          >
            <Icone className="size-[18px] shrink-0" />
            <span className="hidden sm:inline">{rotulo}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto hidden p-4 md:block">
        <div className="rounded-xl border border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <span className="rotulo">Parceiros</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{parceiros.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {parceiros.map(p => (
              <span key={p} className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
