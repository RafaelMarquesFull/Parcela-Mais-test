import type { LoginInput } from 'shared'
import { CredenciaisInvalidas } from '../../domain/errors/domain-error'
import { emitirSessao, type DependenciasSessao, type Sessao } from './sessao'

export class Autenticar {
  constructor(private readonly deps: DependenciasSessao) {}

  async executar(entrada: LoginInput): Promise<Sessao & { usuario: { nome: string } }> {
    const usuario = await this.deps.usuarios.buscarPorEmail(entrada.email)
    if (!usuario) throw new CredenciaisInvalidas()
    const confere = await this.deps.hasher.comparar(entrada.senha, usuario.senhaHash)
    if (!confere) throw new CredenciaisInvalidas()
    const sessao = await emitirSessao(this.deps, usuario)
    return { ...sessao, usuario: { nome: usuario.nome } }
  }
}
