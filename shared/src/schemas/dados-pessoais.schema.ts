import { z } from 'zod'
import { somenteDigitos, validarCpf } from '../cpf'
import { calcularIdade } from '../idade'

const dataValida = (texto: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [ano, mes, dia] = texto.split('-').map(Number)
  const data = new Date(Date.UTC(ano!, mes! - 1, dia!))
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes! - 1 && data.getUTCDate() === dia
}

export const dadosPessoaisSchema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo').max(120, 'Nome muito longo'),
  cpf: z.string().transform(somenteDigitos).refine(validarCpf, 'CPF inválido'),
  dataNascimento: z
    .string()
    .refine(dataValida, 'Data inválida')
    .refine(d => {
      const idade = calcularIdade(d, new Date())
      return idade >= 18 && idade <= 80
    }, 'Idade deve estar entre 18 e 80 anos'),
  celular: z.string().transform(somenteDigitos).refine(d => d.length === 10 || d.length === 11, 'Celular inválido'),
})

export type DadosPessoaisInput = z.infer<typeof dadosPessoaisSchema>
