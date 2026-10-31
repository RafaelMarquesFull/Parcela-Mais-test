import { Label } from '@/components/ui/label'
import type { Ordenacao } from '../ordenar'

export function SeletorOrdenacao({ valor, aoAlterar }: { valor: Ordenacao; aoAlterar(valor: Ordenacao): void }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="ordenacao" className="text-muted-foreground">
        Ordenar por
      </Label>
      <select
        id="ordenacao"
        value={valor}
        onChange={e => aoAlterar(e.target.value as Ordenacao)}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="menor_parcela">Menor parcela</option>
        <option value="menor_total">Menor custo total</option>
      </select>
    </div>
  )
}
