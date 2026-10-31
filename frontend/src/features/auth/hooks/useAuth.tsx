import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LoginInput, UsuarioResposta } from 'shared'
import { login, logout } from '@/services/auth.api'
import { definirToken, renovarToken } from '@/services/http'

type ContextoAuth = {
  usuario: UsuarioResposta | null
  carregando: boolean
  entrar(entrada: LoginInput): Promise<void>
  sair(): Promise<void>
}

const Contexto = createContext<ContextoAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResposta | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    renovarToken()
      .then(sessao => {
        if (ativo) setUsuario(sessao?.usuario ?? null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    const aoEncerrar = () => setUsuario(null)
    window.addEventListener('sessao-encerrada', aoEncerrar)
    return () => {
      ativo = false
      window.removeEventListener('sessao-encerrada', aoEncerrar)
    }
  }, [])

  const entrar = useCallback(async (entrada: LoginInput) => {
    const sessao = await login(entrada)
    definirToken(sessao.accessToken)
    setUsuario(sessao.usuario)
  }, [])

  const sair = useCallback(async () => {
    await logout().catch(() => undefined)
    definirToken(null)
    setUsuario(null)
  }, [])

  const valor = useMemo(() => ({ usuario, carregando, entrar, sair }), [usuario, carregando, entrar, sair])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return contexto
}
