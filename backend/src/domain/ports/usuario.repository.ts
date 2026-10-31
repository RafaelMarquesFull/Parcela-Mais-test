import type { Usuario } from '../entities/usuario'

export interface UsuarioRepositorio {
  buscarPorEmail(email: string): Promise<Usuario | null>
  buscarPorId(id: string): Promise<Usuario | null>
}
