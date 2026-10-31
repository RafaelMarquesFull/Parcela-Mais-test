import { useParams } from 'react-router'

export function ConsultaPage() {
  const { id } = useParams()
  return <main className="p-6">Consulta {id}</main>
}
