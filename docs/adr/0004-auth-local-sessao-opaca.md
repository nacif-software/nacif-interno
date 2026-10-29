# ADR 0004 — Autenticação local com sessão opaca em cookie

**Status**: aceito (2026-09-23)

## Contexto

O design prevê login com e-mail Nacif restrito ao domínio; OAuth exige configuração externa que ainda não existe.

## Decisão

E-mail/senha (bcryptjs) atrás da interface `AuthProvider`. Sessão opaca em Postgres (`sessions`), cookie httpOnly `nacif_session`, 30 dias deslizantes. Domínio `@nacif.xyz` validado antes do provider. Convite gera link de definição de senha (sem e-mail no MVP).

## Consequências

Revogação imediata (inativar pessoa apaga sessões). Trocar para Google OAuth = novo provider (issue #7), mantendo sessões e guards.

## Atualização (2026-10-29)

A decisão continua valendo com o ADR 0011: a sessão opaca passa a ser armazenada no D1, o cookie e o fluxo não mudam. Tokens de sessão e de definição de senha passam a usar Web Crypto. O login corporativo (issue #7) será pelo Cloudflare Access, com o login local como fallback de administrador.
