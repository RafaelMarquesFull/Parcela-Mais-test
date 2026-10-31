import { useCallback, useEffect, useState } from 'react'
import type { ConsultaSnapshot, ResultadoSnapshot } from 'shared'
import { obterConsulta } from '@/services/consultas.api'
import { useEventosConsulta, type ModoEventos } from './useEventosConsulta'

export function useConsulta(id: string): {
  consulta: ConsultaSnapshot | null
  carregando: boolean
  erro: string | null
  modo: ModoEventos
  recarregar(): Promise<void>
} {
  const [consulta, setConsulta] = useState<ConsultaSnapshot | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    try {
      setConsulta(await obterConsulta(id))
      setErro(null)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar a consulta')
    }
  }, [id])

  useEffect(() => {
    setCarregando(true)
    void recarregar().finally(() => setCarregando(false))
  }, [recarregar])

  const aplicarResultado = useCallback((resultado: ResultadoSnapshot) => {
    setConsulta(atual => atual && { ...atual, resultados: atual.resultados.map(r => (r.financeira === resultado.financeira ? resultado : r)) })
  }, [])

  const { modo } = useEventosConsulta({
    id,
    ativo: consulta?.status === 'em_andamento',
    aoResultado: aplicarResultado,
    aoFinalizar: () => void recarregar(),
    recarregar,
  })

  return { consulta, carregando, erro, modo, recarregar }
}
