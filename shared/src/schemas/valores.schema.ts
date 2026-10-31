import { z } from 'zod'

export const valoresSchema = z.object({
  rendaMensal: z.number({ invalid_type_error: 'Informe a renda mensal' }).int().positive('Informe a renda mensal').safe(),
  valorTratamento: z
    .number({ invalid_type_error: 'Informe o valor do tratamento' })
    .int()
    .min(100_000, 'Valor deve estar entre R$ 1.000,00 e R$ 50.000,00')
    .max(5_000_000, 'Valor deve estar entre R$ 1.000,00 e R$ 50.000,00'),
})

export type ValoresInput = z.infer<typeof valoresSchema>
