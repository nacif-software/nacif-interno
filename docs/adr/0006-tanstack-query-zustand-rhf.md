# ADR 0006 — TanStack Query para servidor, Zustand para cliente, RHF para formulários

**Status**: aceito (2026-09-23)

## Decisão

Estado de servidor com TanStack Query (cache, invalidação por prefixo, otimista na fila). Estado de cliente com Zustand (toasts, seleção em lote, undo). Formulários com react-hook-form + zodResolver usando os schemas do shared. Filtros na URL.

## Consequências

Sem Redux; menos boilerplate; validação idêntica no cliente e no servidor.
