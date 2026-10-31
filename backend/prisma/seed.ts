import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('parcela123', 10)
  await prisma.usuario.upsert({
    where: { email: 'clinica@parcelamais.com' },
    update: {},
    create: { email: 'clinica@parcelamais.com', nome: 'Clínica Demo', senhaHash },
  })
}

main().finally(() => prisma.$disconnect())
