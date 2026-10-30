# Arquitetura

## Contexto

O repositório hospeda o **portal** de sistemas internos da Nacif. O portal (`/`) autentica a pessoa e lista os serviços disponíveis; cada serviço é um **módulo** com rotas próprias na API (`/api/<slug>/...`) e no web (`/<slug>/...`). O primeiro módulo é `disponibilidade` (Nacif Disponibilidade). Autenticação, pessoas, papéis, projetos e layout são do módulo `core` e compartilhados por todos.

## Mapa do monorepo

```
apps/api           Hono 4 + Drizzle ORM + D1, publicado como Cloudflare Worker (serve também o web)
apps/web           React 19 + Vite 8 + Tailwind 4 + React Router 7 + TanStack Query 5 + Zustand 5
packages/shared    tipos, enums, schemas zod, regras puras, formatação (sem I/O)
e2e                Playwright
Makefile           comandos locais (wrangler dev + Vite, sem Docker)
docs/              este diretório
```

## Ciclo de uma requisição (API)

```
HTTP → secureHeaders/cors/bodyLimit → /api/<módulo> router (Hono)
  → validate({ body, query, params })     zod (shared) → c.get('input') | 422 (JSON inválido → 400)
  → requireAuth / requireRole             cookie nacif_session → sessão no D1 → c.get('user') | 401/403
  → controller                            lê input e c.get('user'), chama service, devolve c.json(body, status)
  → service                               regras, escrita composta em db().batch(), eventos de fluxo, AppError
  → repository                            Drizzle sobre o binding D1, sem regras
  → mapper                                linha → DTO (shared)
  → onError                               AppError/ZodError → { error: { code, message, details } }
```

## Autenticação e sessão

- E-mail/senha local (`bcryptjs`), atrás da interface `AuthProvider` (`apps/api/src/modules/core/auth/providers`). Login corporativo entra trocando o provider (issue #7).
- Domínio restrito a `@nacif.xyz` antes de consultar o banco (`DOMAIN_NOT_ALLOWED` ecoa o e-mail para a copy da tela 01b).
- Sessão opaca (token de 256 bits, Web Crypto) na tabela `sessions` do D1, cookie `nacif_session` httpOnly/sameSite=lax, 30 dias deslizantes. Desativar uma pessoa revoga todas as sessões. Um Cron Trigger diário apaga sessões e tokens expirados.
- Convite: admin cria a pessoa sem senha e recebe um link `/definir-senha/<token>` (token com hash sha256 na tabela `password_setup_tokens`, 7 dias, uso único). Sem e-mail no MVP (issue #10).

## Sistema de módulos

- API: `ApiModule { slug, prefix, router, service? }` em `apps/api/src/infra/http/module.ts`, registrados em `apps/api/src/modules/index.ts`. `GET /api/services` monta a lista do portal a partir dos módulos + `PLANNED_SERVICES` (placeholders "Em breve").
- Web: `WebModule { slug, routes, service?, navItems(role) }` em `apps/web/src/modules/registry.ts`. O `AppShell` descobre o módulo pela URL e monta topbar e tab bar mobile com `navItems(role)`.

## Fluxo de dados no web

- **Servidor** (TanStack Query): chaves em `apps/web/src/lib/query-keys.ts`; mutações invalidam por prefixo (`['disp']`, `['users']`...). 401 em qualquer chamada zera `['auth','me']` e o `RequireAuth` redireciona para `/login?next=`.
- **Cliente** (Zustand): toasts, seleção em lote da fila, undo de lote.
- **Formulários**: react-hook-form + `zodResolver` com os mesmos schemas da API.
- **URL**: filtros, mês e projeto ficam em search params para links compartilháveis.

## Datas e fuso

- Datas de calendário são `YYYY-MM-DD` (tipo `IsoDate`) em API, banco (coluna `text`) e UI. Aritmética em UTC (`packages/shared/src/date/iso-date.ts`).
- Instantes (envio, decisão) são `Date` no código e texto ISO-8601 UTC no D1 (`isoTimestamp` em `src/db/schema.ts`); a UI formata em `America/Sao_Paulo`.
- "Hoje" para a antecedência mínima é calculado no servidor em `America/Sao_Paulo`.
- Dias úteis = segunda a sexta; feriados são trabalho futuro (issue #8).

## Regras de negócio do módulo disponibilidade

| Regra                                                                                      | Onde                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Dias úteis, antecedência mínima, sobreposição, código `AAAA-NNNN`, transições, quem decide | `packages/shared/src/rules`, `date`               |
| Conflito (aprovadas de outra pessoa no mesmo projeto) e `limitReached`                     | `apps/api/.../communications/conflict.service.ts` |
| Elegibilidade de cobertura/aprovador                                                       | `communications.service.ts`                       |
| Eventos de fluxo (SUBMITTED, IN_REVIEW, DECISION, CANCELLED, EDITED, DECISION_REVERTED)    | services de communications e approvals            |
| Aprovação em lote com undo (30 s no servidor, toast de 10 s)                               | `approvals.service.ts`                            |

## Contrato de erro

`{ error: { code, message, details? } }` com códigos `VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `DOMAIN_NOT_ALLOWED` 403, `INVALID_CREDENTIALS` 401, `USER_INACTIVE` 403, `NOT_FOUND` 404, `INVALID_STATE` 409, `UNDO_WINDOW_EXPIRED` 409, `CONFLICT` 409, `INTERNAL` 500. JSON malformado devolve `VALIDATION_ERROR` 400 e corpo acima de 256 kB devolve `VALIDATION_ERROR` 413.

## Ambiente

Sem Docker. `apps/api/wrangler.jsonc` descreve o Worker: `main` em `src/worker.ts`, binding `DB` (D1), `assets` apontando para `apps/web/dist` (SPA com `run_worker_first` em `/api/*`), `vars` de produção, Cron Trigger e observabilidade. Em dev, `wrangler dev` (porta 8787) usa um D1 local em `apps/api/.wrangler/state` e lê `apps/api/.dev.vars`; o Vite (5173) faz proxy de `/api`. `apps/api/src/config/env.ts` valida as `vars` com zod a cada requisição (com cache por objeto `env`), e `src/db/client.ts` vincula o Drizzle ao binding (`bindDb`/`db()`).

Migrações: `drizzle-kit generate` gera SQL em `apps/api/drizzle/`; `wrangler d1 migrations apply` aplica (local ou remoto). Seed: `scripts/seed.ts` gera `.wrangler/seed.sql` e aplica só no D1 local.

## CI

`.github/workflows/ci.yml`:

- `quality` (todo PR e todo push na `main`): lint, typecheck, `vocab-check`, testes de shared, web e api (os da API rodam no workerd via `@cloudflare/vitest-plugin`, com D1 local e migrações aplicadas no setup), build do web e `wrangler deploy --dry-run`.
- `e2e` (só em PRs para a `main`): o Playwright sobe `wrangler dev` servindo o build de produção do web, aplica migrações e seed no D1 local e roda a suíte.

A `main` só recebe código por PR, então todo código que chega nela passou pelo e2e. O push de merge roda apenas o `quality`.

## Deploy

Cloudflare Workers Builds publica a `main` a cada merge: build do web, migrações do D1 e deploy do Worker em `interno.nacif.software` (ADR 0011). Só produção; previews por branch ficam para depois do Access. O primeiro administrador é criado por `make create-admin`. Configuração do Builds, bindings, rollback de código (`wrangler rollback`) e de dados (D1 Time Travel) em `docs/deploy.md`.
