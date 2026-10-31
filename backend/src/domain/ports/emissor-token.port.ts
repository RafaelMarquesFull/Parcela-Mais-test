export type PayloadToken = { sub: string; nome: string }

export interface EmissorToken {
  emitir(payload: PayloadToken): string
  verificar(token: string): PayloadToken | null
}
