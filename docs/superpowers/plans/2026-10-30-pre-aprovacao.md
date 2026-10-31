# Pré-aprovação em múltiplas financeiras — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jornada web de pré-aprovação de crédito em 4 financeiras simuladas, com cadastro multi-step, resultados ao vivo via SSE, escolha de oferta, cenários forçáveis, testes, carga, layout de produto e login com refresh token.

**Architecture:** Monorepo com `shared` (Zod, CPF, Price, tipos), `backend` (Fastify em portas e adaptadores: `http → application → domain ← infra`, Prisma/SQLite) e `frontend` (Vite + React por feature, hooks concentram lógica, componentes só apresentam). O `POST /consultas` responde `202` imediato; a orquestração roda em paralelo com prazo de 10 s; o banco é a fonte da verdade e o SSE só avisa.

**Tech Stack:** Node 22, TypeScript 5, Fastify 5, Prisma 6 + SQLite, Zod 3, React 19, Vite 6, react-router 7, Tailwind 4 (`@tailwindcss/vite`), shadcn/ui, lucide-react, Vitest 3, Testing Library, k6 (Docker `grafana/k6`), Docker Compose.

**Spec:** `docs/superpowers/specs/2026-10-30-pre-aprovacao-design.md`

## Global Constraints

- Nenhum comentário em código. Nomes em português para domínio; técnico (`src`, `test`, `infra`) em inglês.
- Dinheiro em centavos inteiros; taxas em pontos-base inteiros (249 = 2,49%).
- Prazo global da orquestração: 10 000 ms. Fallback do SSE para polling: 2 000 ms sem `open`; polling a cada 1 000 ms.
- Limite de concorrência por financeira: 5 (env `LIMITE_CONCORRENCIA`, padrão 5).
- Access token JWT HS256, 15 min. Refresh 32 bytes, 7 dias, cookie `refresh` `httpOnly; SameSite=Strict; Path=/auth`.
- `bodyLimit` 16 384 bytes. Rate limit padrão 100 req/min por IP; `/auth/login` 10 req/min.
- shadcn: só `button, input, label, card, badge, alert, separator, tooltip`. `<select>` nativo em todo lugar.
- Sem framer-motion, sem lib de formulário, sem lib de máscara, sem store global.
- `prefers-reduced-motion` respeitado em toda animação.
- Ordem de construção: Fases 0–3 (base) → Fase 4 (layout) → Fase 5 (auth) → Fase 6 (README). Nunca pular.
- Commits pequenos em português no imperativo, sem prefixo `feat:`.

## Review Focus

1. CPF com máscara e espaços (`" 123.456.789-09 "`) deve validar igual ao cru — teste em Task 2.
2. Data de nascimento inválida (`2026-02-30`, `31/12/1990`) deve dar `400`, não `500` — teste em Task 5.
3. Resposta de financeira que chega **depois** do corte de 10 s não pode sobrescrever `indisponivel` nem publicar evento — teste em Task 10.
4. Duas requisições simultâneas com a mesma `Idempotency-Key` devem criar uma consulta só — teste em Task 14.
5. Reuso de refresh token já rotacionado revoga a família inteira e o refresh "novo" também para de funcionar — teste em Task 24.

---

## Fase 0 — Esqueleto

### Task 1: Monorepo, workspaces e `GET /config`

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.gitignore` (append), `.env.example`
- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/vitest.config.ts`, `shared/src/index.ts`
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/vitest.config.ts`, `backend/src/config/env.ts`, `backend/src/app.ts`, `backend/src/main.ts`, `backend/src/http/routes/config.routes.ts`
- Create: `frontend/` via `npm create vite@latest frontend -- --template react-ts`
- Test: `backend/test/integration/config.routes.test.ts`

**Interfaces:**
- Produces: `criarApp(opcoes: { env: Env }): FastifyInstance` em `backend/src/app.ts`; `Env = { PORT: number; DATABASE_URL: string; SIMULACAO_CENARIOS: boolean; LIMITE_CONCORRENCIA: number; JWT_SECRET: string; ORIGEM_FRONT: string }` e `carregarEnv(fonte = process.env): Env` em `env.ts`.

- [ ] **Step 1: Criar `package.json` raiz** com `"workspaces": ["shared", "backend", "frontend"]`, `"private": true`, scripts: `dev` (`npm run dev -w backend & npm run dev -w frontend`), `test` (`npm test --workspaces --if-present`), `test:backend`, `test:frontend`, `test:watch`, `build`. `engines.node >=22`.

- [ ] **Step 2: Criar `shared`** com `zod@^3.23`, `vitest@^3`, `typescript@^5`. `main: src/index.ts`, `types: src/index.ts`. `vitest.config.ts` com `include: ['test/**/*.test.ts']`.

- [ ] **Step 3: Criar `backend`** com deps `fastify@^5 @fastify/cors @fastify/cookie @fastify/rate-limit @prisma/client zod shared@*` e dev `prisma tsx vitest typescript @types/node`. Scripts: `dev` (`tsx watch src/main.ts`), `build`, `start`, `test` (`vitest run`), `test:watch`, `prisma:migrate`, `prisma:seed`.

- [ ] **Step 4: Escrever o teste**

```ts
import { criarApp } from '../../src/app'
import { carregarEnv } from '../../src/config/env'

it('GET /config devolve simulacaoHabilitada', async () => {
  const app = criarApp({ env: carregarEnv({ ...process.env, SIMULACAO_CENARIOS: 'true', JWT_SECRET: 'x', DATABASE_URL: 'file:./test.db' }) })
  const res = await app.inject({ method: 'GET', url: '/config' })
  expect(res.statusCode).toBe(200)
  expect(res.json()).toEqual({ simulacaoHabilitada: true })
})
```

- [ ] **Step 5: Rodar e ver falhar:** `npm test -w backend` → módulo `app` não existe.

- [ ] **Step 6: Implementar** `carregarEnv` com schema Zod (`PORT` default 3000, `SIMULACAO_CENARIOS` via `z.enum(['true','false']).transform`, `LIMITE_CONCORRENCIA` default 5, `ORIGEM_FRONT` default `http://localhost:5173`), `criarApp` registrando `@fastify/cors` (`origin: env.ORIGEM_FRONT, credentials: true`), `bodyLimit: 16384`, e `config.routes.ts` com `GET /config`. `main.ts` chama `carregarEnv()` e `app.listen({ port, host: '0.0.0.0' })`.

- [ ] **Step 7: Rodar e ver passar:** `npm test -w backend`.

- [ ] **Step 8: Criar frontend** com `npm create vite@latest frontend -- --template react-ts`, adicionar `shared@*` como dep e `vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event` como dev. Script `test: vitest run`, `vite.config.ts` com `test: { environment: 'jsdom', setupFiles: './test/setup.ts' }`.

- [ ] **Step 9: `npm install` na raiz, `npm test` passa (frontend sem testes é aceitável com `--passWithNoTests`). Commit:** `Cria monorepo com shared, backend e frontend`.

---

## Fase 1 — Shared

### Task 2: CPF

**Files:**
- Create: `shared/src/cpf.ts`
- Test: `shared/test/cpf.test.ts`

**Interfaces:**
- Produces: `somenteDigitos(texto: string): string`; `validarCpf(cpf: string): boolean`.

- [ ] **Step 1: Teste**

```ts
describe('validarCpf', () => {
  it.each(['52998224725', '529.982.247-25', ' 529.982.247-25 '])('aceita %s', c => expect(validarCpf(c)).toBe(true))
  it.each(['52998224724', '11111111111', '00000000000', '5299822472', '529982247255', 'abc', ''])('rejeita %s', c => expect(validarCpf(c)).toBe(false))
})
```

- [ ] **Step 2: Rodar e ver falhar:** `npm test -w shared`.
- [ ] **Step 3: Implementar** `somenteDigitos` (`replace(/\D/g, '')`) e `validarCpf` (11 dígitos, rejeita todos iguais, calcula os dois dígitos verificadores com pesos 10..2 e 11..2, resto `< 2 → 0` senão `11 − resto`).
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit:** `Adiciona validação de CPF`.

### Task 3: Tabela Price

**Files:**
- Create: `shared/src/price.ts`
- Test: `shared/test/price.test.ts`

**Interfaces:**
- Produces: `calcularParcela(valorCentavos: number, taxaPontosBase: number, meses: number): number`; `calcularOferta(valorCentavos, taxaPontosBase, meses): { prazoMeses: number; valorParcela: number; totalPago: number }`; tipo `OfertaPrazo`.

- [ ] **Step 1: Teste** (valores verificados à mão: R$ 10.000 a 2,49% em 12x = R$ 972,26)

```ts
it('R$ 10.000 a 2,49% em 12x dá parcela de R$ 972,26', () => {
  expect(calcularParcela(1_000_000, 249, 12)).toBe(97_226)
})
it('n = 1 devolve valor mais um mês de juros', () => {
  expect(calcularParcela(100_000, 200, 1)).toBe(102_000)
})
it('total pago é parcela vezes meses', () => {
  expect(calcularOferta(1_000_000, 249, 12)).toEqual({ prazoMeses: 12, valorParcela: 97_226, totalPago: 1_166_712 })
})
it('arredonda em centavos, nunca devolve fração', () => {
  expect(Number.isInteger(calcularParcela(123_457, 329, 10))).toBe(true)
})
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar** com `i = taxaPontosBase / 10_000`, `pmt = valor * i / (1 - (1 + i) ** -meses)`, `Math.round`.
- [ ] **Step 4: Rodar e ver passar.**
- [ ] **Step 5: Commit:** `Adiciona cálculo de parcela pela Tabela Price`.

### Task 4: Formatadores e idade

**Files:**
- Create: `shared/src/formatadores.ts`, `shared/src/idade.ts`
- Test: `shared/test/formatadores.test.ts`

**Interfaces:**
- Produces: `formatarCpf(digitos: string): string` → `529.982.247-25`; `mascararCpf(digitos): string` → `***.982.247-**`; `formatarCelular(digitos): string` → `(11) 91234-5678`; `formatarMoeda(centavos: number): string` → `R$ 1.500,00`; `moedaParaCentavos(texto: string): number` (`"1.500,00"`, `"1500"`, `"R$ 1.500,00"` → 150000); `calcularIdade(dataNascimento: string, hoje: Date): number`.

- [ ] **Step 1: Teste** com um caso por função, incluindo `calcularIdade('2000-10-31', new Date('2026-10-30'))` → 25 e `calcularIdade('2000-10-30', new Date('2026-10-30'))` → 26.
- [ ] **Step 2: Rodar e ver falhar.** **Step 3: Implementar** (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para moeda). **Step 4: Ver passar.**
- [ ] **Step 5: Commit:** `Adiciona formatadores e cálculo de idade`.

### Task 5: Schemas e tipos da API

**Files:**
- Create: `shared/src/schemas/dados-pessoais.schema.ts`, `valores.schema.ts`, `cadastro.schema.ts`, `escolha.schema.ts`, `login.schema.ts`, `shared/src/types/api.ts`, atualizar `shared/src/index.ts`
- Test: `shared/test/schemas.test.ts`

**Interfaces:**
- Produces:
  - `dadosPessoaisSchema`: `{ nome: string (3–120, trim); cpf: string (somenteDigitos → 11 dígitos → validarCpf); dataNascimento: string (regex `YYYY-MM-DD`, data real, idade 18–80 em relação a `new Date()`); celular: string (somenteDigitos → 10 ou 11 dígitos) }`.
  - `valoresSchema`: `{ rendaMensal: z.number().int().positive().safe(); valorTratamento: z.number().int().min(100_000).max(5_000_000) }`.
  - `cenarioSchema = z.enum(['aleatorio','todas_aprovam','delta_falha','delta_timeout','nenhuma_aprova'])`.
  - `cadastroSchema = dadosPessoaisSchema.merge(valoresSchema).extend({ cenario: cenarioSchema.optional() }).strict()`.
  - `escolhaSchema = z.object({ financeira: z.enum(['alfa','beta','gama','delta']), prazoMeses: z.number().int().positive() }).strict()`.
  - `loginSchema = z.object({ email: z.string().email(), senha: z.string().min(1) }).strict()`.
  - Mensagens em português nos `message`: `"CPF inválido"`, `"Idade deve estar entre 18 e 80 anos"`, `"Valor deve estar entre R$ 1.000,00 e R$ 50.000,00"`, `"Celular inválido"`, `"Data inválida"`.
  - Tipos em `types/api.ts`: `Cenario`, `NomeFinanceira`, `StatusResultado = 'consultando'|'aprovada'|'recusada'|'indisponivel'`, `MotivoIndisponivel = 'regra'|'erro'|'timeout'|'fila_cheia'`, `StatusConsulta = 'em_andamento'|'finalizada'`, `CadastroInput`, `EscolhaInput`, `LoginInput`, `ResultadoSnapshot`, `EscolhaSnapshot`, `ConsultaSnapshot`, `ConsultaResumo`, `EventoResultado = { tipo: 'resultado'; resultado: ResultadoSnapshot }`, `EventoFinalizada = { tipo: 'consulta-finalizada'; status: StatusConsulta; finalizadaEm: string }`, `EventoConsulta`, `ConfigResposta`, `LoginResposta`.

- [ ] **Step 1: Teste**

```ts
const hoje = new Date()
const nascidoHa = (anos: number, dias = 0) => { const d = new Date(hoje); d.setFullYear(d.getFullYear() - anos); d.setDate(d.getDate() - dias); return d.toISOString().slice(0, 10) }
const base = { nome: 'Ana Souza', cpf: '52998224725', dataNascimento: nascidoHa(30), celular: '11912345678', rendaMensal: 1_000_000, valorTratamento: 800_000 }

it('aceita cadastro válido', () => expect(cadastroSchema.safeParse(base).success).toBe(true))
it.each([17, 81])('rejeita idade %s', anos => expect(cadastroSchema.safeParse({ ...base, dataNascimento: nascidoHa(anos) }).success).toBe(false))
it.each([18, 80])('aceita idade %s', anos => expect(cadastroSchema.safeParse({ ...base, dataNascimento: nascidoHa(anos, 1) }).success).toBe(true))
it.each([99_999, 5_000_001, 1500.5, -1, '150000'])('rejeita valor %s', v => expect(cadastroSchema.safeParse({ ...base, valorTratamento: v }).success).toBe(false))
it('rejeita campo extra', () => expect(cadastroSchema.safeParse({ ...base, valorAprovado: 1 }).success).toBe(false))
it.each(['2026-02-30', '31/12/1990', '1990-13-01'])('rejeita data %s', d => expect(cadastroSchema.safeParse({ ...base, dataNascimento: d }).success).toBe(false))
it('rejeita prazo não inteiro na escolha', () => expect(escolhaSchema.safeParse({ financeira: 'alfa', prazoMeses: 12.5 }).success).toBe(false))
```

- [ ] **Step 2: Rodar e ver falhar.** **Step 3: Implementar.** **Step 4: Ver passar.**
- [ ] **Step 5: Commit:** `Adiciona schemas compartilhados e tipos da API`.

---

## Fase 2 — Backend

### Task 6: Prisma, banco e seed

**Files:**
- Create: `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `backend/src/infra/database/prisma-client.ts`
- Modify: `backend/package.json` (`prisma.seed`)

**Interfaces:**
- Produces: modelos `Usuario`, `RefreshToken`, `Paciente`, `Consulta`, `ResultadoFinanceira`, `Escolha` exatamente como a seção 6 da spec, com `@@unique([consultaId, financeira])`, `Escolha.consultaId @unique`, `Consulta.chaveIdempotencia @unique`, `RefreshToken.hash @unique`. `prisma-client.ts` exporta `criarPrismaClient(databaseUrl: string): PrismaClient`.
- Seed: usuário `clinica@parcelamais.com`, nome `Clínica Demo`, senha `parcela123` com hash bcrypt (adicionar dep `bcryptjs`).

- [ ] **Step 1: Escrever `schema.prisma`** (provider `sqlite`, `url = env("DATABASE_URL")`). Campos monetários `Int`. `prazos String`. Enums como `String` (SQLite não tem enum).
- [ ] **Step 2: `npx prisma migrate dev --name inicial -w backend`** gera `migrations/`. `npx prisma generate`.
- [ ] **Step 3: Escrever `seed.ts`** com upsert do usuário.
- [ ] **Step 4: Verificar:** `npm run prisma:seed -w backend` e `sqlite3 backend/dev.db 'select email from Usuario'` → `clinica@parcelamais.com`.
- [ ] **Step 5: Commit:** `Adiciona schema Prisma, migração inicial e seed`.

### Task 7: Domínio: entidades, portas e erros

**Files:**
- Create: `backend/src/domain/entities/{paciente,consulta,resultado-financeira,escolha,usuario,refresh-token}.ts`, `backend/src/domain/ports/{financeira.port,consulta.repository,paciente.repository,usuario.repository,refresh-token.repository,publicador-eventos.port,hasher.port,emissor-token.port,relogio.port}.ts`, `backend/src/domain/errors/domain-error.ts`

**Interfaces (produces, usadas por todas as tasks seguintes):**

```ts
type Paciente = { id: string; nome: string; cpf: string; dataNascimento: string; celular: string; rendaMensal: number; criadoEm: Date }
type Consulta = { id: string; usuarioId: string; pacienteId: string; valorTratamento: number; cenario: Cenario; chaveIdempotencia: string; status: StatusConsulta; criadaEm: Date; finalizadaEm: Date | null }
type ResultadoFinanceira = { id: string; consultaId: string; financeira: NomeFinanceira; status: StatusResultado; motivo: MotivoIndisponivel | null; valorAprovado: number | null; taxaMensal: number | null; prazos: number[]; duracaoMs: number | null; respondidoEm: Date | null }
type Escolha = { id: string; consultaId: string; resultadoId: string; prazoMeses: number; valorParcela: number; totalPago: number; criadaEm: Date }
type Usuario = { id: string; email: string; nome: string; senhaHash: string }
type RefreshToken = { id: string; usuarioId: string; hash: string; familiaId: string; expiraEm: Date; usadoEm: Date | null; revogadoEm: Date | null }

type DadosPaciente = Omit<Paciente, 'id' | 'criadoEm'> & { valorTratamento: number }
type RespostaFinanceira = { aprovada: true; valorAprovado: number; taxaMensal: number; prazos: number[] } | { aprovada: false }
interface Financeira { nome: NomeFinanceira; consultar(paciente: DadosPaciente, cenario: Cenario): Promise<RespostaFinanceira> }

interface Relogio { agora(): number; esperar(ms: number): Promise<void> }

type NovaConsulta = Omit<Consulta, 'id' | 'status' | 'criadaEm' | 'finalizadaEm'>
type NovoResultado = Omit<ResultadoFinanceira, 'id'>
type NovaEscolha = Omit<Escolha, 'id' | 'criadaEm'>
interface ConsultaRepositorio {
  criar(dados: NovaConsulta): Promise<Consulta>
  buscarPorId(id: string): Promise<Consulta | null>
  buscarPorChave(chave: string): Promise<Consulta | null>
  listar(usuarioId: string): Promise<ConsultaResumo[]>
  resultados(consultaId: string): Promise<ResultadoFinanceira[]>
  gravarResultado(dados: NovoResultado): Promise<ResultadoFinanceira>
  finalizar(id: string, finalizadaEm: Date): Promise<void>
  escolha(consultaId: string): Promise<Escolha | null>
  gravarEscolha(dados: NovaEscolha): Promise<Escolha>
}
interface PacienteRepositorio { criar(dados: Omit<Paciente, 'id' | 'criadoEm'>): Promise<Paciente>; buscarPorId(id: string): Promise<Paciente | null> }
interface UsuarioRepositorio { buscarPorEmail(email: string): Promise<Usuario | null>; buscarPorId(id: string): Promise<Usuario | null> }
interface RefreshTokenRepositorio { criar(dados: Omit<RefreshToken, 'id'>): Promise<RefreshToken>; buscarPorHash(hash: string): Promise<RefreshToken | null>; marcarUsado(id: string, quando: Date): Promise<void>; revogarFamilia(familiaId: string, quando: Date): Promise<void> }
interface PublicadorEventos { publicar(consultaId: string, evento: EventoConsulta): void; assinar(consultaId: string, ouvinte: (evento: EventoConsulta) => void): () => void }
interface Hasher { gerar(texto: string): Promise<string>; comparar(texto: string, hash: string): Promise<boolean> }
interface EmissorToken { emitir(payload: { sub: string; nome: string }): string; verificar(token: string): { sub: string; nome: string } | null }

class DomainError extends Error { constructor(public readonly codigo: string, mensagem: string) }
class ConsultaNaoEncontrada, OfertaInvalida, EscolhaConflitante, CredenciaisInvalidas, RefreshInvalido extends DomainError
```

- [ ] **Step 1: Escrever os arquivos** exatamente com essas formas. Sem lógica.
- [ ] **Step 2: `npx tsc --noEmit -p backend`** passa.
- [ ] **Step 3: Commit:** `Define entidades, portas e erros do domínio`.

### Task 8: Financeiras simuladas e cenários

**Files:**
- Create: `backend/src/infra/financeiras/{alfa,beta,gama,delta,cenarios,simulador-latencia,index}.ts`, `backend/test/helpers/relogio-falso.ts`
- Test: `backend/test/unit/financeiras.test.ts`

**Interfaces:**
- `criarRelogioFalso(): Relogio & { avancar(ms: number): Promise<void> }` (usa `vi.useFakeTimers` por fora; `esperar` = `new Promise(r => setTimeout(r, ms))`).
- `SimuladorLatencia { constructor(relogio: Relogio, aleatorio: () => number = Math.random); esperarEntre(minMs: number, maxMs: number): Promise<void>; esperarExato(ms: number): Promise<void> }`.
- `comportamento(cenario: Cenario, financeira: NomeFinanceira): { forcarAprovacao?: boolean; forcarRecusa?: boolean; forcarErro?: boolean; latenciaMs?: number; semErro?: boolean }` em `cenarios.ts`, tabela da seção 5 (`todas_aprovam` para Delta: `semErro: true, latenciaMs: 6000`; `delta_timeout`: `latenciaMs: 12000`).
- Cada classe `Alfa | Beta | Gama | Delta implements Financeira`, construtor `(latencia: SimuladorLatencia, aleatorio?: () => number)`.
- `criarFinanceiras(relogio: Relogio): Financeira[]` em `index.ts`.

- [ ] **Step 1: Teste** (com `vi.useFakeTimers()` e `aleatorio` fixo)

```ts
const paciente = { nome: 'A', cpf: '52998224725', dataNascimento: '1996-01-01', celular: '11912345678', rendaMensal: 1_000_000, valorTratamento: 800_000 }

it('Alfa aprova 100% quando renda x10 cobre o valor', async () => { ... expect(r).toEqual({ aprovada: true, valorAprovado: 800_000, taxaMensal: 249, prazos: [6, 12, 18] }) })
it('Alfa recusa quando renda x10 não cobre', ...)
it('Beta aprova no máximo 60%', ... valorAprovado: 480_000, taxaMensal: 199, prazos: [12, 18, 24])
it('Gama recusa menor de 25 anos', ...)
it('Gama recusa valor acima de 20.000', ...)
it('Delta lança erro quando aleatorio < 0.3', async () => { const d = new Delta(latencia, () => 0.1); await expect(d.consultar(paciente, 'aleatorio')).rejects.toThrow() })
it('Delta aprova quando aleatorio >= 0.3', ... valorAprovado: 800_000, taxaMensal: 219, prazos: [12, 24, 36])
it('cenário nenhuma_aprova faz Beta recusar', ...)
it('cenário delta_falha faz Delta lançar mesmo com aleatorio alto', ...)
it('cenário delta_timeout faz Delta responder só aos 12s', async () => { const p = d.consultar(paciente, 'delta_timeout'); await vi.advanceTimersByTimeAsync(11_999); /* pendente */ await vi.advanceTimersByTimeAsync(1); await expect(p).resolves.toMatchObject({ aprovada: true }) })
```

- [ ] **Step 2: Rodar e ver falhar.** **Step 3: Implementar.** Latências: Alfa 500–1500, Beta 2000–5000, Gama 1000–3000, Delta 4000–15000. **Step 4: Ver passar.**
- [ ] **Step 5: Commit:** `Implementa financeiras simuladas e cenários forçados`.

### Task 9: Limitador de concorrência

**Files:**
- Create: `backend/src/infra/financeiras/limitador-concorrencia.ts`
- Test: `backend/test/unit/limitador-concorrencia.test.ts`

**Interfaces:**
- `class LimitadorDeConcorrencia { constructor(opcoes: { limite: number; duracaoEstimadaMs: number }); adquirir(prazoRestanteMs: number): Promise<(() => void) | null>; emVoo(): number; naFila(): number }`. Espera prevista = `Math.ceil((emVoo + naFila + 1 - limite) / limite) * duracaoEstimadaMs`; se `> prazoRestanteMs`, devolve `null` sem enfileirar.

- [ ] **Step 1: Teste**

```ts
it('libera imediatamente abaixo do limite', async () => { const l = new LimitadorDeConcorrencia({ limite: 2, duracaoEstimadaMs: 1000 }); expect(await l.adquirir(10_000)).toBeTypeOf('function') })
it('enfileira quando cheio e libera ao soltar', async () => { ... terceiro pendente; solta o primeiro; terceiro resolve })
it('devolve null quando a espera prevista não cabe no prazo', async () => { limite 1, duracaoEstimada 5000, um em voo; expect(await l.adquirir(4000)).toBeNull() })
```

- [ ] **Step 2: Falhar. Step 3: Implementar. Step 4: Passar.**
- [ ] **Step 5: Commit:** `Adiciona limitador de concorrência por financeira`.

### Task 10: Orquestração da consulta

**Files:**
- Create: `backend/src/application/consultas/orquestrar-consulta.ts`, `backend/src/infra/events/canal-consultas.ts`, `backend/test/helpers/fake-financeira.ts`, `backend/test/helpers/repositorio-memoria.ts`
- Test: `backend/test/unit/orquestrar-consulta.test.ts`

**Interfaces:**
- `class CanalConsultas implements PublicadorEventos` (um `EventEmitter`, chave = `consultaId`).
- `criarFakeFinanceira(nome: NomeFinanceira): Financeira & { respondeEm(ms: number, resposta: RespostaFinanceira): void; falha(): void; nuncaResponde(): void }`.
- `class ConsultaRepositorioMemoria implements ConsultaRepositorio`, `class PacienteRepositorioMemoria implements PacienteRepositorio`.
- `class OrquestradorDeConsulta { constructor(deps: { financeiras: Financeira[]; limitadores: Record<NomeFinanceira, LimitadorDeConcorrencia>; consultas: ConsultaRepositorio; eventos: PublicadorEventos; relogio: Relogio; prazoMs: number }); executar(consulta: Consulta, paciente: Paciente): Promise<void> }`.
- `executar` grava 4 resultados `consultando` antes de começar; para cada financeira: `adquirir(prazoRestante)` → `null` grava `indisponivel/fila_cheia`; senão `race` com o prazo global; grava e publica `{ tipo: 'resultado', resultado }`; ao final (todos gravados ou prazo), `finalizar` e publica `consulta-finalizada`. Respostas após o corte: ignoradas (flag `encerrada`).

- [ ] **Step 1: Teste** (timers falsos, `prazoMs: 10_000`)

```ts
it('todas respondem antes do prazo: 4 resultados, nenhum indisponivel, consulta finalizada', ...)
it('uma estoura o prazo: vira indisponivel/timeout aos 10s, as outras mantêm resultado', async () => { delta.nuncaResponde(); ...; await vi.advanceTimersByTimeAsync(10_000); expect(resultado('delta')).toMatchObject({ status: 'indisponivel', motivo: 'timeout' }) })
it('uma falha: indisponivel/erro, as outras seguem', ...)
it('nenhuma responde: 4 indisponivel e consulta finalizada aos 10s', ...)
it('resposta tardia não sobrescreve indisponivel nem publica evento', async () => { delta.respondeEm(12_000, aprovada); ...; await vi.advanceTimersByTimeAsync(12_000); expect(resultado('delta').status).toBe('indisponivel'); expect(eventos.filter(e => e.tipo === 'resultado' && e.resultado.financeira === 'delta')).toHaveLength(0) })
it('fila cheia grava indisponivel/fila_cheia sem esperar', ...)
it('publica eventos na ordem de chegada e consulta-finalizada por último', ...)
it('duracaoMs reflete o tempo de resposta', ... alfa.respondeEm(700) → duracaoMs 700)
```

- [ ] **Step 2: Falhar. Step 3: Implementar. Step 4: Passar.**
- [ ] **Step 5: Commit:** `Implementa orquestração paralela com prazo e fila`.

### Task 11: Repositórios Prisma

**Files:**
- Create: `backend/src/infra/database/mappers/{consulta,paciente,resultado,escolha,usuario,refresh-token}.mapper.ts`, `backend/src/infra/database/repositories/prisma-{consulta,paciente,usuario,refresh-token}.repository.ts`, `backend/test/helpers/banco-temporario.ts`
- Test: `backend/test/integration/repositorios.test.ts`

**Interfaces:**
- `criarBancoTemporario(): Promise<{ prisma: PrismaClient; url: string; limpar(): Promise<void> }>` (copia migrações para `file:` em `os.tmpdir()` via `prisma migrate deploy` ou `prisma db push`, executa seed do usuário).
- Cada repositório `implements` sua porta e recebe `PrismaClient` no construtor. `prazos` serializado com `JSON.stringify`/`parse` no mapper.

- [ ] **Step 1: Teste**: round-trip de `criar` → `buscarPorId` para consulta, `gravarResultado` → `resultados` mantém `prazos: [6,12,18]`, `gravarEscolha` duas vezes na mesma consulta lança (violação de único), `listar` devolve resumo com `aprovadas` contado.
- [ ] **Step 2: Falhar. Step 3: Implementar. Step 4: Passar.**
- [ ] **Step 5: Commit:** `Implementa repositórios Prisma`.

### Task 12: Casos de uso: calcular e escolher oferta

**Files:**
- Create: `backend/src/application/consultas/calcular-ofertas.ts`, `backend/src/application/consultas/escolher-oferta.ts`
- Test: `backend/test/unit/escolher-oferta.test.ts`

**Interfaces:**
- `calcularOfertas(resultado: ResultadoFinanceira): OfertaPrazo[]` (vazio se não aprovada; usa `calcularOferta` do shared).
- `class EscolherOferta { constructor(consultas: ConsultaRepositorio); executar(consultaId: string, entrada: EscolhaInput): Promise<Escolha> }`: `ConsultaNaoEncontrada` se não existe; `OfertaInvalida` se financeira não `aprovada` ou prazo fora de `prazos`; se já há escolha igual devolve ela; se diferente `EscolhaConflitante`; senão calcula e grava.

- [ ] **Step 1: Teste** com repositório em memória: escolha válida grava `valorParcela` recalculado; prazo 48 → `OfertaInvalida`; financeira recusada → `OfertaInvalida`; repetir igual devolve a mesma; diferente → `EscolhaConflitante`.
- [ ] **Step 2–4.** **Step 5: Commit:** `Adiciona casos de uso de oferta`.

### Task 13: Casos de uso: criar, obter, listar; container

**Files:**
- Create: `backend/src/application/consultas/{criar-consulta,obter-consulta,listar-consultas}.ts`, `backend/src/container.ts`, `backend/src/infra/relogio-real.ts`

**Interfaces:**
- `class CriarConsulta { constructor(deps: { consultas; pacientes; orquestrador: OrquestradorDeConsulta; simulacaoHabilitada: boolean }); executar(usuarioId: string, chave: string, entrada: CadastroInput): Promise<{ id: string }> }`: se `buscarPorChave` existe devolve; senão cria paciente e consulta (cenario = entrada.cenario se habilitado, senão `'aleatorio'`), chama `orquestrador.executar(...)` **sem await** (com `.catch` logando), devolve `id`. Erro de único na criação → relê por chave.
- `class ObterConsulta { executar(id): Promise<{ consulta; paciente; resultados; escolha }> }` (`ConsultaNaoEncontrada`).
- `class ListarConsultas { executar(usuarioId): Promise<ConsultaResumo[]> }`.
- `criarContainer(env: Env, prisma: PrismaClient): Container` com `{ consultas, pacientes, usuarios, refreshTokens, eventos, relogio, orquestrador, criarConsulta, obterConsulta, listarConsultas, escolherOferta, usuarioPadraoId }`. Limitadores: `duracaoEstimadaMs` = latência máxima de cada financeira.

- [ ] **Step 1: Escrever** (testes de contrato vêm na Task 14). **Step 2: `tsc --noEmit` passa.**
- [ ] **Step 3: Commit:** `Adiciona casos de uso de consulta e container`.

### Task 14: Rotas HTTP de consulta, presenter, plugins

**Files:**
- Create: `backend/src/http/routes/consultas.routes.ts`, `backend/src/http/presenters/consulta.presenter.ts`, `backend/src/http/plugins/{error-handler,rate-limit,idempotency}.ts`, `backend/test/helpers/build-app.ts`
- Modify: `backend/src/app.ts` (`criarApp({ env, container })`)
- Test: `backend/test/integration/{criar-consulta,obter-consulta,escolha}.routes.test.ts`

**Interfaces:**
- `apresentarConsulta(dados: { consulta; paciente; resultados; escolha }): ConsultaSnapshot` (mascara CPF, `ofertas` via `calcularOfertas`, datas ISO).
- `error-handler`: `ZodError → 400 { erros: [{ campo, mensagem }] }`; `ConsultaNaoEncontrada → 404`; `EscolhaConflitante → 409`; `OfertaInvalida → 422`; `CredenciaisInvalidas | RefreshInvalido → 401`; resto `500 { mensagem: 'Erro interno' }`.
- `idempotency`: `preHandler` que exige header `Idempotency-Key` UUID em `POST /consultas` (`400` se ausente/inválido).
- `rate-limit`: `@fastify/rate-limit` `{ max: 100, timeWindow: '1 minute' }`.
- Rotas: `POST /consultas` → `202 { id }`; `GET /consultas` → `ConsultaResumo[]`; `GET /consultas/:id` → `ConsultaSnapshot`; `PUT /consultas/:id/escolha` → `200 EscolhaSnapshot`. Até a Task 25, `usuarioId = container.usuarioPadraoId`.
- `construirApp(opcoes?: { simulacao?: boolean; financeiras?: Financeira[]; relogio?: Relogio }): Promise<{ app; prisma; limpar }>` em `build-app.ts`, usando banco temporário e fakes.

- [ ] **Step 1: Testes**

```ts
it('POST /consultas devolve 202 com id e grava consulta', ...)
it('mesma Idempotency-Key devolve o mesmo id e cria uma consulta só', ...)
it('duas requisições simultâneas com a mesma chave criam uma consulta só', async () => { const [a, b] = await Promise.all([post(), post()]); expect(a.json().id).toBe(b.json().id); expect(await prisma.consulta.count()).toBe(1) })
it('sem Idempotency-Key devolve 400', ...)
it.each([{ valorTratamento: '150000' }, { valorTratamento: 1500.5 }, { valorTratamento: -1 }, { extra: 1 }, { cpf: '52998224724' }, { dataNascimento: '2026-02-30' }])('payload hostil %j devolve 400', ...)
it('GET /consultas/:id inexistente devolve 404', ...)
it('GET /consultas/:id devolve snapshot com ofertas calculadas e CPF mascarado', ...)
it('PUT escolha: prazo inexistente 422, financeira recusada 422, repetida 200, diferente 409', ...)
```

- [ ] **Step 2: Falhar. Step 3: Implementar. Step 4: Passar.**
- [ ] **Step 5: Commit:** `Expõe rotas de consulta com idempotência e tratamento de erros`.

### Task 15: SSE

**Files:**
- Create: `backend/src/http/sse/stream.ts`
- Modify: `backend/src/http/routes/consultas.routes.ts`
- Test: `backend/test/integration/eventos.routes.test.ts`

**Interfaces:**
- `iniciarStream(reply: FastifyReply): { enviar(evento: EventoConsulta, id?: string): void; fechar(): void }` escreve headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`, e `id:`/`event:`/`data:` por evento.
- `GET /consultas/:id/eventos`: `404` se não existe; se `finalizada`, envia `consulta-finalizada` e fecha; senão assina o canal, envia eventos, fecha em `consulta-finalizada` ou quando o cliente desconecta (`request.raw.on('close')` → cancela assinatura).

- [ ] **Step 1: Teste** (app com fake financeiras e timers falsos; `inject` resolve quando a resposta fecha): consulta finalizada devolve corpo com `event: consulta-finalizada`; consulta em andamento recebe um `event: resultado` por financeira e termina com `consulta-finalizada`; `404` para id inexistente.
- [ ] **Step 2–4.** **Step 5: Commit:** `Adiciona stream SSE de eventos da consulta`.

### Task 16: Cenários forçados ponta a ponta

**Files:**
- Test: `backend/test/integration/cenarios.routes.test.ts`

- [ ] **Step 1: Teste** com financeiras reais + relógio falso + `aleatorio` fixo, paciente de exemplo (renda 1 000 000, 30 anos, 800 000), avançando 10 000 ms: `todas_aprovam` → 4 `aprovada`; `delta_falha` → delta `indisponivel/erro`, outras `aprovada`; `delta_timeout` → delta `indisponivel/timeout`; `nenhuma_aprova` → 4 `recusada/regra`; com `SIMULACAO_CENARIOS=false`, `cenario` enviado é gravado como `aleatorio`.
- [ ] **Step 2: Rodar; ajustar o que falhar. Step 3: Commit:** `Cobre cenários forçados com testes de integração`.

---

## Fase 3 — Frontend base

### Task 17: Tailwind, shadcn, roteador e serviços

**Files:**
- Modify: `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/main.tsx`
- Create: `frontend/src/styles/globals.css`, `frontend/src/lib/cn.ts`, `frontend/src/components/ui/*` (via CLI), `frontend/src/app/{App,router}.tsx`, `frontend/src/services/{http,consultas.api,config.api}.ts`, `frontend/test/setup.ts`

**Interfaces:**
- `http.ts`: `requisitar<T>(caminho: string, init?: RequestInit): Promise<T>` com `BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`, `credentials: 'include'`, lança `ErroHttp { status; corpo }` em não-2xx.
- `consultas.api.ts`: `criarConsulta(entrada: CadastroInput, chave: string): Promise<{ id: string }>`; `obterConsulta(id): Promise<ConsultaSnapshot>`; `listarConsultas(): Promise<ConsultaResumo[]>`; `escolherOferta(id, entrada: EscolhaInput): Promise<EscolhaSnapshot>`; `urlEventos(id): string`.
- `config.api.ts`: `obterConfig(): Promise<ConfigResposta>`.
- Rotas iniciais: `/` → `CadastroPage`, `/consultas/:id` → `ConsultaPage` (placeholders).

- [ ] **Step 1:** `npm i -w frontend tailwindcss @tailwindcss/vite react-router lucide-react clsx tailwind-merge class-variance-authority`. `npx shadcn@latest init` e `add button input label card badge alert separator tooltip`.
- [ ] **Step 2:** Escrever serviços e roteador. `npm run build -w frontend` passa.
- [ ] **Step 3: Commit:** `Configura Tailwind, shadcn, rotas e serviços de API`.

### Task 18: Cadastro multi-step

**Files:**
- Create: `frontend/src/features/cadastro/{CadastroPage.tsx,state/reducer.ts,state/rascunho.ts,hooks/useFormulario.ts,components/{PassoDadosPessoais,PassoValores,NavegacaoPassos,IndicadorPasso,SeletorCenario}.tsx}`
- Test: `frontend/src/features/cadastro/__tests__/useFormulario.test.ts`

**Interfaces:**
- `EstadoCadastro = { passo: 1 | 2; valores: { nome; cpf; dataNascimento; celular; rendaMensal: number | null; valorTratamento: number | null; cenario: Cenario }; tocados: Partial<Record<Campo, boolean>>; erros: Partial<Record<Campo, string>>; chaveEnvio: string | null; enviando: boolean; erroEnvio: string | null }`.
- `Acao = { tipo: 'alterar'; campo; valor } | { tipo: 'tocar'; campo } | { tipo: 'avancar' } | { tipo: 'voltar' } | { tipo: 'iniciarEnvio'; chave } | { tipo: 'falharEnvio'; mensagem } | { tipo: 'restaurar'; estado }`.
- `rascunho.ts`: `salvarRascunho(estado)`, `lerRascunho(): EstadoCadastro | null`, `limparRascunho()` (chave `parcela-mais:cadastro`, try/catch).
- `useFormulario(opcoes: { aoEnviar(entrada: CadastroInput, chave: string): Promise<void>; valorInicial?: number }): { estado; alterar; tocar; avancar; voltar; enviar; passoValido: boolean }`. Validação: `dadosPessoaisSchema` no passo 1, `valoresSchema` no passo 2; erro de campo só aparece se tocado ou já teve erro. `enviar` gera `crypto.randomUUID()` uma vez e reutiliza se `chaveEnvio` já existe.
- `PassoValores` recebe `simulacaoHabilitada` e renderiza `SeletorCenario` (`<select>` com os 5 cenários).

- [ ] **Step 1: Teste** (`renderHook`): avançar bloqueado com CPF inválido; avançar com dados válidos vai ao passo 2; voltar preserva valores; `restaurar` de `sessionStorage` ao montar; `enviar` chama `aoEnviar` com centavos e mesma chave em duas tentativas após falha.
- [ ] **Step 2–4.**
- [ ] **Step 5: Montar componentes** com `Input`/`Label`/`Button`, máscaras via formatadores do shared, `aria-invalid` e `aria-describedby` no erro. `CadastroPage` lê `obterConfig()` e navega para `/consultas/:id` após `202`.
- [ ] **Step 6: Commit:** `Implementa cadastro em dois passos com rascunho`.

### Task 19: Consulta ao vivo

**Files:**
- Create: `frontend/src/features/consulta/{ConsultaPage.tsx,hooks/{useConsulta,useEventosConsulta}.ts,components/{PainelFinanceiras,CardFinanceira,StatusFinanceira}.tsx}`
- Test: `frontend/src/features/consulta/__tests__/useEventosConsulta.test.ts`

**Interfaces:**
- `useEventosConsulta(opcoes: { id: string; ativo: boolean; aoResultado(r: ResultadoSnapshot): void; aoFinalizar(): void; recarregar(): Promise<void>; criarEventSource?: (url: string) => EventSource; esperaOpenMs?: number; intervaloPollingMs?: number }): { modo: 'sse' | 'polling' | 'parado' }`. Sem `open` em `esperaOpenMs` (2000) fecha e faz polling via `recarregar` a cada `intervaloPollingMs` (1000) até `ativo` virar falso. Em `error` do `EventSource`, chama `recarregar()`.
- `useConsulta(id): { consulta: ConsultaSnapshot | null; carregando; erro; modo; recarregar }`: busca snapshot, aplica eventos em estado local, passa `ativo = consulta?.status === 'em_andamento'`.
- `ConsultaPage` escolhe a vista: `em_andamento` → `PainelFinanceiras`; `finalizada` com `escolha` → `Confirmacao`; `finalizada` com alguma aprovada → `ListaOfertas`; senão `SemOfertas`.

- [ ] **Step 1: Teste** com `EventSource` falso injetado: evento `resultado` chama `aoResultado`; `consulta-finalizada` chama `aoFinalizar` e fecha; sem `open` em 2000 ms muda para `polling` e chama `recarregar` a cada 1000 ms; `ativo=false` para o polling.
- [ ] **Step 2–4.** **Step 5: Componentes** (`Badge` por status com ícone lucide: `Loader2` girando, `CheckCircle2`, `XCircle`, `AlertTriangle`; tempo decorrido com `duracaoMs`).
- [ ] **Step 6: Commit:** `Implementa consulta ao vivo com SSE e fallback para polling`.

### Task 20: Ofertas, sem ofertas, confirmação

**Files:**
- Create: `frontend/src/features/ofertas/{ordenar.ts,components/{ListaOfertas,CardOferta,SeletorOrdenacao,AvisoValorMenor,SemOfertas,Confirmacao}.tsx}`
- Test: `frontend/src/features/ofertas/__tests__/ordenar.test.ts`

**Interfaces:**
- `type Ordenacao = 'menor_parcela' | 'menor_total'`; `type OfertaPlana = { financeira: NomeFinanceira; valorAprovado: number; taxaMensal: number; prazoMeses; valorParcela; totalPago }`; `achatarOfertas(resultados: ResultadoSnapshot[]): OfertaPlana[]`; `ordenarOfertas(ofertas: OfertaPlana[], criterio: Ordenacao): OfertaPlana[]` (estável; empate por `financeira`).
- `ListaOfertas` props `{ consulta: ConsultaSnapshot; aoEscolher(entrada: EscolhaInput): Promise<void> }`; mostra `AvisoValorMenor` quando `valorAprovado < valorTratamento`.
- `SemOfertas` props `{ consulta; aoTentarValorMenor(): void }`: lista motivo por financeira (`recusada` → "recusou pela política de crédito"; `indisponivel/timeout` → "não respondeu a tempo"; `erro` → "falhou"; `fila_cheia` → "estava sobrecarregada"), botão navega para `/` com `valorInicial` = 80% do valor via `state` do router.
- `Confirmacao` props `{ consulta }`.

- [ ] **Step 1: Teste** `ordenarOfertas` por parcela e por total, com empate estável.
- [ ] **Step 2–4.** **Step 5: Componentes.** `escolherOferta` → `recarregar()` para cair em `Confirmacao`.
- [ ] **Step 6: Commit:** `Implementa ofertas, ordenação e confirmação`.

### Task 21: Docker Compose e verificação manual

**Files:**
- Create: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`
- Modify: `.env.example`

- [ ] **Step 1:** Backend multi-stage (build TS, `prisma migrate deploy && prisma db seed` no entrypoint, volume `./data:/app/data`, `DATABASE_URL=file:/app/data/app.db`). Frontend: build Vite e servir com nginx em `:5173`, `VITE_API_URL=http://localhost:3000` em build arg.
- [ ] **Step 2: Verificar:** `docker compose up --build`; abrir `http://localhost:5173`; rodar os 5 cenários com o paciente de exemplo; abrir 7 abas e confirmar que a 7ª cai em polling (`modo` visível num badge discreto "ao vivo"/"atualizando").
- [ ] **Step 3: Commit:** `Adiciona Docker Compose para subir tudo com um comando`.

### Task 22: k6

**Files:**
- Create: `backend/test/load/{helpers,load,stress,spike}.js`
- Modify: `package.json` raiz (scripts `test:load`, `test:stress`, `test:spike` = `docker run --rm -i --network host -v $PWD/backend/test/load:/scripts grafana/k6 run /scripts/<x>.js`)

- [ ] **Step 1:** `helpers.js` exporta `novoPaciente()` (CPF válido gerado, 30 anos, renda 1 000 000, valor 800 000) e `cabecalhos()` (`Idempotency-Key` UUID). Fluxo por VU: `POST /consultas` → `GET /consultas/:id`.
- [ ] **Step 2:** `load.js`: `vus: 20, duration: '1m'`, thresholds `http_req_duration: ['p(95)<300']`, `http_req_failed: ['rate==0']` (status ≥ 500 conta como falha; `429` não). `stress.js`: `stages` 0→50→100→200 (30 s cada) → 0 (30 s), thresholds `5xx < 1%`, `p(95) < 300` na última etapa (usar `tags`). `spike.js`: `stages` 0→300 em 5 s, 20 s, 0 em 5 s; threshold `checks` de `/config` em 100%.
- [ ] **Step 3: Rodar os três** com o compose no ar; anotar números para o README.
- [ ] **Step 4: Commit:** `Adiciona testes de carga, estresse e pico com k6`.

---

## Fase 4 — Layout e tema

### Task 23: Shell, tema, início e animações

**Files:**
- Create: `frontend/src/app/theme/{tokens.css,useTema.ts}`, `frontend/src/app/layout/{Shell,Header,Sidebar,AlternadorTema}.tsx`, `frontend/src/features/inicio/{InicioPage.tsx,components/{AcaoNovaConsulta,ListaConsultasRecentes}.tsx}`
- Modify: `frontend/src/app/router.tsx` (`/` → `InicioPage`, `/consultas/nova` → `CadastroPage`, rotas dentro do `Shell`), `frontend/src/styles/globals.css`, componentes de cadastro/consulta/ofertas (classes de transição)

**Interfaces:**
- `tokens.css`: variáveis shadcn (`--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`) em `:root` e `.dark`. Paleta clara: primária `oklch(0.55 0.15 160)` (verde-azulado), fundo `oklch(0.99 0 0)`. Escura: fundo `oklch(0.15 0.01 250)`.
- `useTema(): { tema: 'claro' | 'escuro'; alternar(): void }` persistido em `localStorage` (`parcela-mais:tema`), aplica classe `dark` em `<html>`, inicial por `prefers-color-scheme`.
- `Shell`: `header` fixo (logo texto "Parcela Mais", nome do usuário quando houver, `AlternadorTema`, botão sair quando houver auth), `aside` com links `Início` (`Home`), `Nova consulta` (`PlusCircle`), `Consultas` (`List`) usando `NavLink`, recolhe para ícones abaixo de 768 px; `main` com `max-w-5xl`.
- Animações (CSS em `globals.css`, todas dentro de `@media (prefers-reduced-motion: no-preference)`): `.passo-entrar` (translateX 12px → 0 + opacity, 180 ms), `.card-status` (`transition: transform 160ms, background-color 200ms`; `data-status` muda → `scale(1.01)` breve via `@starting-style`), `.oferta-entrar` com `animation-delay: calc(var(--i) * 40ms)`, `html { transition: background-color 200ms, color 200ms }`.

- [ ] **Step 1: Implementar tema e Shell.** **Step 2: `InicioPage`** com `AcaoNovaConsulta` (card grande com `Button` → `/consultas/nova`) e `ListaConsultasRecentes` (`listarConsultas()`, 10 últimas, link para `/consultas/:id`).
- [ ] **Step 3: Aplicar classes de animação** nos pontos listados. Verificar com `prefers-reduced-motion` ativo que nada anima.
- [ ] **Step 4: Verificação visual** nas duas paletas, 375 px e 1280 px. Usar os skills `frontend-design`, `design-motion-principles` e `pristine` nesta task.
- [ ] **Step 5: Commit:** `Adiciona layout com header, sidebar, tema e página inicial`.

---

## Fase 5 — Auth

### Task 24: Backend: hasher, JWT, casos de uso de sessão

**Files:**
- Create: `backend/src/infra/auth/{bcrypt-hasher,jwt-emissor}.ts`, `backend/src/application/auth/{autenticar,renovar-sessao,encerrar-sessao}.ts`, `backend/test/helpers/repositorio-memoria.ts` (adicionar `UsuarioRepositorioMemoria`, `RefreshTokenRepositorioMemoria`)
- Test: `backend/test/unit/renovar-sessao.test.ts`

**Interfaces:**
- `BcryptHasher implements Hasher` (`bcryptjs`, custo 10). `JwtEmissor implements EmissorToken` (`jsonwebtoken`, HS256, `expiresIn: '15m'`).
- `gerarRefresh(): { token: string; hash: string }` (32 bytes `randomBytes` em base64url; hash SHA-256 hex) em `renovar-sessao.ts`.
- `class Autenticar { constructor(deps: { usuarios; refreshTokens; hasher; emissor; relogio }); executar(entrada: LoginInput): Promise<{ accessToken: string; refreshToken: string; usuario: { nome: string } }> }` → `CredenciaisInvalidas`.
- `class RenovarSessao { executar(refreshToken: string): Promise<{ accessToken; refreshToken }> }`: busca por hash; inexistente, expirado ou revogado → `RefreshInvalido`; **já usado** → `revogarFamilia` e `RefreshInvalido`; senão `marcarUsado`, cria novo na mesma família, emite access.
- `class EncerrarSessao { executar(refreshToken: string): Promise<void> }` revoga a família.

- [ ] **Step 1: Teste**

```ts
it('rotaciona: devolve novo refresh e o antigo passa a ser inválido', ...)
it('reuso de refresh já rotacionado revoga a família inteira, inclusive o novo', async () => { const r1 = await renovar.executar(t0); await expect(renovar.executar(t0)).rejects.toThrow(RefreshInvalido); await expect(renovar.executar(r1.refreshToken)).rejects.toThrow(RefreshInvalido) })
it('refresh expirado é inválido', ...)
it('autenticar com senha errada lança CredenciaisInvalidas', ...)
```

- [ ] **Step 2–4.** **Step 5: Commit:** `Adiciona autenticação com refresh token rotativo`.

### Task 25: Backend: rotas de auth, proteção das rotas, repositórios

**Files:**
- Create: `backend/src/http/routes/auth.routes.ts`, `backend/src/http/plugins/autenticacao.ts`, `backend/src/infra/database/repositories/prisma-{usuario,refresh-token}.repository.ts` (se não feitos na Task 11)
- Modify: `backend/src/container.ts` (remover `usuarioPadraoId`), `backend/src/http/routes/consultas.routes.ts`, `backend/src/app.ts` (`@fastify/cookie`), `backend/test/helpers/{build-app,login}.ts`, `backend/test/load/helpers.js` (login em `setup()`), todos os testes de integração (passam a enviar Bearer)
- Test: `backend/test/integration/auth.routes.test.ts`

**Interfaces:**
- `autenticacao.ts`: decorator `app.autenticar` (`preHandler`) lendo `Authorization: Bearer` **ou** `?token=` (só na rota de eventos); popula `request.usuario = { id, nome }`; `401` sem token válido.
- `POST /auth/login` (rate limit `max: 10`), `POST /auth/refresh`, `POST /auth/logout` conforme seção 4. Cookie `refresh` com `maxAge: 7 dias`.
- `login.ts` helper: `autenticarParaTeste(app): Promise<{ bearer: string; cookie: string }>`.

- [ ] **Step 1: Testes**: login `200` com `accessToken` e `set-cookie` httpOnly; senha errada `401`; `GET /consultas` sem Bearer `401`; `POST /auth/refresh` com cookie devolve novo access e novo cookie; reuso do cookie antigo `401`; `logout` `204` e refresh seguinte `401`; `GET /consultas/:id/eventos?token=` aceita.
- [ ] **Step 2–4.** Atualizar testes antigos e k6. **Step 5: Commit:** `Protege rotas com Bearer e expõe login, refresh e logout`.

### Task 26: Frontend: login, sessão e rota protegida

**Files:**
- Create: `frontend/src/features/auth/{LoginPage.tsx,hooks/useAuth.tsx,components/FormularioLogin.tsx}`, `frontend/src/app/RotaProtegida.tsx`, `frontend/src/services/auth.api.ts`
- Modify: `frontend/src/services/http.ts`, `frontend/src/services/consultas.api.ts` (`urlEventos` com `?token=`), `frontend/src/app/{router,layout/Header}.tsx`
- Test: `frontend/src/features/auth/__tests__/useAuth.test.tsx`

**Interfaces:**
- `sessao.ts` (dentro de `http.ts`): `definirToken(token: string | null)`, `obterToken()`, `renovarToken(): Promise<string | null>` (uma promessa compartilhada entre chamadas concorrentes). `requisitar` anexa Bearer; em `401` chama `renovarToken()` uma vez e repete; se falhar, `definirToken(null)` e dispara `window.dispatchEvent(new Event('sessao-encerrada'))`.
- `auth.api.ts`: `login(entrada: LoginInput): Promise<LoginResposta>`, `refresh(): Promise<{ accessToken }>`, `logout(): Promise<void>`.
- `AuthProvider` + `useAuth(): { usuario: { nome } | null; carregando: boolean; entrar(entrada): Promise<void>; sair(): Promise<void> }`: ao montar tenta `refresh()` silencioso; escuta `sessao-encerrada`.
- `RotaProtegida`: `carregando` → esqueleto; sem usuário → `<Navigate to="/login" state={{ de: location }} />`.
- `LoginPage`: `/login`, card centralizado, `loginSchema` na validação, após sucesso navega para `state.de ?? '/'`. Usuário logado em `/login` → `/`.

- [ ] **Step 1: Teste** com `fetch` mockado: `401` → chama refresh → repete e devolve; refresh falha → `usuario` vira `null`; duas requisições `401` simultâneas disparam um refresh só.
- [ ] **Step 2–4.** **Step 5: Componentes e rotas.** **Step 6: Commit:** `Adiciona login, renovação automática e rotas protegidas`.

---

## Fase 6 — README

### Task 27: README e `.env.example`

**Files:**
- Modify: `README.md`, `.env.example`

- [ ] **Step 1: Escrever** seguindo a seção 10 da spec, em primeira pessoa, direto. Inclui credenciais (`clinica@parcelamais.com` / `parcela123`), paciente de exemplo, tabela de cenários, números do k6 obtidos na Task 22, e a seção de uso de IA.
- [ ] **Step 2: Reler** procurando frases genéricas; cortar.
- [ ] **Step 3: Commit:** `Escreve README com decisões, cenários e resultados`.

---

## Self-review

- **Cobertura da spec:** stack (T1, T17), estrutura (todas), contrato (T14, T15, T25), orquestração (T8–T10), banco (T6, T11), Price (T3), front (T18–T20, T23, T26), limite do navegador (T19 fallback, T21 verificação), testes (cada task), k6 (T22), README (T27). Fora de escopo respeitado.
- **Consistência de nomes:** `OrquestradorDeConsulta.executar`, `ConsultaRepositorio.resultados/escolha`, `useEventosConsulta` com `recarregar`, `apresentarConsulta`, `criarContainer`, `construirApp` usados com os mesmos nomes entre tasks.
- **Review Focus:** 1 → T2; 2 → T5 e T14; 3 → T10; 4 → T14; 5 → T24.
