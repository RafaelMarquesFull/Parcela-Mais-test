import jwt from 'jsonwebtoken'
import type { EmissorToken, PayloadToken } from '../../domain/ports/emissor-token.port'

export class JwtEmissor implements EmissorToken {
  constructor(
    private readonly segredo: string,
    private readonly duracaoSegundos = 15 * 60,
  ) {}

  emitir(payload: PayloadToken): string {
    return jwt.sign({ nome: payload.nome }, this.segredo, { subject: payload.sub, expiresIn: this.duracaoSegundos, algorithm: 'HS256' })
  }

  verificar(token: string): PayloadToken | null {
    try {
      const decodificado = jwt.verify(token, this.segredo, { algorithms: ['HS256'] })
      if (typeof decodificado === 'string' || !decodificado.sub) return null
      return { sub: decodificado.sub, nome: String(decodificado.nome ?? '') }
    } catch {
      return null
    }
  }
}
