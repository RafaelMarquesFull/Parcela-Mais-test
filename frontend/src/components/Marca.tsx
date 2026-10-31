import { cn } from '@/lib/utils'

export function Marca({ tamanho = 'md', className }: { tamanho?: 'md' | 'lg'; className?: string }) {
  const grande = tamanho === 'lg'
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-semibold tracking-tight', grande ? 'text-xl' : 'text-base', className)}>
      <span
        className={cn(
          'flex items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground botao-brilho',
          grande ? 'size-10 text-base' : 'size-7 text-xs',
        )}
      >
        P+
      </span>
      <span>
        Parcela<span className="text-primary">Mais</span>
      </span>
    </span>
  )
}
