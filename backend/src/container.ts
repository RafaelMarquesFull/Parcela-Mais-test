import type { PrismaClient } from '@prisma/client'
import type { NomeFinanceira } from 'shared'
import { CriarConsulta } from './application/consultas/criar-consulta'
import { EscolherOferta } from './application/consultas/escolher-oferta'
import { ListarConsultas } from './application/consultas/listar-consultas'
import { ObterConsulta } from './application/consultas/obter-consulta'
import { OrquestradorDeConsulta } from './application/consultas/orquestrar-consulta'
import { Autenticar } from './application/auth/autenticar'
import { EncerrarSessao } from './application/auth/encerrar-sessao'
import { RenovarSessao } from './application/auth/renovar-sessao'
import { BcryptHasher } from './infra/auth/bcrypt-hasher'
import { JwtEmissor } from './infra/auth/jwt-emissor'
import type { Env } from './config/env'
import type { Financeira } from './domain/ports/financeira.port'
import type { Relogio } from './domain/ports/relogio.port'
import { PrismaConsultaRepositorio } from './infra/database/repositories/prisma-consulta.repository'
import { PrismaPacienteRepositorio } from './infra/database/repositories/prisma-paciente.repository'
import { PrismaRefreshTokenRepositorio } from './infra/database/repositories/prisma-refresh-token.repository'
import { PrismaUsuarioRepositorio } from './infra/database/repositories/prisma-usuario.repository'
import { CanalConsultas } from './infra/events/canal-consultas'
import { criarFinanceiras, latenciaMaximaMs } from './infra/financeiras'
import { LimitadorDeConcorrencia } from './infra/financeiras/limitador-concorrencia'
import { relogioReal } from './infra/relogio-real'

export const PRAZO_CONSULTA_MS = 10_000

type Opcoes = {
  env: Env
  prisma: PrismaClient
  financeiras?: Financeira[]
  relogio?: Relogio
  registrarErro?: (erro: unknown) => void
}

export function criarContainer(opcoes: Opcoes) {
  const { env, prisma } = opcoes
  const relogio = opcoes.relogio ?? relogioReal
  const registrarErro = opcoes.registrarErro ?? (erro => console.error(erro))

  const consultas = new PrismaConsultaRepositorio(prisma)
  const pacientes = new PrismaPacienteRepositorio(prisma)
  const usuarios = new PrismaUsuarioRepositorio(prisma)
  const refreshTokens = new PrismaRefreshTokenRepositorio(prisma)
  const eventos = new CanalConsultas()
  const financeiras = opcoes.financeiras ?? criarFinanceiras(relogio)

  const limitadores = Object.fromEntries(
    (Object.keys(latenciaMaximaMs) as NomeFinanceira[]).map(nome => [
      nome,
      new LimitadorDeConcorrencia({ limite: env.LIMITE_CONCORRENCIA, duracaoEstimadaMs: latenciaMaximaMs[nome] }),
    ]),
  ) as Record<NomeFinanceira, LimitadorDeConcorrencia>

  const hasher = new BcryptHasher()
  const emissor = new JwtEmissor(env.JWT_SECRET)
  const sessao = { usuarios, refreshTokens, hasher, emissor, relogio }

  const orquestrador = new OrquestradorDeConsulta({ financeiras, limitadores, consultas, eventos, relogio, prazoMs: PRAZO_CONSULTA_MS })

  return {
    env,
    prisma,
    relogio,
    consultas,
    pacientes,
    usuarios,
    refreshTokens,
    eventos,
    limitadores,
    orquestrador,
    criarConsulta: new CriarConsulta({ consultas, pacientes, orquestrador, simulacaoHabilitada: env.SIMULACAO_CENARIOS, registrarErro }),
    obterConsulta: new ObterConsulta(consultas, pacientes),
    listarConsultas: new ListarConsultas(consultas),
    escolherOferta: new EscolherOferta(consultas),
    emissor,
    autenticar: new Autenticar(sessao),
    renovarSessao: new RenovarSessao(sessao),
    encerrarSessao: new EncerrarSessao(sessao),
  }
}

export type Container = ReturnType<typeof criarContainer>
