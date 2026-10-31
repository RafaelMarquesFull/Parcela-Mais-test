import { PrismaClient } from '@prisma/client'

export function criarPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } })
}

export async function prepararSqlite(prisma: PrismaClient): Promise<void> {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL')
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000')
}
