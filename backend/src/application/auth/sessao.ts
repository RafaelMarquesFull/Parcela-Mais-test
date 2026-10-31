import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { EmissorToken } from '../../domain/ports/emissor-token.port'
import type { Hasher } from '../../domain/ports/hasher.port'
import type { RefreshTokenRepositorio } from '../../domain/ports/refresh-token.repository'
import type { Relogio } from '../../domain/ports/relogio.port'
import type { UsuarioRepositorio } from '../../domain/ports/usuario.repository'

export const DURACAO_REFRESH_MS = 7 * 24 * 60 * 60 * 1000

export type DependenciasSessao = {
  usuarios: UsuarioRepositorio
  refreshTokens: RefreshTokenRepositorio
  hasher: Hasher
  emissor: EmissorToken
  relogio: Relogio
}

export type Sessao = { accessToken: string; refreshToken: string }

export function hashDeRefresh(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function emitirSessao(deps: DependenciasSessao, usuario: { id: string; nome: string }, familiaId: string = randomUUID()): Promise<Sessao> {
  const refreshToken = randomBytes(32).toString('base64url')
  await deps.refreshTokens.criar({
    usuarioId: usuario.id,
    hash: hashDeRefresh(refreshToken),
    familiaId,
    expiraEm: new Date(deps.relogio.agora() + DURACAO_REFRESH_MS),
    usadoEm: null,
    revogadoEm: null,
  })
  return { accessToken: deps.emissor.emitir({ sub: usuario.id, nome: usuario.nome }), refreshToken }
}
