import { criarApp } from '../../src/app'
import { carregarEnv } from '../../src/config/env'
import { criarContainer } from '../../src/container'
import type { Financeira } from '../../src/domain/ports/financeira.port'
import type { Relogio } from '../../src/domain/ports/relogio.port'
import { criarBancoTemporario } from './banco-temporario'
import { criarQuatroFakes } from './fake-financeira'

export async function construirApp(opcoes: { simulacao?: boolean; financeiras?: Financeira[]; relogio?: Relogio } = {}) {
  const banco = await criarBancoTemporario()
  const env = carregarEnv({
    DATABASE_URL: banco.url,
    JWT_SECRET: 'segredo-de-teste',
    SIMULACAO_CENARIOS: String(opcoes.simulacao ?? true),
    ORIGEM_FRONT: 'http://localhost:5173',
  })
  const fakes = criarQuatroFakes()
  const container = criarContainer({
    env,
    prisma: banco.prisma,
    financeiras: opcoes.financeiras ?? Object.values(fakes),
    relogio: opcoes.relogio,
    registrarErro: () => {},
  })
  const app = criarApp({ env, container })
  await app.ready()
  return {
    app,
    fakes,
    prisma: banco.prisma,
    container,
    limpar: async () => {
      await app.close()
      await banco.limpar()
    },
  }
}

export const pacienteExemplo = {
  nome: 'Ana Souza',
  cpf: '52998224725',
  dataNascimento: '1996-05-10',
  celular: '11912345678',
  rendaMensal: 1_000_000,
  valorTratamento: 800_000,
}

export const esperar = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
