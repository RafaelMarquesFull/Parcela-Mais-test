export type Liberar = () => void

export class LimitadorDeConcorrencia {
  private ativos = 0
  private readonly fila: Array<(liberar: Liberar) => void> = []

  constructor(private readonly opcoes: { limite: number; duracaoEstimadaMs: number }) {}

  emVoo(): number {
    return this.ativos
  }

  naFila(): number {
    return this.fila.length
  }

  adquirir(prazoRestanteMs: number): Promise<Liberar | null> {
    if (this.ativos < this.opcoes.limite) {
      this.ativos += 1
      return Promise.resolve(this.criarLiberacao())
    }
    if (this.esperaPrevistaMs() + this.opcoes.duracaoEstimadaMs > prazoRestanteMs) return Promise.resolve(null)
    return new Promise(resolve => this.fila.push(resolve))
  }

  private esperaPrevistaMs(): number {
    const { limite, duracaoEstimadaMs } = this.opcoes
    const ondas = Math.ceil((this.ativos + this.fila.length + 1 - limite) / limite)
    return ondas * duracaoEstimadaMs
  }

  private criarLiberacao(): Liberar {
    let liberado = false
    return () => {
      if (liberado) return
      liberado = true
      const proximo = this.fila.shift()
      if (proximo) proximo(this.criarLiberacao())
      else this.ativos -= 1
    }
  }
}
