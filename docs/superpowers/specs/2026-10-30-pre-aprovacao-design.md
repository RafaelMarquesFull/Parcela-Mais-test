# Pré-aprovação em múltiplas financeiras — Design

Case técnico Parcela Mais. Jornada web em três etapas: cadastro do paciente, pré-aprovação em 4 financeiras simuladas em paralelo, escolha de oferta.

## 1. Objetivo e critérios

**Entregar:** jornada completa, cenários forçáveis para demonstração, testes nas partes críticas, README com decisões. Esforço alvo de 4 a 6 horas.

**O que a avaliação observa:** comportamento sob falha, arquitetura do front, contrato de API e orquestração, correção dos cálculos, testes, comunicação. Decisões bem explicadas valem mais que quantidade de funcionalidades.

**Pano de fundo real (não aplicado no case, só orienta escolhas):** o front atual da empresa é Bubble, pesado, e está sendo migrado para React em etapas. Decisões que conversam com isso: front leve, regra de negócio no backend, contrato de API limpo o bastante para qualquer cliente consumir.

**Regras de código:** clean code simplificado, arquitetura simples, nenhum comentário no código, README com voz humana. Camada de dados atrás de interfaces de repositório. DTOs/schemas compartilhados e úteis. Comandos prontos para teste de carga, estresse e pico.

## 2. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Front | Vite + React + TypeScript, react-router | Bundle pequeno, sem framework de servidor; duas rotas bastam |
| UI | Tailwind (plugin Vite) + shadcn/ui, 6 componentes: button, input, label, card, badge, alert | Código fica no repo, CSS compilado e purgado, acessibilidade via Radix. `<select>` nativo para cenário e ordenação |
| Back | Fastify + TypeScript | Leve, suporte direto a resposta streaming para SSE, `inject()` para testes sem porta |
| Banco | SQLite via Prisma, atrás de interfaces de repositório | Sem container de banco; Prisma pelo schema legível e fácil de defender |
| Validação | Zod em `packages/shared`, usado por front e API | Um schema, mensagens iguais nos dois lados |
| Testes | Vitest (todos os pacotes), Testing Library, k6 via Docker | Um runner só; k6 para carga/estresse/pico |
| Execução | npm workspaces, Docker Compose com um comando | `docker compose up` sobe API e front |

Fontes do sistema, sem CDN em runtime. O compose funciona sem internet depois do build.

### Estrutura do monorepo

```
apps/web/src/
  cadastro/     CadastroPage, useFormulario, PassoDadosPessoais, PassoValores, NavegacaoPassos
  consulta/     ConsultaPage, useConsulta, PainelFinanceiras, ListaOfertas, SemOfertas, Confirmacao
  api/          cliente HTTP (um arquivo)
  ui/           componentes shadcn
apps/api/src/
  consultas/    rotas, OrquestradorDeConsulta, ConsultaRepositorio (porta) + PrismaConsultaRepositorio
  pacientes/    PacienteRepositorio (porta) + Prisma
  financeiras/  Financeira (porta), Alfa, Beta, Gama, Delta, LimitadorDeConcorrencia, cenários
  infra/        prisma, sse (canal de eventos), rate limit, config
packages/shared/src/
  schemas/      dadosPessoais, valores, cadastro, escolha
  cpf.ts  price.ts  formatadores.ts  tipos da API
tests/k6/       load.js, stress.js, spike.js
```

Padrões adotados: custom hooks concentram lógica; container/presentational; inputs controlados; pastas por feature; portas e adaptadores no backend. Não adotados: FSD completo, Atomic Design, HOC/render props, compound components (tamanho do projeto não paga a burocracia).

## 3. Contrato da API

Todos os valores monetários em centavos inteiros. Taxas em pontos-base (249 = 2,49%).

### `GET /config`
Resposta: `{ simulacaoHabilitada: boolean }`. O front só mostra o seletor de cenário quando `true`.

### `POST /consultas`
Headers: `Idempotency-Key: <uuid>` (obrigatório).
Body (`cadastroSchema`, estrito):
```
{ nome, cpf (11 dígitos), dataNascimento (YYYY-MM-DD), celular (dígitos),
  rendaMensal, valorTratamento, cenario? }
```
Resposta `202 { id }`. Salva paciente e consulta, dispara orquestração, responde sem esperar financeiras.
Mesma `Idempotency-Key` repetida: devolve `202` com o mesmo `id`, sem criar nada. Índice único no banco resolve corrida.
`400` com lista de erros do Zod quando inválido. `cenario` é ignorado quando simulação está desabilitada.

### `GET /consultas/:id` (snapshot)
```
{
  id, status: "em_andamento" | "finalizada", valorTratamento, cenario, criadaEm, finalizadaEm,
  paciente: { nome, cpf (mascarado), ... },
  resultados: [{
    financeira, status: "consultando" | "aprovada" | "recusada" | "indisponivel",
    motivo?: "regra" | "erro" | "timeout" | "fila_cheia",
    valorAprovado?, taxaMensal?, duracaoMs?,
    ofertas?: [{ prazoMeses, valorParcela, totalPago }]
  }],
  escolha?: { financeira, prazoMeses, valorParcela, totalPago }
}
```
`ofertas` é calculado na resposta (Tabela Price), não armazenado. `404` se não existe.

### `GET /consultas/:id/eventos` (SSE)
`Content-Type: text/event-stream`. Eventos:
- `resultado` — um por financeira, `data` = o item de `resultados` do snapshot. `id` do evento = id do registro.
- `consulta-finalizada` — `data` = `{ status, finalizadaEm }`, e a conexão fecha.

Se a consulta já está finalizada ao abrir, envia `consulta-finalizada` na hora e fecha. Nunca dispara orquestração. Várias conexões na mesma consulta recebem os mesmos eventos.

### `PUT /consultas/:id/escolha`
Body (`escolhaSchema`): `{ financeira, prazoMeses }`. O cliente envia intenção, não valores.
O servidor busca o resultado no banco, confere `aprovada` e que o prazo existe, recalcula parcela e total, grava.
`200` com a escolha. `422` se financeira não aprovou ou prazo inexistente. `409` se já existe escolha diferente. Mesma escolha repetida → `200`.

### Proteções transversais
- `bodyLimit` de 16 kB.
- Rate limit por IP (`@fastify/rate-limit`), `429` com `Retry-After`.
- `Idempotency-Key` validado como UUID.
- Schemas com `.strict()`, `.int()`, `.safe()`, faixas explícitas.

## 4. Orquestração

```
OrquestradorDeConsulta.executar(consultaId)
  para cada financeira (4, em paralelo):
    limitador[financeira].adquirir() → se a espera prevista não cabe no prazo restante, grava indisponivel/fila_cheia e segue
    inicio = agora
    resultado = race(financeira.consultar(paciente, cenario), prazo(10s))
    grava resultado (aprovada | recusada | indisponivel/erro | indisponivel/timeout) com duracaoMs
    publica evento `resultado` no canal da consulta
  quando todos gravados (ou aos 10s): marca consulta finalizada, publica `consulta-finalizada`
```

- Prazo global de 10 s, contado a partir do início da orquestração.
- Resposta que chega depois do corte é descartada; não sobrescreve `indisponivel`.
- Erro lançado pela financeira vira `indisponivel/erro`.
- `LimitadorDeConcorrencia`: semáforo por financeira (N em voo, padrão 5), fail-fast quando a fila não cabe no prazo.
- `esperar(ms)` e `agora()` são injetados, para testes com timers falsos.
- Canal de eventos em memória (`EventEmitter` por consulta), consumido pelo endpoint SSE. O banco é a fonte da verdade; o SSE só avisa.

### Financeiras simuladas

Porta: `Financeira { nome; consultar(paciente, cenario): Promise<RespostaFinanceira> }`.

| | Latência | Regra | Taxa | Prazos |
|---|---|---|---|---|
| Alfa | 0,5–1,5 s | aprova 100% se renda × 10 ≥ valor; senão recusa | 2,49% | 6, 12, 18 |
| Beta | 2–5 s | sempre aprova até 60% do valor | 1,99% | 12, 18, 24 |
| Gama | 1–3 s | recusa se idade < 25 ou valor > 20.000; senão 100% | 3,29% | 6, 10, 12 |
| Delta | 4–15 s | 30% erro 500; senão aprova 100% | 2,19% | 12, 24, 36 |

### Cenários forçados (campo `cenario` da consulta)

| Cenário | Alfa | Beta | Gama | Delta |
|---|---|---|---|---|
| `aleatorio` (padrão) | regra | regra | regra | regra |
| `todas_aprovam` | aprova | aprova | aprova | aprova, sem erro, latência ≤ 8 s |
| `delta_falha` | regra | regra | regra | erro imediato |
| `delta_timeout` | regra | regra | regra | responde aos 12 s |
| `nenhuma_aprova` | recusa | recusa | recusa | recusa |

Habilitado por `SIMULACAO_CENARIOS=true`. Paciente de exemplo para demos limpas: renda R$ 10.000, 30 anos, tratamento R$ 8.000.

## 5. Modelo do banco

```
Paciente              Consulta                        ResultadoFinanceira            Escolha
id                    id                              id                             id
nome                  pacienteId → Paciente           consultaId → Consulta          consultaId → Consulta (único)
cpf                   valorTratamento                 financeira                     resultadoId → ResultadoFinanceira
dataNascimento        cenario                         status                         prazoMeses
celular               chaveIdempotencia (único)       motivo?                        valorParcela
rendaMensal           status                          valorAprovado?                 totalPago
criadoEm              criadaEm, finalizadaEm          taxaMensal?                    criadaEm
                                                      prazos (JSON [6,12,18])
                                                      duracaoMs?, respondidoEm?
                                                      único (consultaId, financeira)
```

Decisões: valor do tratamento na consulta (permite "tentar valor menor" sem duplicar paciente); centavos e pontos-base inteiros; `prazos` em JSON por ser lista fixa nunca consultada isoladamente; `motivo` separado de `status` para métricas; `duracaoMs` para tempo de resposta por financeira; `status` da consulta desnormalizado para o snapshot; escolha guarda valores calculados como registro imutável; integridade por índices únicos, não por `if`.

Repositórios (portas): `PacienteRepositorio`, `ConsultaRepositorio` (criar, buscarPorId, buscarPorChave, gravarResultado, finalizar, gravarEscolha). Serviços dependem só das portas.

## 6. Cálculo

Tabela Price: `PMT = PV · i / (1 − (1 + i)^−n)`, com `PV` em centavos, `i = taxaMensal / 10000`, arredondamento em centavos no final. `totalPago = valorParcela × n`. Função pura em `shared/price.ts`.

## 7. Front-end

### Rotas
- `/` → `CadastroPage`
- `/consultas/:id` → `ConsultaPage` (troca de vista conforme o estado)

### Cadastro (`useFormulario`)
- Dois passos: dados pessoais (nome, CPF, data de nascimento, celular) e valores (renda, valor do tratamento, seletor de cenário quando habilitado).
- Estado único via `useReducer` no container; passos são componentes de apresentação. Espelhado em `sessionStorage` a cada mudança; limpo após `202`.
- Valores crus no estado (dígitos, centavos); formatadores de `shared` aplicam máscara na exibição.
- Validação por passo com `safeParse` do schema do passo. Valida no `blur` na primeira vez; a cada mudança depois de um erro. "Avançar" habilita só quando o passo é válido.
- Envio: gera `Idempotency-Key` uma vez por tentativa, guarda no estado, reutiliza em retentativa. Navega para `/consultas/:id`.
- "Tentar valor menor" volta ao cadastro com o estado restaurado e o valor em foco.

### Consulta (`useConsulta(id)`)
1. Busca snapshot.
2. Se `em_andamento`, abre `EventSource` em `/consultas/:id/eventos`. Aplica cada `resultado` no estado; em `consulta-finalizada` fecha.
3. Se o evento `open` não chega em 2 s, fecha o `EventSource` e faz polling do snapshot a cada 1 s até finalizar.
4. Em reconexão, refaz o snapshot e reabre.

Vistas de `ConsultaPage`:
- `PainelFinanceiras`: 4 cards com status (consultando / aprovada / recusada / indisponível) e tempo decorrido.
- `ListaOfertas`: por financeira aprovada, valor aprovado, taxa e um item por prazo com parcela e total. Ordenação por menor parcela ou menor total (`<select>`), aplicada no cliente sobre valores já calculados pela API. Alerta quando valor aprovado < valor do tratamento. Botão "Escolher" por prazo.
- `SemOfertas`: explica motivos (por financeira) e oferece "tentar valor menor".
- `Confirmacao`: resumo da escolha.

Nenhum estado global. Nenhuma biblioteca de formulário ou de máscara.

### Limite do navegador
HTTP/1.1 permite 6 conexões por origem; a 7ª aba espera até 10 s pelo SSE. O fallback para polling cobre isso. HTTP/2 em produção remove o limite. `SharedWorker` fica como trabalho futuro.

## 8. Testes

**`shared` (Vitest, puro):** CPF (válido, dígito errado, repetidos, tamanho, com/sem máscara); Price (caso verificado à mão, n=1, arredondamento, total, valor menor que tratamento); schemas (bordas de idade e valor, payloads hostis: string, float, negativo, campo extra).

**`api` (Vitest, timers falsos, `fastify.inject`, SQLite temporário):**
- Orquestração: todas respondem; uma estoura; uma falha; nenhuma responde; resposta tardia ignorada; fila cheia; ordem dos eventos.
- Contrato: `202` + idempotência; hostis → `400`; `404`; escolha `422`/`409`/`200`; cada cenário forçado produz o snapshot esperado.

**`web` (Vitest + Testing Library):** `useFormulario` (bloqueio, voltar preserva, restaura de `sessionStorage`); `useConsulta` (aplica eventos, fallback em 2 s); ordenação de ofertas.

**k6 (`tests/k6`, via Docker), batendo em `POST /consultas` + `GET /consultas/:id`, com `thresholds`:**

| Comando | Perfil |
|---|---|
| `npm run test:load` | 20 VUs por 1 min; p95 < 300 ms, zero 5xx |
| `npm run test:stress` | 0 → 200 em degraus de 30 s e volta; `429` permitido, 5xx < 1%, p95 volta a < 300 ms na descida |
| `npm run test:spike` | 0 → 300 em 5 s, segura 20 s, cai; nenhum `500`, API responde `/config` durante o pico |

Comandos: `npm test`, `npm run test:api`, `npm run test:watch`, `npm run test:load|stress|spike`.

Prioridade de corte se o tempo apertar: k6 → web → contrato HTTP. CPF, Price e orquestração nunca saem.

## 9. README (estrutura)

1. Como rodar (`docker compose up`; alternativa `npm install && npm run dev`).
2. Como demonstrar cada cenário forçado, com o paciente de exemplo.
3. Decisões e trade-offs: SSE + snapshot vs polling vs WebSocket; idempotência; fail-fast na fila; validação no servidor; shadcn com 6 componentes; SQLite + JSON em `prazos`; sem lib de formulário; limite de 6 conexões do navegador.
4. Resultados do k6 na máquina de desenvolvimento.
5. O que ficou de fora e o que faria depois: `SharedWorker`, HTTP/2, métricas agregadas por financeira, Postgres, deploy.
6. Como a IA foi usada.

## 10. Fora de escopo

Autenticação, deploy, integrações reais, visual elaborado, Playwright/E2E automatizado, `Select` do shadcn, tabela de prazos normalizada, store global.
