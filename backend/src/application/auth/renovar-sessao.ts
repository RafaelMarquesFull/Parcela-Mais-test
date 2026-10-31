import { RefreshInvalido } from '../../domain/errors/domain-error'
import { emitirSessao, hashDeRefresh, type DependenciasSessao, type Sessao } from './sessao'

export const TOLERANCIA_REUSO_MS = 60_000

export class RenovarSessao {
  constructor(private readonly deps: DependenciasSessao) {}

  async executar(refreshToken: string): Promise<Sessao & { usuario: { nome: string } }> {
    const { refreshTokens, usuarios, relogio } = this.deps
    const atual = await refreshTokens.buscarPorHash(hashDeRefresh(refreshToken))
    if (!atual) throw new RefreshInvalido()
    const agora = new Date(relogio.agora())
    if (atual.revogadoEm || atual.expiraEm.getTime() <= agora.getTime()) throw new RefreshInvalido()
    if (atual.usadoEm && agora.getTime() - atual.usadoEm.getTime() > TOLERANCIA_REUSO_MS) {
      await refreshTokens.revogarFamilia(atual.familiaId, agora)
      throw new RefreshInvalido()
    }
    const usuario = await usuarios.buscarPorId(atual.usuarioId)
    if (!usuario) throw new RefreshInvalido()
    if (!atual.usadoEm) await refreshTokens.marcarUsado(atual.id, agora)
    const sessao = await emitirSessao(this.deps, usuario, atual.familiaId)
    return { ...sessao, usuario: { nome: usuario.nome } }
  }
}
