import { LimitadorDeConcorrencia } from '../../src/infra/financeiras/limitador-concorrencia'

describe('LimitadorDeConcorrencia', () => {
  it('libera imediatamente abaixo do limite', async () => {
    const limitador = new LimitadorDeConcorrencia({ limite: 2, duracaoEstimadaMs: 1000 })
    expect(await limitador.adquirir(10_000)).toBeTypeOf('function')
    expect(limitador.emVoo()).toBe(1)
  })

  it('enfileira quando cheio e libera ao soltar', async () => {
    const limitador = new LimitadorDeConcorrencia({ limite: 1, duracaoEstimadaMs: 1000 })
    const liberarPrimeiro = (await limitador.adquirir(10_000))!
    let terceiroLiberado = false
    const pendente = limitador.adquirir(10_000).then(l => {
      terceiroLiberado = true
      return l
    })
    await Promise.resolve()
    expect(terceiroLiberado).toBe(false)
    expect(limitador.naFila()).toBe(1)
    liberarPrimeiro()
    expect(await pendente).toBeTypeOf('function')
    expect(limitador.naFila()).toBe(0)
  })

  it('devolve null quando a espera prevista não cabe no prazo', async () => {
    const limitador = new LimitadorDeConcorrencia({ limite: 1, duracaoEstimadaMs: 5000 })
    await limitador.adquirir(10_000)
    expect(await limitador.adquirir(4000)).toBeNull()
    expect(limitador.naFila()).toBe(0)
  })

  it('liberar duas vezes não abre vaga extra', async () => {
    const limitador = new LimitadorDeConcorrencia({ limite: 1, duracaoEstimadaMs: 1000 })
    const liberar = (await limitador.adquirir(10_000))!
    liberar()
    liberar()
    expect(limitador.emVoo()).toBe(0)
  })
})
