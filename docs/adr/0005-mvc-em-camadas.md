# ADR 0005 — MVC explícito em todas as camadas

**Status**: aceito (2026-09-23)

## Decisão

API: routes → controller → service → repository → mapper. Web: models (tipos) → controllers (hooks/stores) → views (React). Regras puras no shared.

## Consequências

Testabilidade por camada; regras de negócio reutilizadas entre formulário e API (dias úteis, antecedência). Um pouco mais de arquivos por recurso, compensado pela previsibilidade para agentes.
