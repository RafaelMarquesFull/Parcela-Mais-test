import { randomUUID } from 'node:crypto'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PrismaClient } from '@prisma/client'
import { criarPrismaClient, prepararSqlite } from '../../src/infra/database/prisma-client'

const pastaMigracoes = join(import.meta.dirname, '../../prisma/migrations')

export const usuarioSemeado = { id: 'usuario-teste', email: 'clinica@parcelamais.com', nome: 'Clínica Demo', senha: 'parcela123' }

export async function criarBancoTemporario(): Promise<{ prisma: PrismaClient; url: string; limpar(): Promise<void> }> {
  const arquivo = join(tmpdir(), `parcela-mais-${randomUUID()}.db`)
  const url = `file:${arquivo}`
  const prisma = criarPrismaClient(url)
  await prepararSqlite(prisma)
  for (const pasta of readdirSync(pastaMigracoes).filter(p => !p.endsWith('.toml')).sort()) {
    const sql = readFileSync(join(pastaMigracoes, pasta, 'migration.sql'), 'utf8')
    for (const comando of sql.split(';').map(c => c.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(comando)
  }
  const { default: bcrypt } = await import('bcryptjs')
  await prisma.usuario.create({ data: { id: usuarioSemeado.id, email: usuarioSemeado.email, nome: usuarioSemeado.nome, senhaHash: await bcrypt.hash(usuarioSemeado.senha, 4) } })
  return {
    prisma,
    url,
    limpar: async () => {
      await prisma.$disconnect()
      rmSync(arquivo, { force: true })
      rmSync(`${arquivo}-journal`, { force: true })
    },
  }
}
