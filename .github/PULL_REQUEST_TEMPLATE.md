<!-- O título deste PR vira o commit na main (squash and merge). Use Conventional Commits: feat:, fix:, docs:, ci:, chore: -->

## O que muda

<!-- Resumo em uma ou duas frases. -->

## Como testar

<!-- Comandos `make` e passos manuais. -->

## Checklist

- [ ] `make lint`, `make typecheck` e `make test` verdes
- [ ] Copy de UI conforme `docs/design-spec.md` e vocabulário de `AGENTS.md`
- [ ] Docs/ADR atualizados quando a arquitetura muda; `docs/deploy.md` se mudou binding, var, secret, cron ou domínio
- [ ] Migração de banco (se houver) compatível com o código em produção: ela roda antes do código novo e não volta no rollback (AGENTS.md §9)
