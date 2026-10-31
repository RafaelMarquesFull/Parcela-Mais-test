import { PlusCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="size-3.5" /> Consulta multi-financeira instantânea
      </span>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Pré-aprovar um paciente</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
        Preencha os dados uma vez. Consultamos <strong className="font-semibold text-foreground">Alfa, Beta, Gama e Delta</strong> ao mesmo tempo e mostramos as
        ofertas em até 10 segundos, mesmo que alguma financeira não responda.
      </p>
      <Button size="lg" className="botao-brilho mt-6 h-12 px-6 text-base" render={<Link to="/consultas/nova" />}>
        <PlusCircle /> Nova consulta
      </Button>
    </section>
  )
}
