# ADR 0001 — Monorepo com pnpm workspaces

**Status**: aceito (2026-09-23)

## Contexto

Web, API, tipos compartilhados e e2e precisam evoluir juntos, com o mesmo contrato de dados, e o repositório vai abrigar mais de um sistema interno.

## Decisão

Monorepo com pnpm workspaces: `apps/api`, `apps/web`, `packages/shared`, `e2e`. O shared é consumido direto do código-fonte (`exports` → `src/index.ts`), sem build.

## Consequências

Um `pnpm install`, um lockfile, tipos e schemas únicos. Tooling (eslint, prettier, tsconfig base) na raiz. Docker precisa de volumes nomeados por pacote para `node_modules`.
