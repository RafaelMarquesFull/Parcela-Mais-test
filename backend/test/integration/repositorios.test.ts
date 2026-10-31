import type { PrismaClient } from '@prisma/client'
import { PrismaConsultaRepositorio } from '../../src/infra/database/repositories/prisma-consulta.repository'
import { PrismaPacienteRepositorio } from '../../src/infra/database/repositories/prisma-paciente.repository'
import { PrismaUsuarioRepositorio } from '../../src/infra/database/repositories/prisma-usuario.repository'
import { PrismaRefreshTokenRepositorio } from '../../src/infra/database/repositories/prisma-refresh-token.repository'
import { criarBancoTemporario, usuarioSemeado } from '../helpers/banco-temporario'

let prisma: PrismaClient
let limpar: () => Promise<void>
let consultas: PrismaConsultaRepositorio
let pacientes: PrismaPacienteRepositorio

beforeAll(async () => {
  ;({ prisma, limpar } = await criarBancoTemporario())
  consultas = new PrismaConsultaRepositorio(prisma)
  pacientes = new PrismaPacienteRepositorio(prisma)
})
afterAll(() => limpar())

async function novaConsulta(chave = crypto.randomUUID()) {
  const paciente = await pacientes.criar({ nome: 'Ana', cpf: '52998224725', dataNascimento: '1996-01-01', celular: '11912345678', rendaMensal: 1_000_000 })
  const consulta = await consultas.criar({ usuarioId: usuarioSemeado.id, pacienteId: paciente.id, valorTratamento: 800_000, cenario: 'aleatorio', chaveIdempotencia: chave })
  return { paciente, consulta }
}

describe('PrismaConsultaRepositorio', () => {
  it('cria e busca por id e por chave', async () => {
    const chave = crypto.randomUUID()
    const { consulta } = await novaConsulta(chave)
    expect(await consultas.buscarPorId(consulta.id)).toMatchObject({ status: 'em_andamento', cenario: 'aleatorio', valorTratamento: 800_000 })
    expect((await consultas.buscarPorChave(chave))?.id).toBe(consulta.id)
    expect(await consultas.buscarPorId('nao-existe')).toBeNull()
  })

  it('rejeita chave de idempotência duplicada', async () => {
    const chave = crypto.randomUUID()
    await novaConsulta(chave)
    await expect(novaConsulta(chave)).rejects.toThrow()
  })

  it('grava resultado, sobrescreve a mesma financeira e preserva prazos', async () => {
    const { consulta } = await novaConsulta()
    const base = { consultaId: consulta.id, financeira: 'alfa' as const, motivo: null, valorAprovado: null, taxaMensal: null, prazos: [], duracaoMs: null, respondidoEm: null }
    await consultas.gravarResultado({ ...base, status: 'consultando' })
    await consultas.gravarResultado({ ...base, status: 'aprovada', valorAprovado: 800_000, taxaMensal: 249, prazos: [6, 12, 18], duracaoMs: 700, respondidoEm: new Date() })
    const lista = await consultas.resultados(consulta.id)
    expect(lista).toHaveLength(1)
    expect(lista[0]).toMatchObject({ status: 'aprovada', prazos: [6, 12, 18], duracaoMs: 700 })
  })

  it('finaliza a consulta', async () => {
    const { consulta } = await novaConsulta()
    const quando = new Date('2026-10-30T12:00:00Z')
    await consultas.finalizar(consulta.id, quando)
    expect(await consultas.buscarPorId(consulta.id)).toMatchObject({ status: 'finalizada', finalizadaEm: quando })
  })

  it('grava uma escolha por consulta', async () => {
    const { consulta } = await novaConsulta()
    const resultado = await consultas.gravarResultado({ consultaId: consulta.id, financeira: 'beta', status: 'aprovada', motivo: null, valorAprovado: 480_000, taxaMensal: 199, prazos: [12, 18, 24], duracaoMs: 3000, respondidoEm: new Date() })
    const escolha = await consultas.gravarEscolha({ consultaId: consulta.id, resultadoId: resultado.id, prazoMeses: 12, valorParcela: 45_000, totalPago: 540_000 })
    expect((await consultas.escolha(consulta.id))?.id).toBe(escolha.id)
    await expect(consultas.gravarEscolha({ consultaId: consulta.id, resultadoId: resultado.id, prazoMeses: 18, valorParcela: 1, totalPago: 1 })).rejects.toThrow()
  })

  it('lista resumos do usuário, mais recentes primeiro, contando aprovadas', async () => {
    const { consulta } = await novaConsulta()
    await consultas.gravarResultado({ consultaId: consulta.id, financeira: 'alfa', status: 'aprovada', motivo: null, valorAprovado: 1, taxaMensal: 1, prazos: [6], duracaoMs: 1, respondidoEm: new Date() })
    await consultas.gravarResultado({ consultaId: consulta.id, financeira: 'gama', status: 'recusada', motivo: 'regra', valorAprovado: null, taxaMensal: null, prazos: [], duracaoMs: 1, respondidoEm: new Date() })
    const lista = await consultas.listar(usuarioSemeado.id)
    expect(lista[0]).toMatchObject({ id: consulta.id, pacienteNome: 'Ana', aprovadas: 1, valorTratamento: 800_000 })
    expect(typeof lista[0]?.criadaEm).toBe('string')
  })
})

describe('PrismaUsuarioRepositorio e PrismaRefreshTokenRepositorio', () => {
  it('busca usuário por e-mail', async () => {
    const usuarios = new PrismaUsuarioRepositorio(prisma)
    expect((await usuarios.buscarPorEmail(usuarioSemeado.email))?.nome).toBe('Clínica Demo')
    expect(await usuarios.buscarPorEmail('ninguem@x.com')).toBeNull()
  })

  it('cria, marca usado e revoga família de refresh tokens', async () => {
    const tokens = new PrismaRefreshTokenRepositorio(prisma)
    const familiaId = crypto.randomUUID()
    const base = { usuarioId: usuarioSemeado.id, familiaId, expiraEm: new Date(Date.now() + 1000), usadoEm: null, revogadoEm: null }
    const a = await tokens.criar({ ...base, hash: 'hash-a' })
    const b = await tokens.criar({ ...base, hash: 'hash-b' })
    await tokens.marcarUsado(a.id, new Date())
    expect((await tokens.buscarPorHash('hash-a'))?.usadoEm).toBeInstanceOf(Date)
    await tokens.revogarFamilia(familiaId, new Date())
    expect((await tokens.buscarPorHash('hash-b'))?.revogadoEm).toBeInstanceOf(Date)
    expect(b.revogadoEm).toBeNull()
  })
})
