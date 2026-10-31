import { Navigate, useLocation, useNavigate } from 'react-router'
import { AlternadorTema } from '@/app/layout/AlternadorTema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormularioLogin } from './components/FormularioLogin'
import { useAuth } from './hooks/useAuth'

export function LoginPage() {
  const { usuario, carregando, entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { de?: string } | null)?.de ?? '/'

  if (carregando) return null
  if (usuario) return <Navigate to={destino} replace />

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-end px-4">
        <AlternadorTema />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="passo-entrar w-full max-w-sm">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">P+</span>
              Parcela Mais
            </div>
            <CardTitle>Entrar na clínica</CardTitle>
            <CardDescription>Use o acesso da clínica para consultar as financeiras.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioLogin
              aoEntrar={async entrada => {
                await entrar(entrada)
                navigate(destino, { replace: true })
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
