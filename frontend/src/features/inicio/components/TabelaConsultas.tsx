import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Link } from 'react-router'
import { formatarMoeda, type ConsultaResumo } from 'shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConsultas } from '../hooks/useConsultas'

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')
}

function situacao(c: ConsultaResumo) {
  if (c.status === 'em_andamento') return { texto: 'Em andamento', classe: 'border-border bg-muted text-muted-foreground', ponto: 'bg-muted-foreground', acao: 'Acompanhar' }
  if (c.aprovadas === 0) return { texto: 'Sem ofertas', classe: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', ponto: 'bg-amber-500', acao: 'Detalhes' }
  return { texto: `${c.aprovadas} aprovada${c.aprovadas > 1 ? 's' : ''}`, classe: 'border-primary/30 bg-primary/10 text-primary', ponto: 'bg-primary', acao: 'Ver ofertas' }
}

type Props = { titulo: string; descricao: string; porPagina: number }

export function TabelaConsultas({ titulo, descricao, porPagina }: Props) {
  const { pagina, totalPaginas, carregando, erro, irPara, buscar } = useConsultas({ porPagina })
  const inicio = pagina.total === 0 ? 0 : (pagina.pagina - 1) * pagina.porPagina + 1
  const fim = Math.min(pagina.pagina * pagina.porPagina, pagina.total)

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card" aria-busy={carregando}>
      <header className="flex flex-wrap items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 left-3.5 my-auto size-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por paciente…" aria-label="Buscar por paciente" className="campo-escuro h-11 rounded-xl pl-10" onChange={e => buscar(e.target.value)} />
        </div>
      </header>

      {erro ? (
        <p className="px-6 pb-6 text-sm text-destructive">{erro}</p>
      ) : pagina.total === 0 && !carregando ? (
        <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma consulta encontrada. A primeira aparece aqui assim que for feita.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-left">
                <th className="rotulo px-6 py-3 font-semibold">Paciente</th>
                <th className="rotulo hidden px-4 py-3 font-semibold md:table-cell">Data / hora</th>
                <th className="rotulo px-4 py-3 font-semibold">Valor solicitado</th>
                <th className="rotulo hidden px-4 py-3 font-semibold sm:table-cell">Status da consulta</th>
                <th className="rotulo px-6 py-3 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className={carregando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              {pagina.itens.map(c => {
                const s = situacao(c)
                return (
                  <tr key={c.id} className="border-b border-border last:border-b-0">
                    <td className="px-6 py-3.5">
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">{iniciais(c.pacienteNome)}</span>
                        <span className="font-medium">{c.pacienteNome}</span>
                      </span>
                    </td>
                    <td className="hidden px-4 py-3.5 text-muted-foreground md:table-cell">{dataCurta.format(new Date(c.criadaEm))}</td>
                    <td className="px-4 py-3.5 font-medium tabular-nums">{formatarMoeda(c.valorTratamento)}</td>
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.classe}`}>
                        <span className={`size-1.5 rounded-full ${s.ponto}`} />
                        {s.texto}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button variant="outline" size="sm" render={<Link to={`/consultas/${c.id}`} />}>
                        {s.acao}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <footer className="flex items-center justify-between gap-4 border-t border-border px-6 py-4 text-sm text-muted-foreground">
        <span>
          {inicio}–{fim} de {pagina.total}
        </span>
        <nav className="flex items-center gap-2" aria-label="Paginação">
          <Button variant="outline" size="icon" className="size-9" onClick={() => irPara(pagina.pagina - 1)} disabled={pagina.pagina <= 1} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <span className="tabular-nums">
            Página {pagina.pagina} de {totalPaginas}
          </span>
          <Button variant="outline" size="icon" className="size-9" onClick={() => irPara(pagina.pagina + 1)} disabled={pagina.pagina >= totalPaginas} aria-label="Próxima página">
            <ChevronRight />
          </Button>
        </nav>
      </footer>
    </section>
  )
}
