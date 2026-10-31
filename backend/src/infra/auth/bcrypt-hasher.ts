import bcrypt from 'bcryptjs'
import type { Hasher } from '../../domain/ports/hasher.port'

export class BcryptHasher implements Hasher {
  constructor(private readonly custo = 10) {}

  gerar(texto: string): Promise<string> {
    return bcrypt.hash(texto, this.custo)
  }

  comparar(texto: string, hash: string): Promise<boolean> {
    return bcrypt.compare(texto, hash)
  }
}
