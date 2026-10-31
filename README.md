# Parcela Mais — pré-aprovação em várias financeiras

A clínica cadastra o paciente uma vez, a API consulta quatro financeiras simuladas em paralelo e a tela mostra cada resposta conforme ela chega. Em até 10 segundos a jornada segue com o que voltou; quem não respondeu aparece como indisponível. O paciente escolhe uma oferta e a escolha fica gravada.

Monorepo com três pacotes: `shared` (schemas Zod, CPF, Tabela Price, tipos da API), `backend` (Fastify + Prisma/SQLite) e `frontend` (Vite + React). Além do que o case pede, entrou login com refresh token e um layout com header, sidebar e tema claro/escuro. Esses dois foram feitos por último, depois da base pronta e testada, e explico o porquê mais abaixo.

## Como rodar

Com Docker:

```
docker compose up --build
```

Sobe a API em `http://localhost:3000` e o front em `http://localhost:5173`. O banco SQLite fica no volume Docker `dados` (`docker compose down -v` apaga), migrado e semeado no primeiro start. Depois do build não precisa de internet.

Sem Docker (Node 22):

```
npm install
cp .env.example backend/.env
npm run prisma:migrate -w backend
npm run prisma:seed -w backend
npm run dev
```

Acesso da clínica (usuário único, semeado): `clinica@parcelamais.com` / `parcela123`.

Testes:

```
npm test                 # shared + backend + frontend
npm run test:backend
npm run test:frontend
npm run test:load        # k6 via Docker, 20 usuários por 1 minuto
npm run test:stress      # 0 → 200 usuários em degraus e volta
npm run test:spike       # 0 → 300 usuários em 5 segundos
```

Os testes de carga batem na API que estiver em `localhost:3000`. Como o rate limit é por IP e o k6 sai de um IP só, para medir latência de verdade suba a API com `RATE_LIMIT_MAX=100000 docker compose up`. Com o limite padrão (100 req/min) o que você vê é a API devolvendo `429` cedo, que é o comportamento desejado contra abuso, não um número de capacidade.

## Como demonstrar os cenários

O seletor "Cenário de simulação" aparece no segundo passo do cadastro quando a API está com `SIMULACAO_CENARIOS=true` (padrão no compose). O cenário fica gravado na consulta, então dá para abrir o banco e mostrar.

Paciente que faz as três financeiras "normais" aprovarem, para isolar o Delta: renda R$ 10.000, nascido em 1996, tratamento R$ 8.000.

| Cenário | O que acontece |
|---|---|
| Aleatório | Regras do PDF, latências sorteadas, Delta falha em 30% das vezes |
| Todas aprovam | As quatro aprovam; Delta responde em 6 s, sem erro |
| Delta falha | Delta devolve erro na hora; as outras seguem a regra |
| Delta estoura o tempo | Delta só responde aos 12 s; aos 10 s a consulta fecha e ele vira "indisponível" |
| Nenhuma aprova | As quatro recusam; a tela explica e sugere tentar com 80% do valor |

Para o Beta aparecer com valor menor que o tratamento, qualquer valor serve: ele sempre aprova no máximo 60%.

## As decisões, e o que cada uma custa

**Como os resultados chegam na tela: SSE com snapshot por baixo.** O `POST /consultas` responde `202` com o `id` na hora e dispara as financeiras. O front abre `GET /consultas/:id/eventos` (`EventSource` nativo, sem biblioteca) e recebe um evento por financeira e um `consulta-finalizada` ao final. O banco é a fonte da verdade: `GET /consultas/:id` devolve o estado completo e é o que o front lê ao abrir a página, ao recarregar e quando a conexão cai. O SSE só avisa que algo mudou. Escolhi SSE em vez de polling pela latência zero e por ser uma conexão só, e em vez de WebSocket porque depois do `POST` o cliente nunca mais envia nada; bidirecional seria peso sem uso. O custo: cada consulta segura uma conexão aberta por até 10 s, e navegadores limitam a 6 conexões por origem em HTTP/1.1. Por isso o hook tem um plano B: se o `open` do `EventSource` não chega em 2 s, ele fecha e passa a buscar o snapshot a cada 1 s. A tela mostra "Ao vivo" ou "Atualizando" conforme o modo, e o teste do hook cobre a troca. Em produção, HTTP/2 remove o limite sem mudar código.

**Prazo de 10 s e falhas.** A orquestração dispara as quatro chamadas em paralelo (cada uma trata o próprio erro, então nenhuma derruba as outras) e põe o conjunto para disputar com um timer de 10 s. Quando o timer vence, o que ainda está `consultando` vira `indisponivel` com motivo `timeout`; erro da financeira vira `indisponivel` com motivo `erro`. O motivo fica separado do status porque a tela só precisa de "indisponível", mas a métrica por financeira precisa saber se foi erro, timeout ou fila. Toda transição sai de `consultando` por uma escrita condicional no banco (`UPDATE ... WHERE status = 'consultando'`): uma resposta que chega depois do corte, ou no mesmo instante, não sobrescreve nada e não gera evento. Os testes de orquestração cobrem isso com timers falsos, então rodam em milissegundos.

**Nada fica preso para sempre.** Paciente, consulta e as quatro linhas `consultando` nascem numa transação só, então um `202` sempre tem o estado inicial completo. Se a API reiniciar no meio dos 10 s, ao subir ela varre consultas `em_andamento` mais antigas que o prazo, marca os pendentes como `timeout` e finaliza; a tela que estava esperando recebe o `consulta-finalizada` no próximo snapshot.

**Fila por financeira que falha rápido.** Cada financeira tem um semáforo (5 chamadas em voo por padrão, `LIMITE_CONCORRENCIA`). Se a espera prevista mais a duração da chamada não cabem no que resta dos 10 s, a consulta nem entra na fila: grava `indisponivel` com motivo `fila_cheia` na hora. Prefiro responder "não deu" em 50 ms a deixar a clínica esperando 10 s por um timeout que já era certo.

**Idempotência.** O `POST /consultas` exige `Idempotency-Key` (UUID gerado no front no clique de enviar, reutilizado se a rede falhar e descartado se o usuário editar algum campo). A chave é única por usuário no banco, então duas requisições simultâneas com a mesma chave criam uma consulta só: a segunda bate no índice e relê a primeira, sem deixar paciente órfão porque tudo está na mesma transação. Tem teste disso. A escolha de oferta é um `PUT` com restrição única por consulta: repetir a mesma escolha dá `200`, uma diferente dá `409`, inclusive quando as duas chegam ao mesmo tempo.

**Cada consulta pertence a quem a criou.** Snapshot, eventos e escolha conferem o dono e respondem `404` para outro usuário, como se a consulta não existisse. Hoje há um usuário só, mas o modelo já é por clínica.

**O cliente envia intenção, nunca resultado.** O front valida com os mesmos schemas Zod da API, mas isso é só para o usuário ver o erro antes de enviar. Quem protege é a API: schemas `.strict()` derrubam campo extra, valores são inteiros em centavos com faixa explícita, CPF e idade são recalculados no servidor, e o body tem limite de 16 kB. Na escolha, o cliente manda só `{ financeira, prazoMeses }`; a API confere no banco que aquela financeira aprovou e oferece aquele prazo e recalcula a parcela. Não tem como injetar valor financeiro pelo inspecionar. A suíte tem um bloco de payloads hostis (string onde devia ser número, float, negativo, campo extra, data inexistente) que precisam dar `400`, nunca `500`.

**Dinheiro em centavos, taxa em pontos-base.** `R$ 1.500,00` é `150000`; `2,49%` é `249`. A Tabela Price calcula em número e arredonda só no final. Sem float em dinheiro.

**Banco.** Quatro tabelas para o que o case pede (paciente, consulta, resultado por financeira, escolha) e duas para auth. O valor do tratamento mora na consulta, não no paciente. Hoje cada consulta grava o paciente de novo (não há cadastro de pacientes nem deduplicação por CPF); reaproveitar o paciente por CPF é o passo natural quando existir uma tela de pacientes. `prazos` é JSON na linha do resultado: SQLite não tem array e uma tabela de três inteiros que nunca são consultados sozinhos seria normalização por hábito. A escolha guarda parcela e total calculados, como registro imutável do que foi mostrado. Integridade por índice único, não por `if`. SQLite por não precisar de container; a troca para Postgres é só o `provider` do Prisma e uma migração.

**SQLite afinado, depois de medir.** A primeira rodada do k6 em Docker deu p95 de 4 segundos e erros `P1008` (timeout de escrita). A causa era o arquivo do banco num bind mount do macOS, onde cada `fsync` custa caro, somado a quatro escritas sequenciais antes do `202`. Três mudanças: volume nomeado em vez de bind mount, `PRAGMA journal_mode = WAL` com `synchronous = NORMAL` e `busy_timeout = 5 s` ao subir, e as quatro linhas iniciais gravadas num `createMany` só. O p95 caiu para 86 ms. Os números completos estão no fim.

**Portas e adaptadores no backend.** `Financeira`, repositórios, relógio, hasher e emissor de token são interfaces em `domain/ports`. As quatro financeiras simuladas, o Prisma, o bcrypt e o JWT são adaptadores em `infra`. A orquestração não sabe que as financeiras são falsas; trocar por um cliente HTTP real é escrever outra classe com a mesma interface. É também o que deixa o teste de orquestração rodar com financeiras controladas e relógio falso. `container.ts` é o único lugar que conhece todo mundo.

**Front sem store global e sem biblioteca de formulário.** Dois hooks concentram a lógica: `useFormulario` (passos, validação por passo, rascunho em `sessionStorage`, chave de idempotência) e `useConsulta` (snapshot, SSE, fallback). Componentes só apresentam. O formulário são seis campos em dois passos; um hook de 60 linhas é mais fácil de explicar e alterar ao vivo do que configurar React Hook Form, e é uma dependência a menos. Em um formulário de trinta campos eu usaria RHF. Máscaras de CPF, celular e moeda são três funções em `shared`, sem lib; o estado guarda o valor cru (dígitos, centavos) e formata só na exibição.

**shadcn/ui, contido.** Entraram oito componentes copiados para o repo (botão, input, label, card, badge, alert, separator, tooltip). O código fica aqui, dá para alterar ao vivo, e o CSS é compilado e purgado pelo Tailwind no build. Seletores de cenário e de ordenação são `<select>` nativos; o `Select` do shadcn é o componente mais pesado e não paga o custo aqui. Fonte Geist empacotada localmente, nada de CDN em runtime.

**Rate limit e `429`.** `@fastify/rate-limit` por IP, 100 req/min por padrão e 10/min no login. No teste de pico é o que faz a API responder `429` rápido em vez de enfileirar e derrubar as outras requisições.

## Os extras: login e layout

O case diz que não precisa de login nem de visual elaborado. Entraram mesmo assim, por último, porque uma tela de produto com sessão real é o que uma clínica usaria de fato, e porque a ordem garante que a base nunca fica fraca por causa deles.

Login com usuário único semeado (sem cadastro, sem "esqueci a senha"). Access token JWT de 15 minutos, guardado só em memória no front. Refresh token opaco de 7 dias em cookie `httpOnly; SameSite=Strict; Path=/auth`, gravado no banco como hash SHA-256 e rotacionado a cada uso. Reuso de um refresh já rotacionado revoga a família inteira, com uma tolerância de 60 s: encontrei ao vivo que uma resposta de refresh perdida (a API reiniciou no meio) deixava o cookie antigo no navegador e, na rotação estrita, isso derrubava a sessão. Dentro de 60 s o reuso emite nova sessão sem revogar; depois disso revoga. O custo é que um token roubado e reutilizado nessa janela não é detectado. O `http.ts` do front renova em `401` uma vez e repete a requisição; renovações concorrentes compartilham a mesma promessa. O `EventSource` não envia headers, então o SSE recebe o token por query string, validado pelo mesmo plugin.

Layout: header, sidebar que vira barra de ícones no celular, tema claro/escuro em variáveis CSS persistido em `localStorage`. Animação só onde o estado muda (troca de passo, badge de status, entrada das ofertas, tema), tudo em CSS e tudo desligado com `prefers-reduced-motion`.

## O que ficou de fora e o que eu faria em seguida

- **Bundle inicial de ~120 kB gzip.** Páginas já carregam por rota, mas React, Base UI e o router pesam. Próximo passo seria medir com o visualizer e trocar os primitivos do Base UI que não uso por HTML puro.
- **`SharedWorker` para compartilhar uma conexão SSE entre abas**, resolvendo o limite de 6 conexões sem depender de HTTP/2.
- **Métricas agregadas por financeira.** Os dados já estão no banco (`duracaoMs`, `motivo`); falta um `GET /metricas` com `GROUP BY`.
- **Postgres**, um `provider` de distância.
- **Compilar o backend.** Hoje ele roda com `tsx` em produção porque o `shared` é fonte TypeScript e o `tsc` com `NodeNext` exigiria extensões nos imports. Para um serviço real eu faria o `shared` emitir JS ou usaria um bundler.
- **Playwright de ponta a ponta.** A jornada foi verificada manualmente no navegador (cenários forçados, reload no meio da consulta, login e renovação de sessão, tema, largura de celular); automatizar isso é o próximo teste que eu escreveria.
- Cadastro de usuários, recuperação de senha, deploy.

## Resultados dos testes de carga

Rodados na minha máquina (Docker Desktop, SQLite em volume), com `RATE_LIMIT_MAX=100000` para medir latência e não o limitador:

| Teste | Perfil | p95 | Erros 5xx | Vazão | Passou? |
|---|---|---|---|---|---|
| Carga | 20 usuários, 1 min, 1 s de pausa por iteração | 86 ms | 0 em 2.287 | 18,7 consultas/s | Sim |
| Estresse | 0 → 50 → 100 → 200 → 0 usuários, 30 s por degrau | 1,67 s (1,75 s na descida) | 0 em 9.909 | 41 consultas/s | Não: p95 na descida ficou acima de 300 ms |
| Pico | 0 → 300 usuários em 5 s, 20 s no topo | 3,65 s | 0 em 15.361 | 429 req/s | Sim: nenhum 5xx, `/config` respondeu 100% do tempo |

Leitura honesta: com 20 usuários simultâneos a API está folgada. A partir de 100 usuários criando consultas sem parar, o SQLite vira o gargalo (um escritor por vez) e a latência sobe para a casa dos segundos, mas sem derrubar nada; o limiar de 300 ms na descida do estresse não bateu porque a fila de escrita ainda estava drenando. Antes das três mudanças descritas em "SQLite afinado", a mesma carga dava p95 de 4 s e erros de timeout no banco. Para passar disso o caminho é Postgres, não mais ajuste.

## Como usei IA

Usei o Claude Code do início ao fim, como par. O processo foi: levantamento de requisitos e brainstorm sobre o PDF, uma spec de design que eu revisei seção por seção (está em `docs/superpowers/specs/`), um plano de implementação em 27 tarefas (`docs/superpowers/plans/`) e a execução com teste antes do código em cada tarefa. As decisões de arquitetura deste README foram discutidas antes de virar código, e várias mudaram no caminho: a tolerância no refresh token e a garantia de quatro resultados no snapshot inicial saíram de bugs encontrados testando no navegador, não do plano. Cada arquivo foi lido e o que eu não conseguia explicar, reescrevi.
