import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { RotaProtegida } from './RotaProtegida'

const LoginPage = lazy(() => import('@/features/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const InicioPage = lazy(() => import('@/features/inicio/InicioPage').then(m => ({ default: m.InicioPage })))
const CadastroPage = lazy(() => import('@/features/cadastro/CadastroPage').then(m => ({ default: m.CadastroPage })))
const ConsultaPage = lazy(() => import('@/features/consulta/ConsultaPage').then(m => ({ default: m.ConsultaPage })))

function Pagina({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>{children}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/login', element: <Pagina><LoginPage /></Pagina> },
  {
    element: <RotaProtegida />,
    children: [
      { path: '/', element: <Pagina><InicioPage /></Pagina> },
      { path: '/consultas', element: <Pagina><InicioPage apenasLista /></Pagina> },
      { path: '/consultas/nova', element: <Pagina><CadastroPage /></Pagina> },
      { path: '/consultas/:id', element: <Pagina><ConsultaPage /></Pagina> },
    ],
  },
])
