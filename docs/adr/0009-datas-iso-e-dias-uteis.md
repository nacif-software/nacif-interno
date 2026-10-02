# ADR 0009 — Datas como strings ISO e dias úteis sem feriados

**Status**: aceito (2026-09-23)

## Decisão

Datas de calendário são `YYYY-MM-DD` em toda a stack; instantes são UTC exibidos em `America/Sao_Paulo`. Dias úteis excluem sábado e domingo; feriados ficam para a issue 004.

## Consequências

Sem bugs de fuso em datas de período; formatação centralizada no shared; "hoje" para antecedência calculado no servidor.
