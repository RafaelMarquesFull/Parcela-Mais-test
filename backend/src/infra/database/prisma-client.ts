import { PrismaClient } from '@prisma/client'

export function criarPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } })
}
