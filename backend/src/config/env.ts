import { z } from 'zod'

const booleano = z.enum(['true', 'false']).transform(v => v === 'true')

const SEGREDO_PADRAO = 'troque-este-segredo'

const envSchema = z
  .object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SIMULACAO_CENARIOS: booleano.default('false'),
  LIMITE_CONCORRENCIA: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  JWT_SECRET: z.string().min(1),
  ORIGEM_FRONT: z.string().url().default('http://localhost:5173'),
  })
  .refine(env => env.NODE_ENV !== 'production' || env.JWT_SECRET !== SEGREDO_PADRAO, { message: 'Defina um JWT_SECRET próprio em produção', path: ['JWT_SECRET'] })

export type Env = z.infer<typeof envSchema>

export function carregarEnv(fonte: Record<string, string | undefined> = process.env): Env {
  return envSchema.parse(fonte)
}
