# ADR 0007 — Vitest, Testing Library, Supertest com Postgres real e Playwright

**Status**: aceito (2026-09-23)

## Decisão

Shared: Vitest unitário. Web: Vitest + Testing Library (jsdom). API: Vitest + Supertest contra Postgres real (`db-test`, tmpfs, truncate por teste, migrações no global setup). E2e: Playwright contra `make up` + seed.

## Consequências

Testes de API cobrem SQL, índices e transações de verdade. CI precisa de um serviço Postgres.

## Atualização (2026-10-02)

No CI o e2e roda contra o build de produção (`vite preview`), não contra o dev server, e só em PRs para a `main`, por custo de minutos. Localmente `make test-e2e` continua usando o dev server do `make up`; `make test-e2e-preview` reproduz o modo do CI.
