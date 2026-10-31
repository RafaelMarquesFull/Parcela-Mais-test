import { calcularParcela } from 'shared'
import { EscolherOferta } from '../../src/application/consultas/escolher-oferta'
import { ConsultaNaoEncontrada, EscolhaConflitante, OfertaInvalida } from '../../src/domain/errors/domain-error'
import { ConsultaRepositorioMemoria } from '../helpers/repositorio-memoria'

let consultas: ConsultaRepositorioMemoria
let escolher: EscolherOferta
let consultaId: string

beforeEach(async () => {
  consultas = new ConsultaRepositorioMemoria()
  escolher = new EscolherOferta(consultas)
  const consulta = await consultas.criar({ usuarioId: 'u1', pacienteId: 'p1', valorTratamento: 800_000, cenario: 'aleatorio', chaveIdempotencia: 'k' })
  consultaId = consulta.id
  await consultas.gravarResultado({ consultaId, financeira: 'beta', status: 'aprovada', motivo: null, valorAprovado: 480_000, taxaMensal: 199, prazos: [12, 18, 24], duracaoMs: 1, respondidoEm: new Date() })
  await consultas.gravarResultado({ consultaId, financeira: 'gama', status: 'recusada', motivo: 'regra', valorAprovado: null, taxaMensal: null, prazos: [], duracaoMs: 1, respondidoEm: new Date() })
})

describe('EscolherOferta', () => {
  it('grava a escolha com parcela recalculada no servidor', async () => {
    const escolha = await escolher.executar(consultaId, 'u1', { financeira: 'beta', prazoMeses: 24 })
    const parcela = calcularParcela(480_000, 199, 24)
    expect(escolha).toMatchObject({ prazoMeses: 24, valorParcela: parcela, totalPago: parcela * 24 })
  })

  it('rejeita prazo que a financeira não oferece', async () => {
    await expect(escolher.executar(consultaId, 'u1', { financeira: 'beta', prazoMeses: 48 })).rejects.toBeInstanceOf(OfertaInvalida)
  })

  it('rejeita financeira que recusou', async () => {
    await expect(escolher.executar(consultaId, 'u1', { financeira: 'gama', prazoMeses: 6 })).rejects.toBeInstanceOf(OfertaInvalida)
  })

  it('rejeita financeira sem resultado', async () => {
    await expect(escolher.executar(consultaId, 'u1', { financeira: 'alfa', prazoMeses: 6 })).rejects.toBeInstanceOf(OfertaInvalida)
  })

  it('repetir a mesma escolha devolve a existente', async () => {
    const primeira = await escolher.executar(consultaId, 'u1', { financeira: 'beta', prazoMeses: 12 })
    const segunda = await escolher.executar(consultaId, 'u1', { financeira: 'beta', prazoMeses: 12 })
    expect(segunda.id).toBe(primeira.id)
  })

  it('escolha diferente da existente conflita', async () => {
    await escolher.executar(consultaId, 'u1', { financeira: 'beta', prazoMeses: 12 })
    await expect(escolher.executar(consultaId, 'u1', { financeira: 'beta', prazoMeses: 18 })).rejects.toBeInstanceOf(EscolhaConflitante)
  })

  it('consulta inexistente', async () => {
    await expect(escolher.executar('x', 'u1', { financeira: 'beta', prazoMeses: 12 })).rejects.toBeInstanceOf(ConsultaNaoEncontrada)
  })
})
