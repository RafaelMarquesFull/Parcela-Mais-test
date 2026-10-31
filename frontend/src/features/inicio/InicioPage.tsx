import { Hero } from './components/Hero'
import { Indicadores } from './components/Indicadores'
import { TabelaConsultas } from './components/TabelaConsultas'
import { useMetricas } from './hooks/useMetricas'

export function InicioPage({ apenasLista = false }: { apenasLista?: boolean }) {
  const metricas = useMetricas()
  if (apenasLista) return <TabelaConsultas titulo="Todas as consultas" descricao="Histórico completo de pré-aprovações da clínica" porPagina={10} />
  return (
    <div className="grid gap-6">
      <Hero />
      <Indicadores metricas={metricas} />
      <TabelaConsultas titulo="Consultas recentes" descricao="Acompanhe os status e propostas de pré-aprovação" porPagina={5} />
    </div>
  )
}
