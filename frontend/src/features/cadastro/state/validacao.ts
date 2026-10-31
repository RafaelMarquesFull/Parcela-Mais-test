import { cadastroSchema, dadosPessoaisSchema, valoresSchema, type CadastroInput } from 'shared'
import type { Campo, Passo, Valores } from './reducer'

export type Erros = Partial<Record<Campo, string>>

export function validarPasso(passo: Passo, valores: Valores): Erros {
  const resultado =
    passo === 1
      ? dadosPessoaisSchema.safeParse({ nome: valores.nome, cpf: valores.cpf, dataNascimento: valores.dataNascimento, celular: valores.celular })
      : valoresSchema.safeParse({ rendaMensal: valores.rendaMensal, valorTratamento: valores.valorTratamento })
  if (resultado.success) return {}
  const erros: Erros = {}
  for (const issue of resultado.error.issues) {
    const campo = issue.path[0] as Campo | undefined
    if (campo && !erros[campo]) erros[campo] = issue.message
  }
  return erros
}

export function montarEntrada(valores: Valores): CadastroInput {
  return cadastroSchema.parse({
    nome: valores.nome,
    cpf: valores.cpf,
    dataNascimento: valores.dataNascimento,
    celular: valores.celular,
    rendaMensal: valores.rendaMensal,
    valorTratamento: valores.valorTratamento,
    cenario: valores.cenario,
  })
}
