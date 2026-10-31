import { somenteDigitos } from './cpf'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarCpf(digitos: string): string {
  const d = somenteDigitos(digitos).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

export function mascararCpf(digitos: string): string {
  const d = somenteDigitos(digitos)
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

export function formatarCelular(digitos: string): string {
  const d = somenteDigitos(digitos).slice(0, 11)
  if (d.length <= 2) return d
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  const corte = resto.length > 8 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

export function formatarMoeda(centavos: number): string {
  return moeda.format(centavos / 100)
}

export function moedaParaCentavos(texto: string): number {
  const limpo = texto.replace(/[^\d,]/g, '')
  if (!limpo) return 0
  const [inteiro = '0', decimal = ''] = limpo.split(',')
  const centavos = (decimal + '00').slice(0, 2)
  return Number(inteiro) * 100 + Number(centavos)
}
