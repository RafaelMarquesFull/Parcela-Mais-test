import { Home, List, PlusCircle } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const itens = [
  { para: '/', rotulo: 'Início', Icone: Home, fim: true },
  { para: '/consultas/nova', rotulo: 'Nova consulta', Icone: PlusCircle, fim: false },
  { para: '/consultas', rotulo: 'Consultas', Icone: List, fim: true },
]

export function Sidebar() {
  return (
    <nav aria-label="Principal" className="flex gap-1 border-b border-border bg-sidebar px-2 py-2 md:w-52 md:flex-col md:border-r md:border-b-0 md:px-3 md:py-4">
      {itens.map(({ para, rotulo, Icone, fim }) => (
        <NavLink
          key={para}
          to={para}
          end={fim}
          className={({ isActive }) =>
            cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors md:flex-none md:justify-start',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
            )
          }
        >
          <Icone className="size-4 shrink-0" />
          <span className="hidden sm:inline">{rotulo}</span>
        </NavLink>
      ))}
    </nav>
  )
}
