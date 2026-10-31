import { Autenticar } from '../../src/application/auth/autenticar'
import { EncerrarSessao } from '../../src/application/auth/encerrar-sessao'
import { RenovarSessao } from '../../src/application/auth/renovar-sessao'
import { CredenciaisInvalidas, RefreshInvalido } from '../../src/domain/errors/domain-error'
import type { Hasher } from '../../src/domain/ports/hasher.port'
import type { EmissorToken } from '../../src/domain/ports/emissor-token.port'
import { RefreshTokenRepositorioMemoria, UsuarioRepositorioMemoria } from '../helpers/repositorio-memoria'

const hasher: Hasher = {
  gerar: async texto => `hash:${texto}`,
  comparar: async (texto, hash) => hash === `hash:${texto}`,
}
const emissor: EmissorToken = {
  emitir: payload => `access:${payload.sub}`,
  verificar: token => (token.startsWith('access:') ? { sub: token.slice(7), nome: 'x' } : null),
}

let agora = Date.parse('2026-10-30T12:00:00Z')
const relogio = { agora: () => agora, esperar: async () => {} }

let usuarios: UsuarioRepositorioMemoria
let refreshTokens: RefreshTokenRepositorioMemoria
let autenticar: Autenticar
let renovar: RenovarSessao
let encerrar: EncerrarSessao

beforeEach(() => {
  agora = Date.parse('2026-10-30T12:00:00Z')
  usuarios = new UsuarioRepositorioMemoria([{ id: 'u1', email: 'clinica@parcelamais.com', nome: 'Clínica Demo', senhaHash: 'hash:parcela123' }])
  refreshTokens = new RefreshTokenRepositorioMemoria()
  const deps = { usuarios, refreshTokens, hasher, emissor, relogio }
  autenticar = new Autenticar(deps)
  renovar = new RenovarSessao(deps)
  encerrar = new EncerrarSessao(deps)
})

describe('Autenticar', () => {
  it('devolve access e refresh para credenciais corretas', async () => {
    const sessao = await autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'parcela123' })
    expect(sessao.accessToken).toBe('access:u1')
    expect(sessao.refreshToken).toHaveLength(43)
    expect(sessao.usuario).toEqual({ nome: 'Clínica Demo' })
  })

  it('senha errada lança CredenciaisInvalidas', async () => {
    await expect(autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'x' })).rejects.toBeInstanceOf(CredenciaisInvalidas)
  })

  it('e-mail desconhecido lança CredenciaisInvalidas', async () => {
    await expect(autenticar.executar({ email: 'a@b.com', senha: 'x' })).rejects.toBeInstanceOf(CredenciaisInvalidas)
  })
})

describe('RenovarSessao', () => {
  it('rotaciona: devolve novo refresh e o antigo passa a ser inválido depois da janela de tolerância', async () => {
    const { refreshToken } = await autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'parcela123' })
    const renovado = await renovar.executar(refreshToken)
    expect(renovado.refreshToken).not.toBe(refreshToken)
    expect(renovado.accessToken).toBe('access:u1')
    agora += 61_000
    await expect(renovar.executar(refreshToken)).rejects.toBeInstanceOf(RefreshInvalido)
  })

  it('reuso de refresh rotacionado há mais de 60 s revoga a família inteira, inclusive o novo', async () => {
    const { refreshToken: t0 } = await autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'parcela123' })
    const r1 = await renovar.executar(t0)
    agora += 61_000
    await expect(renovar.executar(t0)).rejects.toBeInstanceOf(RefreshInvalido)
    await expect(renovar.executar(r1.refreshToken)).rejects.toBeInstanceOf(RefreshInvalido)
  })

  it('reuso de refresh rotacionado há menos de 60 s é tolerado e emite nova sessão sem revogar', async () => {
    const { refreshToken: t0 } = await autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'parcela123' })
    const r1 = await renovar.executar(t0)
    agora += 30_000
    const r2 = await renovar.executar(t0)
    expect(r2.refreshToken).not.toBe(t0)
    await expect(renovar.executar(r1.refreshToken)).resolves.toBeDefined()
  })

  it('refresh expirado é inválido', async () => {
    const { refreshToken } = await autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'parcela123' })
    agora += 8 * 24 * 60 * 60 * 1000
    await expect(renovar.executar(refreshToken)).rejects.toBeInstanceOf(RefreshInvalido)
  })

  it('refresh desconhecido é inválido', async () => {
    await expect(renovar.executar('nao-existe')).rejects.toBeInstanceOf(RefreshInvalido)
  })
})

describe('EncerrarSessao', () => {
  it('revoga a família e o refresh deixa de funcionar', async () => {
    const { refreshToken } = await autenticar.executar({ email: 'clinica@parcelamais.com', senha: 'parcela123' })
    await encerrar.executar(refreshToken)
    await expect(renovar.executar(refreshToken)).rejects.toBeInstanceOf(RefreshInvalido)
  })

  it('ignora refresh desconhecido', async () => {
    await expect(encerrar.executar('x')).resolves.toBeUndefined()
  })
})
