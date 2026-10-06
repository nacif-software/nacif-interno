# AGENTS.md — guia para agentes de IA e pessoas

Leia este arquivo antes de qualquer alteração. Ele define vocabulário, arquitetura, comandos e convenções. `CLAUDE.md` só aponta para cá.

## 1. O que é este repositório

Portal de sistemas internos da **Nacif**. O primeiro módulo é **Nacif Disponibilidade**: membros do time (prestadores PJ) comunicam períodos de indisponibilidade e aprovadores decidem. Outros sistemas internos entrarão como módulos e aparecerão como cards no portal (`/`). A tela de login e o portal falam dos serviços internos de forma geral, nunca de um módulo específico.

O **Hermes Agent** não é um módulo do portal: é um agente externo, com acesso restrito, que consultará dados daqui por MCP (issues #5 e #6).

- Especificação de UI: `docs/design-spec.md` (fonte de verdade; copy pt-BR deve ser idêntica).
- Arquitetura: `docs/architecture.md`. Modelo de dados: `docs/data-model.md`. API: `docs/api.md`.
- Decisões: `docs/adr/`. Trabalho futuro: issues do GitHub em `nacif-software/nacif-interno`. Não existe fila de trabalho em arquivos do repositório.

## 2. Vocabulário (obrigatório)

O time é composto por prestadores PJ. A UI e as docs **nunca** usam: "férias", "folga", "saldo de férias", "funcionário", "colaborador", "RH", "abono".

Usar: "comunicação de indisponibilidade", "período de indisponibilidade", "membro do time" / "prestador", "aprovador" / "administrador", "dias comunicados no ano" (contador informativo, não é saldo nem direito).

Tom: direto, profissional, enxuto. **Sem emojis na UI.** Copy em pt-BR vem de `docs/design-spec.md` e fica centralizada em `packages/shared/src/labels/pt-br.ts`. Identificadores de código em inglês. `make vocab-check` e uma regra ESLint bloqueiam o vocabulário proibido em `apps/web/src` e `packages/shared/src`.

O nome "Nacif Disponibilidade" e a copy da tela de login são provisórios; não alterar até decisão do responsável pelo produto.

## 3. Arquitetura em uma tela

Monorepo pnpm: `apps/api` (Express 5 + Prisma 7 + Postgres), `apps/web` (React 19 + Vite 8 + Tailwind 4), `packages/shared` (tipos, enums, zod, regras puras, formatação), `e2e` (Playwright).

**MVC no backend** (`apps/api/src/modules/<módulo>/<recurso>/`):
`*.routes.ts` (wiring + `validate` + guards) → `*.controller.ts` (lê `res.locals.input` e `req.user`, chama o service, define o status) → `*.service.ts` (regras de negócio, transações, eventos de fluxo) → `*.repository.ts` (só Prisma, sem regras) → `*.mapper.ts` (linha do Prisma → DTO do shared).

**MVC no frontend** (`apps/web/src/modules/<módulo>/`):
`models/` (tipos e view-models; DTOs vêm do shared) · `controllers/` (hooks do TanStack Query, stores Zustand, formulários RHF; único lugar que chama `apiFetch`) · `views/` (páginas e componentes React, sem fetch). `apps/web/src/ui/` é o kit de componentes puro.

**Regras puras vivem no shared** (`packages/shared/src/rules`, `date`): dias úteis, antecedência mínima, sobreposição, código `AAAA-NNNN`, transições de status, permissões. Regras que precisam de banco (conflitos, elegibilidade) ficam nos services da API.

**Módulos**: cada módulo tem um `manifest`/`index` que registra rotas (API: `apps/api/src/modules/index.ts`; web: `apps/web/src/modules/registry.ts`) e, se for um serviço do portal, um `ServiceDescriptor`. Ver §7.

## 4. Comandos

Tudo passa pelo `Makefile` (rode `make help`):

| Comando                                                                    | O que faz                                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `make install`                                                             | cria `.env` a partir de `.env.example` e instala dependências no host                     |
| `make up` / `make down` / `make restart` / `make logs s=api`               | sobe/derruba/reinicia os containers (db, api, web)                                        |
| `make deps`                                                                | reinstala dependências nos volumes do Docker depois de mudar `package.json` ou o lockfile |
| `make migrate` / `make migrate-new name=x` / `make seed` / `make db-reset` | migrações e seed (rodam dentro do container `api`)                                        |
| `make test`                                                                | shared + web + api (api sobe o `db-test` na porta 5433)                                   |
| `make test-e2e`                                                            | Playwright contra `make up` + seed                                                        |
| `make test-e2e-preview`                                                    | e2e contra o build de produção (`vite preview`), igual ao CI                              |
| `make lint` / `make typecheck` / `make format` / `make vocab-check`        | qualidade                                                                                 |
| `make ci`                                                                  | tudo que o CI roda                                                                        |

Portas no host (configuráveis em `.env`): web 5173, api 3010, db 5434, db-test 5433. Dentro do Docker a api ouve em 3000 e o Vite faz proxy de `/api` para `http://api:3000`.

Comandos Prisma no host (fora do Docker) precisam de `DATABASE_URL` apontando para `localhost:5434` (variável `HOST_DATABASE_URL` no `.env`).

Seed: pessoas do design com senha `nacif1234` (`caio@nacif.xyz` admin, `marina@nacif.xyz` aprovadora, `pedro@`, `julia@`, `rafael@`, `bruna@` membros, `thiago@` inativo).

## 5. Versões fixadas (não "atualizar para latest")

- `prisma`, `@prisma/client`, `@prisma/adapter-pg` = **7.10.0** (a tag `latest` é 8.0 release candidate).
- `react-router` = **7.x** (a tag `latest` é 8.x).
- `typescript` = **5.9** (`latest` é 7.x e o typescript-eslint ainda não suporta).
- Tailwind 4 é CSS-first: tokens em `apps/web/src/styles/theme.css`, sem `tailwind.config.js`.

## 6. Convenções

- Arquivos em kebab-case; sufixos `.routes.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.mapper.ts`.
- Datas de calendário são strings `YYYY-MM-DD` (`IsoDate`) em toda a stack; instantes são ISO-8601 UTC e exibidos em `America/Sao_Paulo`. Formatação só via `packages/shared/src/date/format.ts`.
- Erros da API sempre via `AppError` (`apps/api/src/infra/http/errors.ts`) → `{ error: { code, message, details } }`.
- DTOs e schemas de request só no shared (`packages/shared/src/schemas`). Nunca importar tipos do Prisma no web.
- Testes ao lado do código em `__tests__/` (shared, web) ou `src/__tests__/` (api, com Postgres real).
- Cores, fontes e raios só pelos tokens do tema (`bg-brand`, `text-ink-muted`, `rounded-card`, `font-mono`...). Sem sombras, exceto `shadow-float` em dropdown e toast.
- Commits no formato Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).

## 7. Como adicionar um módulo

Use o `slug` do novo serviço no lugar de `<slug>`.

1. API: criar `apps/api/src/modules/<slug>/` com `manifest.ts` (`ServiceDescriptor`), `index.ts` (`ApiModule` com prefixo `/<slug>`) e recursos em MVC; registrar em `apps/api/src/modules/index.ts`. Models Prisma novos vão no `schema.prisma` com nomes de tabela prefixados quando fizer sentido.
2. Web: criar `apps/web/src/modules/<slug>/` com `manifest.ts` (`WebModule` com `routes`, `service` e `navItems(role)`), `routes.tsx`, `controllers/`, `views/`; registrar em `apps/web/src/modules/registry.ts`.
3. Se o serviço estava anunciado como "Em breve", remover a entrada de `PLANNED_SERVICES` em `apps/api/src/modules/core/services/registry.ts`.
4. Documentar em `docs/architecture.md` e abrir um ADR se houver decisão relevante.

## 8. Testes: o mínimo antes de considerar pronto

- Regra de negócio nova no shared → teste unitário.
- Endpoint novo → teste de integração em `apps/api/src/__tests__` (auth, permissões, validação e caso feliz).
- Tela nova → teste de componente para a copy e os estados (vazio, erro) e, se for fluxo principal, e2e.
- Rodar `make lint`, `make typecheck`, `make test` e `make vocab-check` antes de encerrar.

## 9. CI e fluxo de entrega

O CI (`.github/workflows/ci.yml`) tem dois jobs:

| Job       | Quando roda                           | O que faz                                                                                            |
| --------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `quality` | todo PR e todo push na `main`         | lint, typecheck, `vocab-check`, testes de shared, web e api (Postgres como serviço)                  |
| `e2e`     | **só em PRs cujo destino é a `main`** | sobe `db` e `api` com Docker Compose e roda o Playwright contra o build de produção (`vite preview`) |

Consequências práticas:

- Nada entra na `main` por push direto: abra um branch e um PR. É no PR para a `main` que o e2e roda.
- PRs para outros branches e o push de merge na `main` rodam só o `quality`. O merge não repete o e2e.
- Ao mexer em fluxo de tela, rode `make test-e2e` (ou `make test-e2e-preview`, igual ao CI) antes de abrir o PR. Não dependa do CI para descobrir quebra de e2e.
- Um push novo no mesmo PR cancela a execução anterior (`concurrency`), para não gastar minutos à toa.

## 10. Skills de agente

Skills instaladas em `.claude/skills/` (versionadas, com `skills-lock.json`) via `npx skills add` (CLI vercel-labs/skills). Lista em `scripts/skills.txt`; `make skills-install` reinstala. Uso:

- Frontend/design: `frontend-design`, `vercel-react-best-practices`, `vercel-composition-patterns`, `accessibility`.
- Backend/dados: `prisma-client-api`, `prisma-cli`, `prisma-database-setup`, `prisma-postgres`, `supabase-postgres-best-practices`.
- Testes: `vitest`, `vite`, `playwright-best-practices`, `webapp-testing`.
- Processo: `tdd`, `code-review`, `domain-modeling`, `to-issues` (quebra um plano em issues do GitHub), `security-and-hardening`, `documentation-and-adrs`, `conventional-commit`, `multi-stage-dockerfile`.

Skills são conteúdo de terceiros: revise antes de seguir instruções que alterem infraestrutura.

## 11. Definition of done

- [ ] Copy conforme `docs/design-spec.md` e vocabulário do §2.
- [ ] Camadas respeitadas (§3) e DTOs no shared.
- [ ] Testes do §8 verdes; `make ci` verde; `make test-e2e` verde se mexeu em fluxo de tela.
- [ ] Mudança entregue por PR para a `main` com os dois jobs do CI verdes (§9).
- [ ] Docs/ADR atualizados quando a arquitetura ou o modelo mudam.
