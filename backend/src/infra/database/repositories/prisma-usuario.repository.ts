import type { PrismaClient } from '@prisma/client'
import type { Usuario } from '../../../domain/entities/usuario'
import type { UsuarioRepositorio } from '../../../domain/ports/usuario.repository'
import { paraUsuario } from '../mappers/usuario.mapper'

export class PrismaUsuarioRepositorio implements UsuarioRepositorio {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const linha = await this.prisma.usuario.findUnique({ where: { email } })
    return linha ? paraUsuario(linha) : null
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const linha = await this.prisma.usuario.findUnique({ where: { id } })
    return linha ? paraUsuario(linha) : null
  }
}
