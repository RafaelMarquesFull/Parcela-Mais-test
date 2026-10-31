import type { FastifyInstance } from 'fastify'
import { usuarioSemeado } from './banco-temporario'

export async function autenticarParaTeste(app: FastifyInstance): Promise<{ bearer: string; cookie: string }> {
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: usuarioSemeado.email, senha: usuarioSemeado.senha } })
  return { bearer: `Bearer ${res.json().accessToken}`, cookie: String(res.headers['set-cookie']).split(';')[0]! }
}
