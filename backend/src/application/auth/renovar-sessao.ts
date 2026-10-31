import { RefreshInvalido } from '../../domain/errors/domain-error'
import { emitirSessao, hashDeRefresh, type DependenciasSessao, type Sessao } from './sessao'

export class RenovarSessao {
  constructor(private readonly deps: DependenciasSessao) {}

  async executar(refreshToken: string): Promise<Sessao> {
    const { refreshTokens, usuarios, relogio } = this.deps
    const atual = await refreshTokens.buscarPorHash(hashDeRefresh(refreshToken))
    if (!atual) throw new RefreshInvalido()
    const agora = new Date(relogio.agora())
    if (atual.revogadoEm || atual.expiraEm.getTime() <= agora.getTime()) throw new RefreshInvalido()
    if (atual.usadoEm) {
      await refreshTokens.revogarFamilia(atual.familiaId, agora)
      throw new RefreshInvalido()
    }
    const usuario = await usuarios.buscarPorId(atual.usuarioId)
    if (!usuario) throw new RefreshInvalido()
    await refreshTokens.marcarUsado(atual.id, agora)
    return emitirSessao(this.deps, usuario, atual.familiaId)
  }
}
