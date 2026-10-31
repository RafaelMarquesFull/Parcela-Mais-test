import { CircleCheckBig, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { formatarMoeda, type MetricasConsultas } from 'shared'

type Indicador = { rotulo: string; valor: string; detalhe: string; Icone: typeof Users; positivo?: boolean | null }

function montar(m: MetricasConsultas): Indicador[] {
  const variacao = m.consultasOntem === 0 ? null : Math.round(((m.consultasHoje - m.consultasOntem) / m.consultasOntem) * 100)
  const taxa = m.finalizadas === 0 ? null : Math.round((m.comCredito / m.finalizadas) * 100)
  const totalConsultas = m.finalizadas + (m.consultasHoje > m.finalizadas ? m.consultasHoje - m.finalizadas : 0)
  const media = totalConsultas === 0 ? 0 : Math.round(m.volumeSolicitado / totalConsultas)
  return [
    {
      rotulo: 'Consultas hoje',
      valor: String(m.consultasHoje),
      detalhe: variacao === null ? (m.consultasOntem === 0 && m.consultasHoje > 0 ? 'Nenhuma ontem' : 'Sem comparação com ontem') : `${variacao >= 0 ? '+' : ''}${variacao}% vs ontem`,
      Icone: Users,
      positivo: variacao === null ? null : variacao >= 0,
    },
    {
      rotulo: 'Taxa de aprovação',
      valor: taxa === null ? '—' : `${taxa}%`,
      detalhe: m.finalizadas === 0 ? 'Nenhuma consulta finalizada' : `${m.comCredito} de ${m.finalizadas} pacientes com crédito`,
      Icone: CircleCheckBig,
    },
    {
      rotulo: 'Volume solicitado',
      valor: formatarMoeda(m.volumeSolicitado),
      detalhe: totalConsultas === 0 ? 'Nenhum pedido ainda' : `Média ${formatarMoeda(media)} por paciente`,
      Icone: Wallet,
    },
  ]
}

export function Indicadores({ metricas }: { metricas: MetricasConsultas | null }) {
  if (!metricas) return null
  return (
    <section className="grid gap-4 md:grid-cols-3" aria-label="Indicadores">
      {montar(metricas).map(({ rotulo, valor, detalhe, Icone, positivo }) => (
        <div key={rotulo} className="flex items-start justify-between rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-1.5">
            <span className="rotulo">{rotulo}</span>
            <span className="text-3xl font-semibold tracking-tight">{valor}</span>
            <span className={`flex items-center gap-1 text-sm ${positivo === true ? 'text-primary' : positivo === false ? 'text-destructive' : 'text-muted-foreground'}`}>
              {positivo === true && <TrendingUp className="size-3.5" />}
              {positivo === false && <TrendingDown className="size-3.5" />}
              {detalhe}
            </span>
          </div>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Icone className="size-5" />
          </span>
        </div>
      ))}
    </section>
  )
}
