import { Loader2, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { loginSchema, type LoginInput } from 'shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = { aoEntrar(entrada: LoginInput): Promise<void> }

export function FormularioLogin({ aoEntrar }: Props) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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
      <div className="grid gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="username" autoFocus value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} />
      </div>
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={enviando}>
        {enviando ? <Loader2 className="animate-spin" /> : <LogIn />}
        Entrar
      </Button>
    </form>
  )
}
