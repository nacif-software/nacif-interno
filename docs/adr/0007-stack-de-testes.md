# ADR 0007 — Vitest, Testing Library, Supertest com Postgres real e Playwright

**Status**: aceito (2026-09-23)

## Decisão

Shared: Vitest unitário. Web: Vitest + Testing Library (jsdom). API: Vitest + Supertest contra Postgres real (`db-test`, tmpfs, truncate por teste, migrações no global setup). E2e: Playwright contra `make up` + seed.

## Consequências

Testes de API cobrem SQL, índices e transações de verdade. CI precisa de um serviço Postgres.

## Atualização (2026-10-02)

No CI o e2e roda contra o build de produção (`vite preview`), não contra o dev server, e só em PRs para a `main`, por custo de minutos. Localmente `make test-e2e` continua usando o dev server do `make up`; `make test-e2e-preview` reproduz o modo do CI.

## Atualização (2026-10-29)

Supertest foi substituído por um cliente de teste próprio sobre `app.request()` do Hono (`apps/api/src/test/app.ts`), com a mesma forma de uso (`agent.post(path).send(body)`), na migração da API para Hono (issue #19).

Com o ADR 0011 os testes da API rodam no runtime Workers (`@cloudflare/vitest-plugin`) contra um D1 local, com migrações aplicadas no setup e storage isolado por teste no lugar do truncate. O e2e roda contra `wrangler dev` servindo o build de produção do web; `make test-e2e-preview` deixa de existir. O CI não precisa mais de Postgres nem de Docker.
