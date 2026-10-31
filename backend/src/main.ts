import { criarApp } from './app'
import { carregarEnv } from './config/env'

const env = carregarEnv()
const app = criarApp({ env })

app.listen({ port: env.PORT, host: '0.0.0.0' }).catch(erro => {
  app.log.error(erro)
  process.exit(1)
})
