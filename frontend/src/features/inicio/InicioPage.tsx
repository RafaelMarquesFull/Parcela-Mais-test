import { useEffect, useState } from 'react'
import type { ConsultaResumo } from 'shared'
import { listarConsultas } from '@/services/consultas.api'
import { AcaoNovaConsulta } from './components/AcaoNovaConsulta'
import { ListaConsultasRecentes } from './components/ListaConsultasRecentes'

export function InicioPage({ apenasLista = false }: { apenasLista?: boolean }) {
  const [consultas, setConsultas] = useState<ConsultaResumo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarConsultas()
      .then(lista => setConsultas(apenasLista ? lista : lista.slice(0, 10)))
      .catch(() => setConsultas([]))
      .finally(() => setCarregando(false))
  }, [apenasLista])

  return (
    <div className="grid gap-8">
      {!apenasLista && <AcaoNovaConsulta />}
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">{apenasLista ? 'Todas as consultas' : 'Consultas recentes'}</h2>
        <ListaConsultasRecentes consultas={consultas} carregando={carregando} />
      </section>
    </div>
  )
}
