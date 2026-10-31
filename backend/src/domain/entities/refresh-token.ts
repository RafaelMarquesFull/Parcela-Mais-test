export type RefreshToken = {
  id: string
  usuarioId: string
  hash: string
  familiaId: string
  expiraEm: Date
  usadoEm: Date | null
  revogadoEm: Date | null
}

export type NovoRefreshToken = Omit<RefreshToken, 'id'>
