import { Eye, EyeOff, Loader2, LogIn, Lock, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { loginSchema, type LoginInput } from 'shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CampoTexto } from '@/features/cadastro/components/CampoTexto'

type Props = { aoEntrar(entrada: LoginInput): Promise<void> }

export function FormularioLogin({ aoEntrar }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const entrada = loginSchema.safeParse({ email, senha })
    if (!entrada.success) return setErro(entrada.error.issues[0]?.message ?? 'Dados inválidos')
    setEnviando(true)
    setErro(null)
    try {
      await aoEntrar(entrada.data)
    } catch (erroEnvio) {
      setErro(erroEnvio instanceof Error ? erroEnvio.message : 'Não foi possível entrar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form noValidate onSubmit={enviar} className="grid gap-5">
      <CampoTexto id="email" rotulo="E-mail" valor={email} type="email" autoComplete="username" autoFocus icone={<Mail />} aoAlterar={setEmail} aoSair={() => {}} />
      <CampoTexto
        id="senha"
        rotulo="Senha"
        valor={senha}
        type={mostrarSenha ? 'text' : 'password'}
        autoComplete="current-password"
        icone={<Lock />}
        acao={
          <button
            type="button"
            onClick={() => setMostrarSenha(v => !v)}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        aoAlterar={setSenha}
        aoSair={() => {}}
      />
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" className="botao-brilho h-12 text-base" disabled={enviando}>
        {enviando ? <Loader2 className="animate-spin" /> : <LogIn />}
        Entrar
      </Button>
    </form>
  )
}
