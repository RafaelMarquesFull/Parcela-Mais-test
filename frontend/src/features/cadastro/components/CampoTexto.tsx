import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = Omit<ComponentProps<typeof Input>, 'onChange' | 'onBlur' | 'value'> & {
  id: string
  rotulo: string
  valor: string
  erro?: string
  dica?: string
  aoAlterar(valor: string): void
  aoSair(): void
}

export function CampoTexto({ id, rotulo, valor, erro, dica, aoAlterar, aoSair, ...resto }: Props) {
  const idErro = `${id}-erro`
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        value={valor}
        onChange={e => aoAlterar(e.target.value)}
        onBlur={aoSair}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        {...resto}
      />
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
