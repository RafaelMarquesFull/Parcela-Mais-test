import { hashDeRefresh, type DependenciasSessao } from './sessao'

export class EncerrarSessao {
  constructor(private readonly deps: DependenciasSessao) {}

  async executar(refreshToken: string): Promise<void> {
    const atual = await this.deps.refreshTokens.buscarPorHash(hashDeRefresh(refreshToken))
    if (!atual) return
    await this.deps.refreshTokens.revogarFamilia(atual.familiaId, new Date(this.deps.relogio.agora()))
  }
}
