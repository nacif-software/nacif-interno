# ADR 0003 — React 19 + Vite 8 + Tailwind 4

**Status**: aceito (2026-09-23)

## Contexto

Sistema interno, sem SEO; prioridade é velocidade de desenvolvimento e fidelidade ao design.

## Decisão

SPA com Vite, React 19 e React Router 7 (data mode). Tailwind 4 CSS-first com todos os tokens do design em `styles/theme.css` (paleta fechada: `--color-*: initial`). Fontes self-hosted via `@fontsource`.

## Consequências

Sem cores fora do design; tipografia e raios via tokens. Vite faz proxy de `/api` em dev para manter o cookie first-party.
