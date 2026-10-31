import { useCallback, useEffect, useRef, useState } from 'react'
import type { PaginaConsultas } from 'shared'
import { listarConsultas } from '@/services/consultas.api'

const ESPERA_BUSCA_MS = 300

const vazia = (porPagina: number): PaginaConsultas => ({ itens: [], total: 0, pagina: 1, porPagina })

export function useConsultas(opcoes: { porPagina: number }) {
  const { porPagina } = opcoes
  const [pagina, setPagina] = useState<PaginaConsultas>(() => vazia(porPagina))
  const [filtro, setFiltro] = useState({ pagina: 1, busca: '' })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const timerBusca = useRef<ReturnType<typeof setTimeout>>(undefined)

  const totalPaginas = Math.max(1, Math.ceil(pagina.total / porPagina))

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    listarConsultas({ pagina: filtro.pagina, porPagina, busca: filtro.busca || undefined })
      .then(resposta => {
        if (!ativo) return
        setPagina(resposta)
        setErro(null)
      })
      .catch(e => {
        if (ativo) setErro(e instanceof Error ? e.message : 'Não foi possível carregar as consultas')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [filtro, porPagina])

  const irPara = useCallback(
    (destino: number) => {
      if (destino < 1 || destino > totalPaginas) return
      setFiltro(f => ({ ...f, pagina: destino }))
    },
    [totalPaginas],
  )

  const buscar = useCallback((termo: string) => {
    clearTimeout(timerBusca.current)
    timerBusca.current = setTimeout(() => setFiltro({ pagina: 1, busca: termo.trim() }), ESPERA_BUSCA_MS)
  }, [])

  useEffect(() => () => clearTimeout(timerBusca.current), [])

  const recarregar = useCallback(() => setFiltro(f => ({ ...f })), [])

  return { pagina, totalPaginas, carregando, erro, irPara, buscar, recarregar }
}
