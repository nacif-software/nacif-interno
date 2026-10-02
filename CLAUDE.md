# CLAUDE.md

Leia `AGENTS.md` primeiro: vocabulário obrigatório, arquitetura MVC, comandos `make`, versões fixadas e como adicionar módulos.

Notas específicas para o Claude Code:

- Use plan mode para mudanças no `schema.prisma`, no contrato da API ou na estrutura de módulos.
- Antes de encerrar uma tarefa, rode `make typecheck`, `make lint` e os testes do pacote alterado (`make test-shared`, `make test-web`, `make test-api`). Reporte falhas como falhas.
- Não edite `docs/design-spec.md`: é a fonte de verdade da UI. Divergências de produto viram issue em `docs/issues/`.
- Nunca troque `prisma`, `react-router` ou `typescript` para `latest` (ver AGENTS.md §5).
- Copy de UI só via `packages/shared/src/labels/pt-br.ts`; nada de strings soltas em português nos componentes quando já existir label.
- Skills do projeto ficam em `.claude/skills/`. Prefira `tdd` para regras de negócio e `code-review` antes de abrir PR.
