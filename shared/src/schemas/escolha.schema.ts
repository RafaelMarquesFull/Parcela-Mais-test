import { z } from 'zod'

export const financeiraSchema = z.enum(['alfa', 'beta', 'gama', 'delta'])

export const escolhaSchema = z.object({ financeira: financeiraSchema, prazoMeses: z.number().int().positive() }).strict()

export type EscolhaInput = z.infer<typeof escolhaSchema>
