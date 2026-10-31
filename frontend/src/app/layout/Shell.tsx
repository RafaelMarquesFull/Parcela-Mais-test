import { Outlet } from 'react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

type Props = { usuario?: { nome: string } | null; aoSair?: () => void }

export function Shell({ usuario, aoSair }: Props) {
  return (
    <div className="flex min-h-dvh flex-col text-foreground md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header usuario={usuario} aoSair={aoSair} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
