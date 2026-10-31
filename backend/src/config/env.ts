import { z } from 'zod'

const booleano = z.enum(['true', 'false']).transform(v => v === 'true')

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SIMULACAO_CENARIOS: booleano.default('false'),
  LIMITE_CONCORRENCIA: z.coerce.number().int().positive().default(5),
  JWT_SECRET: z.string().min(1),
  ORIGEM_FRONT: z.string().url().default('http://localhost:5173'),
})

export type Env = z.infer<typeof envSchema>

export function carregarEnv(fonte: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(fonte)
}
