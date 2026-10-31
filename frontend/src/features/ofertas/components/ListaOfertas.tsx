import { useMemo, useState } from 'react'
import type { ConsultaSnapshot, EscolhaInput } from 'shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { achatarOfertas, ordenarOfertas, type Ordenacao } from '../ordenar'
import { CardOferta } from './CardOferta'
import { SeletorOrdenacao } from './SeletorOrdenacao'

type Props = { consulta: ConsultaSnapshot; aoEscolher(entrada: EscolhaInput): Promise<void> }

export function ListaOfertas({ consulta, aoEscolher }: Props) {
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('menor_parcela')
  const [escolhendo, setEscolhendo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const ofertas = useMemo(() => ordenarOfertas(achatarOfertas(consulta.resultados), ordenacao), [consulta.resultados, ordenacao])
  const indisponiveis = consulta.resultados.filter(r => r.status === 'indisponivel').length

  const escolher = async (entrada: EscolhaInput) => {
    const chave = `${entrada.financeira}-${entrada.prazoMeses}`
    setEscolhendo(chave)
    setErro(null)
    try {
      await aoEscolher(entrada)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar a escolha')
    } finally {
      setEscolhendo(null)
    }
  }

  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ofertas disponíveis</h2>
          <p className="text-sm text-muted-foreground">
            {ofertas.length} opções de parcelamento
            {indisponiveis > 0 && ` · ${indisponiveis} financeira${indisponiveis > 1 ? 's' : ''} não respondeu`}
          </p>
        </div>
        <SeletorOrdenacao valor={ordenacao} aoAlterar={setOrdenacao} />
      </header>
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {ofertas.map((oferta, indice) => (
          <CardOferta
            key={`${oferta.financeira}-${oferta.prazoMeses}`}
            oferta={oferta}
            valorTratamento={consulta.valorTratamento}
            indice={indice}
            escolhendo={escolhendo === `${oferta.financeira}-${oferta.prazoMeses}`}
            aoEscolher={() => void escolher({ financeira: oferta.financeira, prazoMeses: oferta.prazoMeses })}
          />
        ))}
      </div>
    </section>
  )
}
