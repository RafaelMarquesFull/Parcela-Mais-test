import type { Usuario as UsuarioLinha } from '@prisma/client'
import type { Usuario } from '../../../domain/entities/usuario'

export function paraUsuario(linha: UsuarioLinha): Usuario {
  return { id: linha.id, email: linha.email, nome: linha.nome, senhaHash: linha.senhaHash }
}
