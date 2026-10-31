import { useEffect, useState } from 'react'
import type { MetricasConsultas } from 'shared'
import { obterMetricas } from '@/services/consultas.api'

export function useMetricas() {
  const [metricas, setMetricas] = useState<MetricasConsultas | null>(null)
  useEffect(() => {
    obterMetricas()
      .then(setMetricas)
      .catch(() => setMetricas(null))
  }, [])
  return metricas
}
