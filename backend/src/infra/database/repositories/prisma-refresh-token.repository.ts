import type { PrismaClient } from '@prisma/client'
import type { NovoRefreshToken, RefreshToken } from '../../../domain/entities/refresh-token'
import type { RefreshTokenRepositorio } from '../../../domain/ports/refresh-token.repository'
import { paraRefreshToken } from '../mappers/refresh-token.mapper'

export class PrismaRefreshTokenRepositorio implements RefreshTokenRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async criar(dados: NovoRefreshToken): Promise<RefreshToken> {
    return paraRefreshToken(await this.prisma.refreshToken.create({ data: dados }))
  }

  async buscarPorHash(hash: string): Promise<RefreshToken | null> {
    const linha = await this.prisma.refreshToken.findUnique({ where: { hash } })
    return linha ? paraRefreshToken(linha) : null
  }

  async marcarUsado(id: string, quando: Date): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { usadoEm: quando } })
  }

  async revogarFamilia(familiaId: string, quando: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { familiaId, revogadoEm: null }, data: { revogadoEm: quando } })
  }
}
