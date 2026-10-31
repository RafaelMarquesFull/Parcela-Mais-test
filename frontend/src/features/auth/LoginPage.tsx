import { Navigate, useLocation, useNavigate } from 'react-router'
import { AlternadorTema } from '@/app/layout/AlternadorTema'
import { Marca } from '@/components/Marca'
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
    <div className="flex min-h-dvh flex-col text-foreground">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Marca />
        <AlternadorTema />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="passo-entrar w-full max-w-md gap-6 rounded-2xl px-2 py-8 shadow-xl shadow-black/10 dark:shadow-black/40">
          <CardHeader className="gap-4">
            <Marca tamanho="lg" />
            <div className="grid gap-1.5">
              <CardTitle className="text-2xl font-semibold tracking-tight">Entrar na clínica</CardTitle>
              <CardDescription className="text-base">Use o acesso da clínica para consultar as financeiras.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormularioLogin
              aoEntrar={async entrada => {
                await entrar(entrada)
                navigate(destino, { replace: true })
              }}
            />
            <p className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
              Precisa de suporte?{' '}
              <a href="mailto:suporte@parcelamais.com" className="font-medium text-primary hover:underline">
                Fale conosco
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">© 2026 Parcela Mais. Todos os direitos reservados.</footer>
    </div>
  )
}
