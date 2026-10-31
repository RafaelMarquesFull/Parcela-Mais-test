import type { ComponentProps, ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentProps<typeof Input>, 'onChange' | 'onBlur' | 'value'> & {
  id: string
  rotulo: string
  valor: string
  erro?: string
  dica?: string
  icone?: ReactNode
  acao?: ReactNode
  aoAlterar(valor: string): void
  aoSair(): void
}

export function CampoTexto({ id, rotulo, valor, erro, dica, icone, acao, className, aoAlterar, aoSair, ...resto }: Props) {
  const idErro = `${id}-erro`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="rotulo">
        {rotulo}
      </Label>
      <div className="relative">
        {icone && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground [&_svg]:size-4">{icone}</span>}
        <Input
          id={id}
          value={valor}
          onChange={e => aoAlterar(e.target.value)}
          onBlur={aoSair}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          className={cn('campo-escuro h-12 rounded-xl', icone && 'pl-10', acao && 'pr-11', className)}
          {...resto}
        />
        {acao && <span className="absolute inset-y-0 right-2 flex items-center">{acao}</span>}
      </div>
      {erro ? (
        <p id={idErro} role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : dica ? (
        <p className="text-sm text-muted-foreground">{dica}</p>
      ) : null}
    </div>
  )
}
