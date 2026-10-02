# ADR 0002 — Express 5 + Prisma 7 + PostgreSQL

**Status**: aceito (2026-09-23)

## Contexto

Backend Node com MVC explícito, ORM tipado e banco relacional para fluxo de aprovação com histórico.

## Decisão

Express 5 (async errors nativos), Prisma 7 com driver adapter `pg` (cliente sem engine Rust), PostgreSQL 17. Prisma fixado em 7.10 porque `latest` é 8.0-rc.

## Consequências

Roteamento e middlewares familiares; validação com zod no `validate`; transações interativas para envio/decisão. Migrações versionadas em `apps/api/prisma/migrations`.
