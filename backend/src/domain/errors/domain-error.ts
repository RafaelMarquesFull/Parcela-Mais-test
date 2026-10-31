export class DomainError extends Error {
  constructor(
    public readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = new.target.name
  }
}

export class ConsultaNaoEncontrada extends DomainError {
  constructor() {
    super('consulta_nao_encontrada', 'Consulta não encontrada')
  }
}

export class OfertaInvalida extends DomainError {
  constructor(mensagem = 'Oferta inválida para esta consulta') {
    super('oferta_invalida', mensagem)
  }
}

export class EscolhaConflitante extends DomainError {
  constructor() {
    super('escolha_conflitante', 'Esta consulta já tem uma oferta escolhida')
  }
}

export class CredenciaisInvalidas extends DomainError {
  constructor() {
    super('credenciais_invalidas', 'E-mail ou senha incorretos')
  }
}

export class RefreshInvalido extends DomainError {
  constructor() {
    super('refresh_invalido', 'Sessão inválida ou expirada')
  }
}
