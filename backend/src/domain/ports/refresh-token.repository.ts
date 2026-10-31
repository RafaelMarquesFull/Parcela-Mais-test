import type { NovoRefreshToken, RefreshToken } from '../entities/refresh-token'

export interface RefreshTokenRepositorio {
  criar(dados: NovoRefreshToken): Promise<RefreshToken>
  buscarPorHash(hash: string): Promise<RefreshToken | null>
  marcarUsado(id: string, quando: Date): Promise<void>
  revogarFamilia(familiaId: string, quando: Date): Promise<void>
}
