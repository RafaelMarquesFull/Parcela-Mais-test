# Pré-aprovação em múltiplas financeiras — Design

Case técnico Parcela Mais. Jornada web em três etapas: cadastro do paciente, pré-aprovação em 4 financeiras simuladas em paralelo, escolha de oferta. Além do pedido, entram login com refresh token e um layout de produto (header, sidebar, tema), construídos depois da base e declarados no README como extras.

## 1. Objetivo e critérios

**Entregar:** jornada completa, cenários forçáveis para demonstração, testes nas partes críticas, README com decisões. Base do PDF em 4 a 6 horas; extras em até 3 horas adicionais.

**O que a avaliação observa:** comportamento sob falha, arquitetura do front, contrato de API e orquestração, correção dos cálculos, testes, comunicação. Decisões bem explicadas valem mais que quantidade de funcionalidades.

**Pano de fundo real (não aplicado no case, só orienta escolhas):** o front atual da empresa é Bubble, pesado, e está sendo migrado para React em etapas. Decisões que conversam com isso: front leve, regra de negócio no backend, contrato de API limpo o bastante para qualquer cliente consumir.

**Regras de código:** clean code simplificado, arquitetura simples, nenhum comentário no código, README com voz humana. Camada de dados atrás de interfaces de repositório. DTOs/schemas compartilhados e úteis. Comandos prontos para teste de carga, estresse e pico.

**Ordem de construção (não negociável):**
1. Base do PDF, testada.
2. Layout shell, tema, ícones, animações nos pontos-chave.
3. Auth com refresh token.
4. README.

Se o tempo acabar em qualquer fase, o que está pronto fica inteiro e o restante vai para "o que faria em seguida".

## 2. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Front | Vite + React + TypeScript, react-router | Bundle pequeno, sem framework de servidor |
| UI | Tailwind (plugin Vite) + shadcn/ui + lucide-react | Código fica no repo, CSS compilado e purgado, acessibilidade via Radix, ícones já inclusos |
| Back | Fastify + TypeScript | Leve, streaming para SSE, `inject()` para testes sem porta |
| Banco | SQLite via Prisma, atrás de interfaces de repositório | Sem container de banco; schema legível |
| Validação | Zod em `shared`, usado por front e API | Um schema, mensagens iguais nos dois lados |
| Auth | JWT de acesso (15 min) + refresh opaco rotativo em cookie httpOnly, `bcrypt` | Padrão conhecido, sem lib de sessão |
| Testes | Vitest (todos os pacotes), Testing Library, k6 via Docker | Um runner só |
| Execução | npm workspaces, Docker Compose com um comando | `docker compose up` sobe API e front |

Fontes do sistema, sem CDN em runtime. O compose funciona sem internet depois do build.

Padrões adotados: custom hooks concentram lógica; container/presentational; inputs controlados; pastas por feature; portas e adaptadores no backend. Não adotados: FSD completo, Atomic Design, HOC/render props, compound components.

## 3. Estrutura de pastas

### Backend — portas e adaptadores

```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                          usuário fixo da clínica
│   └── migrations/
├── src/
│   ├── main.ts                          sobe o servidor
│   ├── app.ts                           monta o Fastify (plugins + rotas); testes usam via inject()
│   ├── container.ts                     composição: repositórios, financeiras, casos de uso
│   ├── config/
│   │   └── env.ts                       variáveis de ambiente validadas com Zod
│   ├── domain/                          regra pura, sem Fastify, sem Prisma
│   │   ├── entities/
│   │   │   ├── paciente.ts
│   │   │   ├── consulta.ts
│   │   │   ├── resultado-financeira.ts
│   │   │   ├── escolha.ts
│   │   │   ├── usuario.ts
│   │   │   └── refresh-token.ts
│   │   ├── ports/
│   │   │   ├── financeira.port.ts
│   │   │   ├── consulta.repository.ts
│   │   │   ├── paciente.repository.ts
│   │   │   ├── usuario.repository.ts
│   │   │   ├── refresh-token.repository.ts
│   │   │   ├── publicador-eventos.port.ts
│   │   │   ├── hasher.port.ts
│   │   │   ├── emissor-token.port.ts
│   │   │   └── relogio.port.ts          agora() e esperar(ms)
│   │   └── errors/
│   │       └── domain-error.ts          ConsultaNaoEncontrada, OfertaInvalida, EscolhaConflitante, CredenciaisInvalidas, RefreshInvalido
│   ├── application/                     um caso de uso por arquivo
│   │   ├── consultas/
│   │   │   ├── criar-consulta.ts
│   │   │   ├── orquestrar-consulta.ts
│   │   │   ├── obter-consulta.ts
│   │   │   ├── listar-consultas.ts
│   │   │   ├── escolher-oferta.ts
│   │   │   └── calcular-ofertas.ts
│   │   └── auth/
│   │       ├── autenticar.ts
│   │       ├── renovar-sessao.ts
│   │       └── encerrar-sessao.ts
│   ├── infra/
│   │   ├── database/
│   │   │   ├── prisma-client.ts
│   │   │   ├── mappers/
│   │   │   └── repositories/
│   │   │       ├── prisma-consulta.repository.ts
│   │   │       ├── prisma-paciente.repository.ts
│   │   │       ├── prisma-usuario.repository.ts
│   │   │       └── prisma-refresh-token.repository.ts
│   │   ├── financeiras/
│   │   │   ├── alfa.ts  beta.ts  gama.ts  delta.ts
│   │   │   ├── cenarios.ts
│   │   │   ├── simulador-latencia.ts
│   │   │   ├── limitador-concorrencia.ts
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── bcrypt-hasher.ts
│   │   │   └── jwt-emissor.ts
│   │   └── events/
│   │       └── canal-consultas.ts       EventEmitter por consulta
│   └── http/
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── config.routes.ts
│       │   └── consultas.routes.ts
│       ├── plugins/
│       │   ├── autenticacao.ts          valida Bearer, popula request.usuario
│       │   ├── rate-limit.ts
│       │   ├── idempotency.ts
│       │   └── error-handler.ts         DomainError → 401/404/409/422, Zod → 400
│       ├── sse/
│       │   └── stream.ts
│       └── presenters/
│           └── consulta.presenter.ts    entidade → JSON do contrato (mascara CPF, calcula ofertas)
├── test/
│   ├── unit/
│   │   ├── orquestrar-consulta.test.ts
│   │   ├── limitador-concorrencia.test.ts
│   │   ├── financeiras.test.ts
│   │   ├── escolher-oferta.test.ts
│   │   └── renovar-sessao.test.ts
│   ├── integration/
│   │   ├── auth.routes.test.ts
│   │   ├── criar-consulta.routes.test.ts
│   │   ├── obter-consulta.routes.test.ts
│   │   ├── escolha.routes.test.ts
│   │   └── cenarios.routes.test.ts
│   ├── helpers/
│   │   ├── build-app.ts                 app com banco temporário e usuário semeado
│   │   ├── login.ts                     devolve Bearer para os testes
│   │   ├── fake-financeira.ts           respondeEm / falha / nuncaResponde
│   │   └── relogio-falso.ts
│   └── load/
│       ├── load.js  stress.js  spike.js
│       └── helpers.js                   login no setup, paciente gerado
├── Dockerfile
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

Regra de dependência: `http` → `application` → `domain` ← `infra`. `domain` não importa nada de fora. `container.ts` é o único lugar que conhece todo mundo.

### Frontend — por feature

```
frontend/
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx                   rotas públicas e protegidas
│   │   ├── RotaProtegida.tsx
│   │   ├── theme/
│   │   │   ├── tokens.css               paletas claro/escuro em variáveis CSS
│   │   │   └── useTema.ts
│   │   └── layout/
│   │       ├── Shell.tsx                header + sidebar + main
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── AlternadorTema.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── hooks/useAuth.ts         token em memória, renovação, logout
│   │   │   ├── components/FormularioLogin.tsx
│   │   │   └── __tests__/
│   │   ├── inicio/
│   │   │   ├── InicioPage.tsx           ações principais + consultas recentes
│   │   │   └── components/
│   │   │       ├── AcaoNovaConsulta.tsx
│   │   │       └── ListaConsultasRecentes.tsx
│   │   ├── cadastro/
│   │   │   ├── CadastroPage.tsx
│   │   │   ├── state/
│   │   │   │   ├── reducer.ts
│   │   │   │   └── rascunho.ts          espelho em sessionStorage
│   │   │   ├── hooks/useFormulario.ts
│   │   │   ├── components/
│   │   │   │   ├── PassoDadosPessoais.tsx
│   │   │   │   ├── PassoValores.tsx
│   │   │   │   ├── NavegacaoPassos.tsx
│   │   │   │   ├── IndicadorPasso.tsx
│   │   │   │   └── SeletorCenario.tsx
│   │   │   └── __tests__/
│   │   ├── consulta/
│   │   │   ├── ConsultaPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useConsulta.ts       snapshot + estado
│   │   │   │   └── useEventosConsulta.ts   SSE com fallback para polling
│   │   │   ├── components/
│   │   │   │   ├── PainelFinanceiras.tsx
│   │   │   │   ├── CardFinanceira.tsx
│   │   │   │   └── StatusFinanceira.tsx
│   │   │   └── __tests__/
│   │   └── ofertas/
│   │       ├── ordenar.ts
│   │       ├── components/
│   │       │   ├── ListaOfertas.tsx
│   │       │   ├── CardOferta.tsx
│   │       │   ├── SeletorOrdenacao.tsx
│   │       │   ├── AvisoValorMenor.tsx
│   │       │   ├── SemOfertas.tsx
│   │       │   └── Confirmacao.tsx
│   │       └── __tests__/
│   ├── services/
│   │   ├── http.ts                      fetch com base URL, Bearer, renovação em 401
│   │   ├── auth.api.ts
│   │   ├── consultas.api.ts
│   │   └── config.api.ts
│   ├── components/
│   │   └── ui/                          shadcn: button, input, label, card, badge, alert, separator, tooltip
│   ├── lib/
│   │   └── cn.ts
│   └── styles/
│       └── globals.css
├── test/setup.ts
├── Dockerfile
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Shared e raiz

```
shared/
├── src/
│   ├── schemas/
│   │   ├── dados-pessoais.schema.ts
│   │   ├── valores.schema.ts
│   │   ├── cadastro.schema.ts
│   │   ├── escolha.schema.ts
│   │   └── login.schema.ts
│   ├── types/api.ts
│   ├── cpf.ts
│   ├── price.ts
│   ├── formatadores.ts
│   └── index.ts
└── test/
    ├── cpf.test.ts
    ├── price.test.ts
    └── schemas.test.ts

docker-compose.yml
package.json                             workspaces: backend, frontend, shared
README.md
```

## 4. Contrato da API

Valores monetários em centavos inteiros. Taxas em pontos-base (249 = 2,49%). Todas as rotas exceto `/auth/*` e `/config` exigem `Authorization: Bearer <access>`; sem ele, `401`.

### Auth
- `POST /auth/login` — body `{ email, senha }` (`loginSchema`). `200 { accessToken, usuario: { nome } }` e cookie `refresh` (`httpOnly; SameSite=Strict; Path=/auth`). `401` em credencial inválida. Rate limit mais apertado nessa rota.
- `POST /auth/refresh` — lê o cookie, valida contra o banco (hash), rotaciona: invalida o atual, emite novo refresh e novo access. `200 { accessToken }`. Reuso de refresh já rotacionado revoga toda a família e devolve `401`.
- `POST /auth/logout` — invalida o refresh atual, limpa o cookie. `204`.

Access token: JWT HS256, 15 min, payload `{ sub, nome }`. Refresh: 32 bytes aleatórios, 7 dias, armazenado como hash SHA-256 com `familiaId`, `usadoEm`, `revogadoEm`.

### `GET /config`
`{ simulacaoHabilitada: boolean }`.

### `POST /consultas`
Headers: `Idempotency-Key: <uuid>` obrigatório. Body (`cadastroSchema`, estrito): `{ nome, cpf, dataNascimento, celular, rendaMensal, valorTratamento, cenario? }`.
`202 { id }`. Salva paciente e consulta, dispara orquestração, responde sem esperar.
Mesma chave repetida devolve o mesmo `id`. `400` com erros do Zod. `cenario` ignorado quando simulação desabilitada.

### `GET /consultas`
Lista resumida das consultas do usuário, mais recentes primeiro: `[{ id, pacienteNome, valorTratamento, status, aprovadas, criadaEm }]`.

### `GET /consultas/:id` (snapshot)
```
{ id, status, valorTratamento, cenario, criadaEm, finalizadaEm,
  paciente: { nome, cpfMascarado, dataNascimento, celular, rendaMensal },
  resultados: [{ financeira, status, motivo?, valorAprovado?, taxaMensal?, duracaoMs?,
                 ofertas?: [{ prazoMeses, valorParcela, totalPago }] }],
  escolha?: { financeira, prazoMeses, valorParcela, totalPago } }
```
`ofertas` calculado na resposta, não armazenado. `404` se não existe.

### `GET /consultas/:id/eventos` (SSE)
`text/event-stream`. `EventSource` não envia headers, então o access token vai em query string `?token=`, validado pelo mesmo plugin. Eventos: `resultado` (um por financeira, `id` = id do registro) e `consulta-finalizada` (fecha a conexão). Consulta já finalizada: envia `consulta-finalizada` na hora. Nunca dispara orquestração.

### `PUT /consultas/:id/escolha`
Body `{ financeira, prazoMeses }`. O servidor busca o resultado no banco, confere `aprovada` e prazo, recalcula valores, grava. `200`; `422` oferta inválida; `409` escolha diferente já existe; mesma escolha → `200`.

### Proteções transversais
`bodyLimit` 16 kB; rate limit por IP com `429` + `Retry-After`; `Idempotency-Key` como UUID; schemas `.strict()`, `.int()`, `.safe()`, faixas explícitas; CORS restrito à origem do front com `credentials`.

## 5. Orquestração

```
orquestrarConsulta(consultaId)
  para cada financeira, em paralelo:
    limitador[financeira].adquirir() → se a espera prevista não cabe no prazo restante: indisponivel/fila_cheia
    resultado = race(financeira.consultar(paciente, cenario), prazo(10s))
    grava (aprovada | recusada | indisponivel/erro | indisponivel/timeout) com duracaoMs
    publica `resultado`
  quando todos gravados ou aos 10s: finaliza consulta, publica `consulta-finalizada`
```

Prazo global de 10 s desde o início. Resposta após o corte é descartada. Erro vira `indisponivel/erro`. `LimitadorDeConcorrencia`: semáforo por financeira (N configurável, padrão 5), fail-fast. `relogio` injetado para timers falsos. Canal em memória por consulta; o banco é a fonte da verdade.

### Financeiras simuladas

Porta: `Financeira { nome; consultar(paciente, cenario): Promise<RespostaFinanceira> }`.

| | Latência | Regra | Taxa | Prazos |
|---|---|---|---|---|
| Alfa | 0,5–1,5 s | aprova 100% se renda × 10 ≥ valor; senão recusa | 2,49% | 6, 12, 18 |
| Beta | 2–5 s | sempre aprova até 60% do valor | 1,99% | 12, 18, 24 |
| Gama | 1–3 s | recusa se idade < 25 ou valor > 20.000; senão 100% | 3,29% | 6, 10, 12 |
| Delta | 4–15 s | 30% erro; senão aprova 100% | 2,19% | 12, 24, 36 |

### Cenários forçados

| Cenário | Alfa | Beta | Gama | Delta |
|---|---|---|---|---|
| `aleatorio` | regra | regra | regra | regra |
| `todas_aprovam` | aprova | aprova | aprova | aprova, sem erro, ≤ 8 s |
| `delta_falha` | regra | regra | regra | erro imediato |
| `delta_timeout` | regra | regra | regra | responde aos 12 s |
| `nenhuma_aprova` | recusa | recusa | recusa | recusa |

Habilitado por `SIMULACAO_CENARIOS=true`. Paciente de exemplo: renda R$ 10.000, 30 anos, tratamento R$ 8.000.

## 6. Modelo do banco

```
Usuario                 RefreshToken
id                      id
email (único)           usuarioId → Usuario
nome                    hash (único)
senhaHash               familiaId
criadoEm                expiraEm, usadoEm?, revogadoEm?
                        criadoEm

Paciente              Consulta                        ResultadoFinanceira            Escolha
id                    id                              id                             id
nome                  usuarioId → Usuario             consultaId → Consulta          consultaId → Consulta (único)
cpf                   pacienteId → Paciente           financeira                     resultadoId → ResultadoFinanceira
dataNascimento        valorTratamento                 status                         prazoMeses
celular               cenario                         motivo?                        valorParcela
rendaMensal           chaveIdempotencia (único)       valorAprovado?                 totalPago
criadoEm              status                          taxaMensal?                    criadaEm
                      criadaEm, finalizadaEm          prazos (JSON)
                                                      duracaoMs?, respondidoEm?
                                                      único (consultaId, financeira)
```

Decisões: valor do tratamento na consulta; centavos e pontos-base inteiros; `prazos` em JSON; `motivo` separado de `status`; `duracaoMs` para métrica; `status` da consulta desnormalizado; escolha imutável com valores calculados; integridade por índices únicos; refresh token como hash, nunca em claro.

## 7. Cálculo

Tabela Price: `PMT = PV · i / (1 − (1 + i)^−n)`, `PV` em centavos, `i = taxaMensal / 10000`, arredondamento em centavos no final. `totalPago = valorParcela × n`. Função pura em `shared/price.ts`.

## 8. Front-end

### Rotas
- `/login` → `LoginPage` (pública). Usuário já autenticado é redirecionado para `/`.
- `/` → `InicioPage` (protegida): ação "Nova consulta" em destaque e lista de consultas recentes.
- `/consultas/nova` → `CadastroPage`.
- `/consultas/:id` → `ConsultaPage`.

Rotas protegidas renderizam dentro do `Shell`. `RotaProtegida` tenta `refresh` silencioso ao carregar; sem sessão, manda para `/login` guardando o destino.

### Auth (`useAuth`)
Access token só em memória. `http.ts` anexa o Bearer; em `401`, chama `/auth/refresh` uma vez e repete a requisição; falhou, limpa a sessão e vai para `/login`. Renovações concorrentes compartilham a mesma promessa.

### Layout e tema
`Shell` com header fixo (logo, nome do usuário, alternador de tema, sair), sidebar com "Início", "Nova consulta", "Consultas", e `main` com largura de leitura. Sidebar recolhe em telas estreitas. Tema por variáveis CSS em `tokens.css` com paleta clara e escura, persistido em `localStorage`. Ícones `lucide-react`.

### Animações
Só transições CSS e `prefers-reduced-motion` respeitado. Pontos: troca de passo do cadastro (deslize curto), card de financeira ao mudar de status (fade + leve escala), entrada das ofertas (stagger de 40 ms), troca de tema (transição de cor). Sem framer-motion.

### Cadastro (`useFormulario`)
Dois passos: dados pessoais (nome, CPF, data de nascimento, celular) e valores (renda, valor do tratamento, seletor de cenário quando habilitado). Estado único via `useReducer`; passos são apresentação. Espelhado em `sessionStorage`; limpo após `202`. Valores crus no estado; formatadores de `shared` na exibição. Validação por passo com `safeParse`; no `blur` na primeira vez, a cada mudança após erro; "Avançar" habilita só com passo válido. `Idempotency-Key` gerada uma vez por tentativa. "Tentar valor menor" volta ao cadastro com estado restaurado e valor em foco.

### Consulta (`useConsulta` + `useEventosConsulta`)
1. Busca snapshot.
2. Se `em_andamento`, abre `EventSource`; aplica cada `resultado`; fecha em `consulta-finalizada`.
3. Sem `open` em 2 s: fecha e faz polling do snapshot a cada 1 s.
4. Em reconexão, refaz o snapshot e reabre.

Vistas: `PainelFinanceiras` (4 cards com status e tempo decorrido), `ListaOfertas` (ordenação por menor parcela ou menor total no cliente; alerta de valor aprovado menor; botão por prazo), `SemOfertas` (motivos e "tentar valor menor"), `Confirmacao`.

Nenhum estado global além do `useAuth`. Nenhuma biblioteca de formulário ou de máscara.

### Limite do navegador
HTTP/1.1 permite 6 conexões por origem; a 7ª aba espera até 10 s pelo SSE. O fallback para polling cobre isso. HTTP/2 em produção remove o limite. `SharedWorker` fica como trabalho futuro.

## 9. Testes

**`shared`:** CPF (válido, dígito errado, repetidos, tamanho, com/sem máscara); Price (caso verificado à mão, n=1, arredondamento, total, valor menor que tratamento); schemas (bordas de idade e valor; hostis: string, float, negativo, campo extra).

**`backend` (timers falsos, `inject`, SQLite temporário, usuário semeado):**
- Unit: orquestração (todas respondem; uma estoura; uma falha; nenhuma responde; tardia ignorada; fila cheia; ordem dos eventos); limitador; `escolherOferta`; `renovarSessao` (rotação, reuso revoga família, expirado).
- Integration: login `200`/`401`; refresh rotaciona e reuso dá `401`; rota sem Bearer `401`; `202` + idempotência; hostis `400`; `404`; escolha `422`/`409`/`200`; cada cenário forçado.

**`frontend`:** `useFormulario` (bloqueio, voltar preserva, restaura rascunho); `useEventosConsulta` (aplica eventos, fallback em 2 s); `useAuth` (renova em 401 uma vez, redireciona ao falhar); ordenação de ofertas.

**k6 (`backend/test/load`, via Docker), login no `setup`, batendo em `POST /consultas` + `GET /consultas/:id`:**

| Comando | Perfil |
|---|---|
| `npm run test:load` | 20 VUs por 1 min; p95 < 300 ms, zero 5xx |
| `npm run test:stress` | 0 → 200 em degraus de 30 s e volta; `429` permitido, 5xx < 1%, p95 volta a < 300 ms na descida |
| `npm run test:spike` | 0 → 300 em 5 s, segura 20 s, cai; nenhum `500`, `/config` responde durante o pico |

Comandos: `npm test`, `npm run test:backend`, `npm run test:frontend`, `npm run test:watch`, `npm run test:load|stress|spike`.

Prioridade de corte: auth → layout → k6 → frontend → integration. CPF, Price e orquestração nunca saem.

## 10. README

1. Como rodar (`docker compose up`; credenciais do usuário semeado; alternativa `npm run dev`).
2. Como demonstrar cada cenário forçado, com o paciente de exemplo.
3. Decisões e trade-offs: SSE + snapshot; idempotência; fail-fast na fila; validação no servidor; shadcn contido; SQLite + JSON em `prazos`; sem lib de formulário; limite de 6 conexões; refresh rotativo em cookie; token em memória.
4. Extras além do pedido (auth, layout) e por que entraram por último.
5. Resultados do k6.
6. O que ficou de fora e o que faria depois: `SharedWorker`, HTTP/2, métricas agregadas, Postgres, deploy, cadastro de usuários, recuperação de senha.
7. Como a IA foi usada.

## 11. Fora de escopo

Cadastro de usuários, recuperação de senha, deploy, integrações reais, Playwright, `Select` do shadcn, tabela de prazos normalizada, store global, framer-motion.
