import type { Cenario } from 'shared'
import { Label } from '@/components/ui/label'

const opcoes: Array<{ valor: Cenario; rotulo: string }> = [
  { valor: 'aleatorio', rotulo: 'Aleatório (comportamento real)' },
  { valor: 'todas_aprovam', rotulo: 'Todas aprovam' },
  { valor: 'delta_falha', rotulo: 'Delta falha' },
  { valor: 'delta_timeout', rotulo: 'Delta estoura o tempo' },
  { valor: 'nenhuma_aprova', rotulo: 'Nenhuma aprova' },
]

export function SeletorCenario({ valor, aoAlterar }: { valor: Cenario; aoAlterar(valor: Cenario): void }) {
  return (
    <div className="grid gap-1.5 rounded-lg border border-dashed border-border p-3">
      <Label htmlFor="cenario" className="rotulo">
        Cenário de simulação
      </Label>
      <select
        id="cenario"
        value={valor}
        onChange={e => aoAlterar(e.target.value as Cenario)}
        className="campo-escuro h-11 rounded-xl border border-border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {opcoes.map(o => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">Visível só com a simulação habilitada no servidor.</p>
    </div>
  )
}
