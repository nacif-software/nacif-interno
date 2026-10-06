# Arquitetura

## Contexto

O repositório hospeda o **portal** de sistemas internos da Nacif. O portal (`/`) autentica a pessoa e lista os serviços disponíveis; cada serviço é um **módulo** com rotas próprias na API (`/api/<slug>/...`) e no web (`/<slug>/...`). O primeiro módulo é `disponibilidade` (Nacif Disponibilidade). Autenticação, pessoas, papéis, projetos e layout são do módulo `core` e compartilhados por todos.

## Mapa do monorepo

```
apps/api           Express 5 + Prisma 7 + PostgreSQL 17
apps/web           React 19 + Vite 8 + Tailwind 4 + React Router 7 + TanStack Query 5 + Zustand 5
packages/shared    tipos, enums, schemas zod, regras puras, formatação (sem I/O)
e2e                Playwright
docker/, Makefile  ambiente local
docs/              este diretório
```

## Ciclo de uma requisição (API)

```
HTTP → helmet/cors/cookie-parser/json → /api/<módulo> router
  → validate({ body, query, params })     zod (shared) → res.locals.input | 422
  → requireAuth / requireRole             cookie nacif_session → sessão no Postgres → req.user | 401/403
  → controller                            lê input e req.user, chama service, define status
  → service                               regras, transações ($transaction), eventos de fluxo, AppError
  → repository                            Prisma (driver adapter pg), sem regras
  → mapper                                linha → DTO (shared)
  → errorHandler                          AppError/ZodError → { error: { code, message, details } }
```

## Autenticação e sessão

- E-mail/senha local (`bcryptjs`), atrás da interface `AuthProvider` (`apps/api/src/modules/core/auth/providers`). Login corporativo entra trocando o provider (issue #7).
- Domínio restrito a `@nacif.xyz` antes de consultar o banco (`DOMAIN_NOT_ALLOWED` ecoa o e-mail para a copy da tela 01b).
- Sessão opaca (token de 256 bits) na tabela `sessions`, cookie `nacif_session` httpOnly/sameSite=lax, 30 dias deslizantes. Desativar uma pessoa revoga todas as sessões.
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

- Datas de calendário são `YYYY-MM-DD` (tipo `IsoDate`) em API, banco (`@db.Date`) e UI. Aritmética em UTC (`packages/shared/src/date/iso-date.ts`).
- Instantes (envio, decisão) são `timestamptz` e viajam como ISO UTC; a UI formata em `America/Sao_Paulo`.
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

`{ error: { code, message, details? } }` com códigos `VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `DOMAIN_NOT_ALLOWED` 403, `INVALID_CREDENTIALS` 401, `USER_INACTIVE` 403, `NOT_FOUND` 404, `INVALID_STATE` 409, `UNDO_WINDOW_EXPIRED` 409, `CONFLICT` 409, `INTERNAL` 500.

## Ambiente

`docker-compose.yml`: `db` (Postgres 17), `db-test` (profile `test`, tmpfs), `api` e `web` (mesma imagem `docker/dev.Dockerfile`, código montado, dependências em volumes nomeados, `pnpm install` no start). Variáveis em `.env` (ver `.env.example`); `apps/api/src/config/env.ts` valida com zod no boot.

## CI

`.github/workflows/ci.yml`:

- `quality` (todo PR e todo push na `main`): lint, typecheck, `vocab-check` e testes de shared, web e api com Postgres como serviço.
- `e2e` (só em PRs para a `main`): `docker compose up db api`, migrações, seed pelo global setup do Playwright, build do web e `vite preview` com proxy de `/api`. O dev server do Vite não é usado no CI porque em ambiente frio ele pode servir dependências desatualizadas.

A `main` só recebe código por PR, então todo código que chega nela passou pelo e2e. O push de merge roda apenas o `quality`.

## Deploy (futuro)

Não definido. Caminho provável: imagem multi-stage servindo `apps/web/dist` atrás da API na mesma origem, Postgres gerenciado, `prisma migrate deploy` no release.
