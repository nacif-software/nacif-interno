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

Monorepo pnpm: `apps/api` (Hono 4 + Drizzle + D1, publicado como Cloudflare Worker que também serve o web), `apps/web` (React 19 + Vite 8 + Tailwind 4), `packages/shared` (tipos, enums, zod, regras puras, formatação), `e2e` (Playwright).

**MVC no backend** (`apps/api/src/modules/<módulo>/<recurso>/`):
`*.routes.ts` (wiring + `validate` + guards) → `*.controller.ts` (lê `c.get('input')` e `c.get('user')`, chama o service, devolve `c.json(body, status)`) → `*.service.ts` (regras de negócio, transações, eventos de fluxo) → `*.repository.ts` (só Drizzle, sem regras; escrita composta vira builders para `db().batch()`) → `*.mapper.ts` (linha do banco → DTO do shared).

**MVC no frontend** (`apps/web/src/modules/<módulo>/`):
`models/` (tipos e view-models; DTOs vêm do shared) · `controllers/` (hooks do TanStack Query, stores Zustand, formulários RHF; único lugar que chama `apiFetch`) · `views/` (páginas e componentes React, sem fetch). `apps/web/src/ui/` é o kit de componentes puro.

**Regras puras vivem no shared** (`packages/shared/src/rules`, `date`): dias úteis, antecedência mínima, sobreposição, código `AAAA-NNNN`, transições de status, permissões. Regras que precisam de banco (conflitos, elegibilidade) ficam nos services da API.

**Módulos**: cada módulo tem um `manifest`/`index` que registra rotas (API: `apps/api/src/modules/index.ts`; web: `apps/web/src/modules/registry.ts`) e, se for um serviço do portal, um `ServiceDescriptor`. Ver §7.

## 4. Comandos

Tudo passa pelo `Makefile` (rode `make help`). Não há Docker: o Worker roda local com `wrangler dev` e o banco é um D1 local (SQLite em `apps/api/.wrangler/state`).

| Comando                                                                    | O que faz                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `make install`                                                             | instala dependências, cria `apps/api/.dev.vars`, gera os tipos do Worker e migra o D1 local |
| `make dev`                                                                 | sobe o Worker (API, `:8787`) e o Vite (web, `:5173`, proxy de `/api` para `:8787`)          |
| `make types`                                                               | regera `worker-configuration.d.ts` depois de mudar o `wrangler.jsonc`                       |
| `make migrate` / `make migrate-new name=x` / `make seed` / `make db-reset` | migrações (`drizzle-kit generate` + `wrangler d1 migrations apply --local`) e seed          |
| `make test`                                                                | shared + web + api (api roda no runtime Workers com D1 local, sem serviço externo)          |
| `make test-e2e`                                                            | Playwright contra o build de produção servido por `wrangler dev` (sobe sozinho)             |
| `make deploy-check`                                                        | build do web + `wrangler deploy --dry-run`                                                  |
| `make lint` / `make typecheck` / `make format` / `make vocab-check`        | qualidade                                                                                   |
| `make ci`                                                                  | tudo que o CI roda                                                                          |

Portas: web 5173 (dev), Worker 8787 (API e, no e2e, também o web buildado). Variáveis locais em `apps/api/.dev.vars` (copiado de `.dev.vars.example`); as de produção ficam em `vars` no `wrangler.jsonc`.

Seed: pessoas do design com senha `nacif1234` (`caio@nacif.xyz` admin, `marina@nacif.xyz` aprovadora, `pedro@`, `julia@`, `rafael@`, `bruna@` membros, `thiago@` inativo). Só roda no D1 local.

## 5. Versões fixadas (não "atualizar para latest")

- `drizzle-orm` = **0.45.x** e `drizzle-kit` = **0.31.x** (a tag `rc` é a 1.0, com API relacional diferente).
- `wrangler` = **4.x**.
- `react-router` = **7.x** (a tag `latest` é 8.x).
- `typescript` = **5.9** (`latest` é 7.x e o typescript-eslint ainda não suporta).
- `hono` = **4.x**.
- Tailwind 4 é CSS-first: tokens em `apps/web/src/styles/theme.css`, sem `tailwind.config.js`.

## 6. Convenções

- Arquivos em kebab-case; sufixos `.routes.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.mapper.ts`.
- Datas de calendário são strings `YYYY-MM-DD` (`IsoDate`) em toda a stack, inclusive no banco; instantes são ISO-8601 UTC (texto no D1, `Date` no código) e exibidos em `America/Sao_Paulo`. Formatação só via `packages/shared/src/date/format.ts`.
- Erros da API sempre via `AppError` (`apps/api/src/infra/http/errors.ts`) → `{ error: { code, message, details } }`.
- DTOs e schemas de request só no shared (`packages/shared/src/schemas`). Nunca importar tipos do Drizzle (`apps/api/src/db`) no web.
- Banco: schema em `apps/api/src/db/schema.ts`, tipos de linha em `src/db/types.ts`. O D1 não tem transação interativa: **nunca `db().transaction()`**; escrita com mais de um statement vai num único `db().batch([...])`, e guards de estado vão no `WHERE` do `UPDATE` (ver `approvals.service.ts`).
- Testes ao lado do código em `__tests__/` (shared, web) ou `src/__tests__/` (api, no runtime Workers com D1 local).
- Cores, fontes e raios só pelos tokens do tema (`bg-brand`, `text-ink-muted`, `rounded-card`, `font-mono`...). Sem sombras, exceto `shadow-float` em dropdown e toast.
- Commits e títulos de PR no formato Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`...). O título do PR é o que fica na `main` (§9).

## 7. Como adicionar um módulo

Use o `slug` do novo serviço no lugar de `<slug>`.

1. API: criar `apps/api/src/modules/<slug>/` com `manifest.ts` (`ServiceDescriptor`), `index.ts` (`ApiModule` com prefixo `/<slug>`) e recursos em MVC; registrar em `apps/api/src/modules/index.ts`. Tabelas novas vão em `apps/api/src/db/schema.ts` (e `relations.ts`), com nomes prefixados quando fizer sentido, seguidas de `make migrate-new name=x`.
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

| Job       | Quando roda                           | O que faz                                                                                                                     |
| --------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `quality` | todo PR e todo push na `main`         | lint, typecheck, `vocab-check`, testes de shared, web e api (D1 local no workerd), build do web e `wrangler deploy --dry-run` |
| `e2e`     | **só em PRs cujo destino é a `main`** | Playwright contra o build de produção do web servido por `wrangler dev` com D1 local (sem Docker)                             |

Consequências práticas:

- Nada entra na `main` por push direto: abra um branch e um PR. É no PR para a `main` que o e2e roda.
- PRs para outros branches e o push de merge na `main` rodam só o `quality`. O merge não repete o e2e.
- Ao mexer em fluxo de tela, rode `make test-e2e` (igual ao CI) antes de abrir o PR. Não dependa do CI para descobrir quebra de e2e.
- Um push novo no mesmo PR cancela a execução anterior (`concurrency`), para não gastar minutos à toa.

Como o PR entra na `main`:

- **Sempre squash and merge.** É o único método habilitado no repositório. Cada PR vira um commit na `main`; os commits intermediários ficam no PR.
- **O título do PR vira a mensagem do commit**, com o corpo do PR como descrição. Por isso o título segue Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`...) e o corpo diz o que muda e como testar.
- A `main` é protegida: exige PR, os checks `quality` e `e2e` verdes e o branch atualizado com a `main`. Sem force push. O branch é apagado automaticamente após o merge.
- Quem mergeia é quem abriu o PR ou quem revisou, depois do CI verde.

## 10. Skills de agente

Skills instaladas em `.claude/skills/` (versionadas, com `skills-lock.json`) via `npx skills add` (CLI vercel-labs/skills). Lista em `scripts/skills.txt`; `make skills-install` reinstala. Uso:

- Frontend/design: `frontend-design`, `vercel-react-best-practices`, `vercel-composition-patterns`, `accessibility`.
- Backend/dados: o plugin `cloudflare` do Claude Code (skills `workers-best-practices`, `wrangler`, `cloudflare`) cobre Workers, D1 e wrangler; não há skill de Drizzle instalada.
- Testes: `vitest`, `vite`, `playwright-best-practices`, `webapp-testing`.
- Processo: `tdd`, `code-review`, `domain-modeling`, `to-issues` (quebra um plano em issues do GitHub), `security-and-hardening`, `documentation-and-adrs`, `conventional-commit`.

Skills são conteúdo de terceiros: revise antes de seguir instruções que alterem infraestrutura.

## 11. Definition of done

- [ ] Copy conforme `docs/design-spec.md` e vocabulário do §2.
- [ ] Camadas respeitadas (§3) e DTOs no shared.
- [ ] Testes do §8 verdes; `make ci` verde; `make test-e2e` verde se mexeu em fluxo de tela.
- [ ] Mudança entregue por PR para a `main` com os dois jobs do CI verdes (§9).
- [ ] Docs/ADR atualizados quando a arquitetura ou o modelo mudam.
