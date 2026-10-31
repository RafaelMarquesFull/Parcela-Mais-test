import type { EventoConsulta, NomeFinanceira } from 'shared'
import { OrquestradorDeConsulta } from '../../src/application/consultas/orquestrar-consulta'
import { CanalConsultas } from '../../src/infra/events/canal-consultas'
import { LimitadorDeConcorrencia } from '../../src/infra/financeiras/limitador-concorrencia'
import { aprovada, criarQuatroFakes, recusada } from '../helpers/fake-financeira'
import { criarRelogioFalso } from '../helpers/relogio-falso'
import { ConsultaRepositorioMemoria, PacienteRepositorioMemoria } from '../helpers/repositorio-memoria'

const PRAZO = 10_000

function montar(limite = 5) {
  const fakes = criarQuatroFakes()
  const consultas = new ConsultaRepositorioMemoria()
  const pacientes = new PacienteRepositorioMemoria()
  const eventos = new CanalConsultas()
  const limitadores = Object.fromEntries(
    (['alfa', 'beta', 'gama', 'delta'] as NomeFinanceira[]).map(n => [n, new LimitadorDeConcorrencia({ limite, duracaoEstimadaMs: 6000 })]),
  ) as Record<NomeFinanceira, LimitadorDeConcorrencia>
  const orquestrador = new OrquestradorDeConsulta({
    financeiras: Object.values(fakes),
    limitadores,
    consultas,
    eventos,
    relogio: criarRelogioFalso(),
    prazoMs: PRAZO,
  })
  return { fakes, consultas, pacientes, eventos, orquestrador, limitadores }
}

async function novaConsulta(ctx: ReturnType<typeof montar>) {
  const paciente = await ctx.pacientes.criar({ nome: 'Ana', cpf: '52998224725', dataNascimento: '1996-01-01', celular: '11912345678', rendaMensal: 1_000_000 })
  const consulta = await ctx.consultas.criar({ usuarioId: 'u1', pacienteId: paciente.id, valorTratamento: 800_000, cenario: 'aleatorio', chaveIdempotencia: crypto.randomUUID() })
  const recebidos: EventoConsulta[] = []
  ctx.eventos.assinar(consulta.id, e => recebidos.push(e))
  return { paciente, consulta, recebidos }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('OrquestradorDeConsulta', () => {
  it('todas respondem antes do prazo: 4 resultados, nenhum indisponivel, consulta finalizada', async () => {
    const ctx = montar()
    const { consulta, paciente } = await novaConsulta(ctx)
    ctx.fakes.alfa.respondeEm(700, aprovada)
    ctx.fakes.beta.respondeEm(3000, aprovada)
    ctx.fakes.gama.respondeEm(1500, recusada)
    ctx.fakes.delta.respondeEm(6000, aprovada)
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(6000)
    await execucao
    const resultados = await ctx.consultas.resultados(consulta.id)
    expect(resultados.map(r => r.status).sort()).toEqual(['aprovada', 'aprovada', 'aprovada', 'recusada'])
    expect((await ctx.consultas.buscarPorId(consulta.id))?.status).toBe('finalizada')
  })

  it('uma estoura o prazo: vira indisponivel/timeout aos 10s, as outras mantêm resultado', async () => {
    const ctx = montar()
    const { consulta, paciente } = await novaConsulta(ctx)
    ctx.fakes.delta.nuncaResponde()
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(9999)
    expect((await ctx.consultas.resultados(consulta.id)).find(r => r.financeira === 'delta')?.status).toBe('consultando')
    await vi.advanceTimersByTimeAsync(1)
    await execucao
    const resultados = await ctx.consultas.resultados(consulta.id)
    expect(resultados.find(r => r.financeira === 'delta')).toMatchObject({ status: 'indisponivel', motivo: 'timeout' })
    expect(resultados.find(r => r.financeira === 'alfa')).toMatchObject({ status: 'aprovada' })
  })

  it('uma falha: indisponivel/erro, as outras seguem', async () => {
    const ctx = montar()
    const { consulta, paciente } = await novaConsulta(ctx)
    ctx.fakes.delta.falha()
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(200)
    await execucao
    const resultados = await ctx.consultas.resultados(consulta.id)
    expect(resultados.find(r => r.financeira === 'delta')).toMatchObject({ status: 'indisponivel', motivo: 'erro' })
    expect(resultados.filter(r => r.status === 'aprovada')).toHaveLength(3)
  })

  it('nenhuma responde: 4 indisponivel e consulta finalizada aos 10s', async () => {
    const ctx = montar()
    const { consulta, paciente } = await novaConsulta(ctx)
    Object.values(ctx.fakes).forEach(f => f.nuncaResponde())
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(PRAZO)
    await execucao
    const resultados = await ctx.consultas.resultados(consulta.id)
    expect(resultados.every(r => r.status === 'indisponivel' && r.motivo === 'timeout')).toBe(true)
    expect((await ctx.consultas.buscarPorId(consulta.id))?.status).toBe('finalizada')
  })

  it('resposta tardia não sobrescreve indisponivel nem publica evento', async () => {
    const ctx = montar()
    const { consulta, paciente, recebidos } = await novaConsulta(ctx)
    ctx.fakes.delta.respondeEm(12_000, aprovada)
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(12_000)
    await execucao
    expect((await ctx.consultas.resultados(consulta.id)).find(r => r.financeira === 'delta')?.status).toBe('indisponivel')
    expect(recebidos.filter(e => e.tipo === 'resultado' && e.resultado.financeira === 'delta')).toHaveLength(1)
    expect(recebidos.filter(e => e.tipo === 'resultado' && e.resultado.financeira === 'delta')[0]).toMatchObject({ resultado: { status: 'indisponivel' } })
  })

  it('fila cheia grava indisponivel/fila_cheia sem esperar', async () => {
    const ctx = montar(1)
    await ctx.limitadores.alfa.adquirir(PRAZO)
    await ctx.limitadores.alfa.adquirir(PRAZO)
    const { consulta, paciente } = await novaConsulta(ctx)
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(0)
    expect((await ctx.consultas.resultados(consulta.id)).find(r => r.financeira === 'alfa')).toMatchObject({ status: 'indisponivel', motivo: 'fila_cheia' })
    await vi.advanceTimersByTimeAsync(200)
    await execucao
  })

  it('publica eventos na ordem de chegada e consulta-finalizada por último', async () => {
    const ctx = montar()
    const { consulta, paciente, recebidos } = await novaConsulta(ctx)
    ctx.fakes.alfa.respondeEm(300, aprovada)
    ctx.fakes.beta.respondeEm(100, aprovada)
    ctx.fakes.gama.respondeEm(200, aprovada)
    ctx.fakes.delta.respondeEm(400, aprovada)
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(400)
    await execucao
    expect(recebidos.map(e => (e.tipo === 'resultado' ? e.resultado.financeira : e.tipo))).toEqual(['beta', 'gama', 'alfa', 'delta', 'consulta-finalizada'])
  })

  it('duracaoMs reflete o tempo de resposta', async () => {
    const ctx = montar()
    const { consulta, paciente } = await novaConsulta(ctx)
    ctx.fakes.alfa.respondeEm(700, aprovada)
    const execucao = ctx.orquestrador.executar(consulta, paciente)
    await vi.advanceTimersByTimeAsync(700)
    await execucao
    expect((await ctx.consultas.resultados(consulta.id)).find(r => r.financeira === 'alfa')?.duracaoMs).toBe(700)
  })
})
