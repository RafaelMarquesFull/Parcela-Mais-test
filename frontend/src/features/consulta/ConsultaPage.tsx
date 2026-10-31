import { useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Confirmacao } from '@/features/ofertas/components/Confirmacao'
import { ListaOfertas } from '@/features/ofertas/components/ListaOfertas'
import { SemOfertas } from '@/features/ofertas/components/SemOfertas'
import { escolherOferta } from '@/services/consultas.api'
import { PainelFinanceiras } from './components/PainelFinanceiras'
import { useConsulta } from './hooks/useConsulta'

export const rotaNovaConsulta = '/'

export function ConsultaPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { consulta, carregando, erro, modo, recarregar } = useConsulta(id)

  if (carregando && !consulta) return <p className="text-sm text-muted-foreground">Carregando consulta…</p>
  if (erro && !consulta) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{erro}</AlertDescription>
      </Alert>
    )
  }
  if (!consulta) return null

  if (consulta.status === 'em_andamento') return <PainelFinanceiras consulta={consulta} modo={modo} />
  if (consulta.escolha) return <Confirmacao consulta={consulta} aoNovaConsulta={() => navigate(rotaNovaConsulta)} />
  if (consulta.resultados.some(r => r.status === 'aprovada')) {
    return (
      <ListaOfertas
        consulta={consulta}
        aoEscolher={async entrada => {
          await escolherOferta(id, entrada)
          await recarregar()
        }}
      />
    )
  }
  return <SemOfertas consulta={consulta} aoTentarValorMenor={() => navigate(rotaNovaConsulta, { state: { valorInicial: Math.round(consulta.valorTratamento * 0.8) } })} />
}
