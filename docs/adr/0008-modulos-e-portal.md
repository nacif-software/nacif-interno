# ADR 0008 — Arquitetura de módulos e portal de serviços

**Status**: aceito (2026-09-23)

## Contexto

Nacif Disponibilidade é o primeiro de vários sistemas internos (próximo: Hermes).

## Decisão

`core` (auth, pessoas, projetos, layout, registro de serviços) + um módulo por sistema, com `ApiModule`/`WebModule` registrados em listas. O portal `/` lista `GET /api/services`; serviços planejados aparecem como "Em breve".

## Consequências

Adicionar um sistema = pasta + manifest + registro (AGENTS.md §7). Navegação por módulo via `navItems(role)`.
