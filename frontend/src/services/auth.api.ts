import type { LoginInput, LoginResposta } from 'shared'
import { requisitar } from './http'

export function login(entrada: LoginInput): Promise<LoginResposta> {
  return requisitar('/auth/login', { method: 'POST', body: JSON.stringify(entrada) })
}

export function logout(): Promise<void> {
  return requisitar('/auth/logout', { method: 'POST' })
}
