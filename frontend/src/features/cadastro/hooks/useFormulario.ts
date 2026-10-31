import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { CadastroInput } from 'shared'
import { lerRascunho, limparRascunho, salvarRascunho } from '../state/rascunho'
import { estadoInicial, reducer, type Campo, type EstadoCadastro, type Valores } from '../state/reducer'
import { validarPasso, type Erros, montarEntrada } from '../state/validacao'

type Opcoes = {
  aoEnviar(entrada: CadastroInput, chave: string): Promise<void>
  valorInicial?: number
}

function estadoDeAbertura(valorInicial?: number): EstadoCadastro {
  const base = lerRascunho() ?? estadoInicial
  if (valorInicial === undefined) return base
  return { ...base, valores: { ...base.valores, valorTratamento: valorInicial } }
}

export function useFormulario(opcoes: Opcoes) {
  const [estado, dispatch] = useReducer(reducer, opcoes.valorInicial, estadoDeAbertura)

  useEffect(() => {
    if (estado.enviado) limparRascunho()
    else salvarRascunho(estado)
  }, [estado])

  const errosDoPasso = useMemo(() => validarPasso(estado.passo, estado.valores), [estado.passo, estado.valores])
  const passoValido = Object.keys(errosDoPasso).length === 0
  const erros = useMemo<Erros>(
    () => Object.fromEntries(Object.entries(errosDoPasso).filter(([campo]) => estado.tocados[campo as Campo])),
    [errosDoPasso, estado.tocados],
  )

  const alterar = useCallback(<C extends Campo>(campo: C, valor: Valores[C]) => dispatch({ tipo: 'alterar', campo, valor }), [])
  const tocar = useCallback((campo: Campo) => dispatch({ tipo: 'tocar', campo }), [])

  const avancar = useCallback(() => {
    if (!passoValido) return dispatch({ tipo: 'tocarPasso', passo: 1 })
    dispatch({ tipo: 'avancar' })
  }, [passoValido])

  const voltar = useCallback(() => dispatch({ tipo: 'voltar' }), [])

  const enviar = useCallback(async () => {
    if (!passoValido) return dispatch({ tipo: 'tocarPasso', passo: 2 })
    const chave = estado.chaveEnvio ?? crypto.randomUUID()
    dispatch({ tipo: 'iniciarEnvio', chave })
    try {
      await opcoes.aoEnviar(montarEntrada(estado.valores), chave)
      dispatch({ tipo: 'concluirEnvio' })
    } catch (erro) {
      dispatch({ tipo: 'falharEnvio', mensagem: erro instanceof Error ? erro.message : 'Não foi possível enviar' })
    }
  }, [passoValido, estado.chaveEnvio, estado.valores, opcoes])

  return { estado: { ...estado, erros }, alterar, tocar, avancar, voltar, enviar, passoValido }
}
