import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Shell } from './layout/Shell'

export function RotaProtegida() {
  const { usuario, carregando, sair } = useAuth()
  const location = useLocation()
  if (carregando) return <div className="min-h-dvh bg-background" aria-busy="true" />
  if (!usuario) return <Navigate to="/login" replace state={{ de: `${location.pathname}${location.search}` }} />
  return <Shell usuario={usuario} aoSair={() => void sair()} />
}
