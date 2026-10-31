import { Alfa } from '../../src/infra/financeiras/alfa'
import { Beta } from '../../src/infra/financeiras/beta'
import { Gama } from '../../src/infra/financeiras/gama'
import { Delta } from '../../src/infra/financeiras/delta'
import { SimuladorLatencia } from '../../src/infra/financeiras/simulador-latencia'
import { criarRelogioFalso } from '../helpers/relogio-falso'

const paciente = { nome: 'A', cpf: '52998224725', dataNascimento: '1996-01-01', celular: '11912345678', rendaMensal: 1_000_000, valorTratamento: 800_000 }

let latencia: SimuladorLatencia

beforeEach(() => {
  vi.useFakeTimers()
  latencia = new SimuladorLatencia(criarRelogioFalso(), () => 0)
})
afterEach(() => vi.useRealTimers())

async function resolver<T>(promessa: Promise<T>, ms = 20_000): Promise<T> {
  await vi.advanceTimersByTimeAsync(ms)
  return promessa
}

describe('Alfa', () => {
  it('aprova 100% quando renda x10 cobre o valor', async () => {
    const r = await resolver(new Alfa(latencia).consultar(paciente, 'aleatorio'))
    expect(r).toEqual({ aprovada: true, valorAprovado: 800_000, taxaMensal: 249, prazos: [6, 12, 18] })
  })
  it('recusa quando renda x10 não cobre', async () => {
    const r = await resolver(new Alfa(latencia).consultar({ ...paciente, rendaMensal: 50_000 }, 'aleatorio'))
    expect(r).toEqual({ aprovada: false })
  })
  it('responde entre 0,5 e 1,5 s', async () => {
    const p = new Alfa(latencia).consultar(paciente, 'aleatorio')
    let resolvido = false
    p.then(() => (resolvido = true))
    await vi.advanceTimersByTimeAsync(499)
    expect(resolvido).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(resolvido).toBe(true)
  })
})

describe('Beta', () => {
  it('aprova no máximo 60% do valor', async () => {
    const r = await resolver(new Beta(latencia).consultar(paciente, 'aleatorio'))
    expect(r).toEqual({ aprovada: true, valorAprovado: 480_000, taxaMensal: 199, prazos: [12, 18, 24] })
  })
})

describe('Gama', () => {
  it('recusa menor de 25 anos', async () => {
    const r = await resolver(new Gama(latencia, () => new Date('2026-10-30')).consultar({ ...paciente, dataNascimento: '2005-01-01' }, 'aleatorio'))
    expect(r).toEqual({ aprovada: false })
  })
  it('recusa valor acima de 20.000', async () => {
    const r = await resolver(new Gama(latencia).consultar({ ...paciente, valorTratamento: 2_000_001 }, 'aleatorio'))
    expect(r).toEqual({ aprovada: false })
  })
  it('aprova 100% fora das regras de recusa', async () => {
    const r = await resolver(new Gama(latencia).consultar(paciente, 'aleatorio'))
    expect(r).toEqual({ aprovada: true, valorAprovado: 800_000, taxaMensal: 329, prazos: [6, 10, 12] })
  })
})

describe('Delta', () => {
  it('lança erro quando aleatorio < 0.3', async () => {
    const p = new Delta(latencia, () => 0.1).consultar(paciente, 'aleatorio')
    p.catch(() => {})
    await vi.advanceTimersByTimeAsync(20_000)
    await expect(p).rejects.toThrow()
  })
  it('aprova quando aleatorio >= 0.3', async () => {
    const r = await resolver(new Delta(latencia, () => 0.5).consultar(paciente, 'aleatorio'))
    expect(r).toEqual({ aprovada: true, valorAprovado: 800_000, taxaMensal: 219, prazos: [12, 24, 36] })
  })
})

describe('cenários forçados', () => {
  it('nenhuma_aprova faz Beta recusar', async () => {
    expect(await resolver(new Beta(latencia).consultar(paciente, 'nenhuma_aprova'))).toEqual({ aprovada: false })
  })
  it('todas_aprovam faz Alfa aprovar mesmo sem renda', async () => {
    expect(await resolver(new Alfa(latencia).consultar({ ...paciente, rendaMensal: 1 }, 'todas_aprovam'))).toMatchObject({ aprovada: true })
  })
  it('delta_falha faz Delta lançar mesmo com aleatorio alto', async () => {
    const p = new Delta(latencia, () => 0.9).consultar(paciente, 'delta_falha')
    p.catch(() => {})
    await vi.advanceTimersByTimeAsync(20_000)
    await expect(p).rejects.toThrow()
  })
  it('todas_aprovam faz Delta aprovar sem erro', async () => {
    expect(await resolver(new Delta(latencia, () => 0.1).consultar(paciente, 'todas_aprovam'))).toMatchObject({ aprovada: true })
  })
  it('delta_timeout faz Delta responder só aos 12s', async () => {
    const p = new Delta(latencia, () => 0.9).consultar(paciente, 'delta_timeout')
    let resolvido = false
    p.then(() => (resolvido = true))
    await vi.advanceTimersByTimeAsync(11_999)
    expect(resolvido).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(resolvido).toBe(true)
  })
})
