import { z } from 'zod'
import { dadosPessoaisSchema } from './dados-pessoais.schema'
import { valoresSchema } from './valores.schema'

export const cenarioSchema = z.enum(['aleatorio', 'todas_aprovam', 'delta_falha', 'delta_timeout', 'nenhuma_aprova'])

export const cadastroSchema = dadosPessoaisSchema.merge(valoresSchema).extend({ cenario: cenarioSchema.optional() }).strict()

export type CadastroInput = z.infer<typeof cadastroSchema>
