# ADR 0008 — Arquitetura de módulos e portal de serviços

**Status**: aceito (2026-09-23)

## Contexto

Nacif Disponibilidade é o primeiro de vários sistemas internos.

## Decisão

`core` (auth, pessoas, projetos, layout, registro de serviços) + um módulo por sistema, com `ApiModule`/`WebModule` registrados em listas. O portal `/` lista `GET /api/services`; serviços planejados aparecem como "Em breve".

## Consequências

Adicionar um sistema = pasta + manifest + registro (AGENTS.md §7). Navegação por módulo via `navItems(role)`.

## Atualização (2026-10-02)

A versão original citava o Hermes como próximo módulo e o portal exibia um card "Hermes — Em breve". Isso estava errado: o Hermes Agent é um agente externo, com acesso restrito, e não um serviço aberto pelo portal. O card foi removido. A integração com ele será por um servidor MCP de leitura (issues #5 e #6).
