import { z } from 'zod'

export const listagemSchema = z
  .object({
    pagina: z.coerce.number().int().min(1).default(1),
    porPagina: z.coerce.number().int().min(1).max(50).default(5),
    busca: z.string().trim().max(120).optional(),
  })
  .strict()

export type ListagemInput = z.infer<typeof listagemSchema>
