import { Outlet } from 'react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

type Props = { usuario?: { nome: string } | null; aoSair?: () => void }

export function Shell({ usuario, aoSair }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header usuario={usuario} aoSair={aoSair} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
