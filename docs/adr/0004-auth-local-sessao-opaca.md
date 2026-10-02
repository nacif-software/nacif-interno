# ADR 0004 — Autenticação local com sessão opaca em cookie

**Status**: aceito (2026-09-23)

## Contexto

O design prevê login com e-mail Nacif restrito ao domínio; OAuth exige configuração externa que ainda não existe.

## Decisão

E-mail/senha (bcryptjs) atrás da interface `AuthProvider`. Sessão opaca em Postgres (`sessions`), cookie httpOnly `nacif_session`, 30 dias deslizantes. Domínio `@nacif.xyz` validado antes do provider. Convite gera link de definição de senha (sem e-mail no MVP).

## Consequências

Revogação imediata (inativar pessoa apaga sessões). Trocar para Google OAuth = novo provider (issue 003), mantendo sessões e guards.
