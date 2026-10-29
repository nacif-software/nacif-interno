# ADR 0011 — Hospedagem e runtime na Cloudflare: Workers, D1 e Drizzle

**Status**: aceito (2026-10-29)

## Contexto

O plano de 2026-10-06 (Cloudflare Pages para o web, Render para a API e o PostgreSQL, Resend para e-mail) dividia o sistema entre três provedores. A empresa tem conta e plano na Cloudflare, e o domínio principal passou a ser `nacif.software`, já administrado lá. A decisão é usar só a Cloudflare, sem Docker, inclusive em desenvolvimento.

Isso substitui o ADR 0002 (Express, Prisma, PostgreSQL). Dois fatos pesaram: o adapter do Prisma para D1 está em Preview e ignora transações, enquanto o Drizzle expõe `batch()`, que é atômico no D1; e a API tem 12 transações interativas, duas delas com leitura dependente (contador de código `AAAA-NNNN` e guards de status nas decisões).

## Decisão

- **Um Worker** (`nacif-interno`) serve o SPA pelos Static Assets (`apps/web/dist`, `not_found_handling: single-page-application`) e a API em `/api/*` (`run_worker_first`). Mesma origem, sem CORS. Domínio `interno.nacif.software`, Custom Domain do Worker: a zona `nacif.software` hospeda o site da empresa, então só o registro `interno` é criado, sem rotas com curinga e sem tocar na raiz ou no `www`.
- **API em Hono 4** no runtime Workers, mantendo o MVC do ADR 0005 e os DTOs no shared. Config e bindings são lidos por requisição, não no load do módulo.
- **Banco D1** (SQLite) com **Drizzle ORM** (0.45, tag `latest`; não usar `@rc`). Schema em `apps/api/src/db/schema.ts`; migrações SQL geradas por `drizzle-kit generate` e aplicadas por `wrangler d1 migrations apply`, local e remoto. Nunca usar `db.transaction()` (o D1 rejeita `BEGIN`); escrita com mais de um statement só por `db.batch()`; guards de estado no `WHERE` do próprio `UPDATE`; contador de código com `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` mais unique `(year, sequence)` e retry.
- **Tipos**: enums viram `text` com lista fechada e `CHECK`; datas de calendário `YYYY-MM-DD` em `text`; instantes ISO-8601 UTC em `text`; JSON em `text` modo json; ids UUID gerados pelo código.
- **Sessão e senha**: ADR 0004 mantido (sessão opaca em tabela, cookie `nacif_session`, bcryptjs). Tokens via Web Crypto.
- **Cron Trigger** diário limpa sessões e tokens expirados.
- **E-mail** pelo Email Service (binding `send_email`), remetente em `nacif.software`, atrás da interface `EmailSender` da issue #10. Resend descartado.
- **Login corporativo** pelo Cloudflare Access com Google Workspace na frente do app (issue #7); o login local fica como fallback de administrador. O domínio das contas continua `@nacif.xyz`.
- **Deploy** pelo Workers Builds a partir da `main`, previews por branch com D1 próprio; segredos como Workers secrets; logs em Workers Logs. Arquivos, se surgirem, em R2.
- **Desenvolvimento sem Docker**: `wrangler dev` com D1 local e Vite com proxy de `/api`. Testes da API rodam no runtime Workers (`@cloudflare/vitest-plugin`) com D1 local e migrações aplicadas no setup. Configuração em `apps/api/wrangler.jsonc`; o `cf` CLI fica só para operações de conta.

## Consequências

Perde-se o PostgreSQL: sem enums nativos nem `DATE`, limite de 10 GB por banco e um escritor por vez, aceitável para o volume do sistema. Prisma, Docker Compose, o serviço Postgres do CI e as skills de Prisma/Postgres saem. Versões fixadas passam a ser `drizzle-orm` 0.45, `wrangler` 4 e `hono` 4. O plano Workers Paid é necessário (Email Sending e cotas do D1). A migração acontece em três PRs (épica na issue #15): Hono ainda em Node, depois Workers com D1 e Drizzle sem Docker, depois deploy. `AGENTS.md` e os docs são atualizados em cada PR, não antes.
