import type { RefreshToken as RefreshTokenLinha } from '@prisma/client'
import type { RefreshToken } from '../../../domain/entities/refresh-token'

export function paraRefreshToken(linha: RefreshTokenLinha): RefreshToken {
  return {
    id: linha.id,
    usuarioId: linha.usuarioId,
    hash: linha.hash,
    familiaId: linha.familiaId,
    expiraEm: linha.expiraEm,
    usadoEm: linha.usadoEm,
    revogadoEm: linha.revogadoEm,
  }
}
