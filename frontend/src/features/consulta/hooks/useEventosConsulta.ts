import { useEffect, useRef, useState } from 'react'
import type { EventoConsulta, ResultadoSnapshot } from 'shared'
import { urlEventos } from '@/services/consultas.api'

export type ModoEventos = 'conectando' | 'sse' | 'polling' | 'parado'

const CONEXAO_FECHADA = 2

type Opcoes = {
  id: string
  ativo: boolean
  aoResultado(resultado: ResultadoSnapshot): void
  aoFinalizar(): void
  recarregar(): Promise<void>
  criarEventSource?: (url: string) => EventSource
  esperaOpenMs?: number
  intervaloPollingMs?: number
}

export function useEventosConsulta(opcoes: Opcoes): { modo: ModoEventos } {
  const [modo, setModo] = useState<ModoEventos>('parado')
  const atual = useRef(opcoes)
  atual.current = opcoes
  const { id, ativo, esperaOpenMs = 2000, intervaloPollingMs = 1000 } = opcoes

  useEffect(() => {
    if (!ativo) {
      setModo('parado')
      return
    }

    let encerrado = false
    let timerAbertura: ReturnType<typeof setTimeout> | undefined
    let timerPolling: ReturnType<typeof setInterval> | undefined
    const criar = atual.current.criarEventSource ?? (url => new EventSource(url))
    const fonte = criar(urlEventos(id))

    const encerrar = () => {
      encerrado = true
      fonte.close()
      clearTimeout(timerAbertura)
      clearInterval(timerPolling)
    }

    const iniciarPolling = () => {
      if (encerrado) return
      fonte.close()
      clearTimeout(timerAbertura)
      setModo('polling')
      timerPolling = setInterval(() => void atual.current.recarregar(), intervaloPollingMs)
    }

    setModo('conectando')
    timerAbertura = setTimeout(iniciarPolling, esperaOpenMs)

    fonte.addEventListener('open', () => {
      clearTimeout(timerAbertura)
      setModo('sse')
    })
    fonte.addEventListener('resultado', evento => {
      const dados = JSON.parse((evento as MessageEvent).data) as EventoConsulta
      if (dados.tipo === 'resultado') atual.current.aoResultado(dados.resultado)
    })
    fonte.addEventListener('consulta-finalizada', () => {
      encerrar()
      setModo('parado')
      atual.current.aoFinalizar()
    })
    fonte.addEventListener('error', () => {
      void atual.current.recarregar()
      if (fonte.readyState === CONEXAO_FECHADA) iniciarPolling()
    })

    return encerrar
  }, [id, ativo, esperaOpenMs, intervaloPollingMs])

  return { modo }
}
