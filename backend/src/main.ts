import { criarApp } from './app'
import { carregarEnv } from './config/env'
import { criarContainer } from './container'
import { criarPrismaClient, prepararSqlite } from './infra/database/prisma-client'

const env = carregarEnv()
const prisma = criarPrismaClient(env.DATABASE_URL)
await prepararSqlite(prisma)
const container = criarContainer({ env, prisma })
const app = criarApp({ env, container })

app.listen({ port: env.PORT, host: '0.0.0.0' }).catch(erro => {
  app.log.error(erro)
  process.exit(1)
})
