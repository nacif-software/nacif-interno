# CLAUDE.md

Leia `AGENTS.md` primeiro: vocabulário obrigatório, arquitetura MVC, comandos `make`, versões fixadas e como adicionar módulos.

Notas específicas para o Claude Code:

- Use plan mode para mudanças no `schema.prisma`, no contrato da API ou na estrutura de módulos.
- Antes de encerrar uma tarefa, rode `make typecheck`, `make lint` e os testes do pacote alterado (`make test-shared`, `make test-web`, `make test-api`). Reporte falhas como falhas.
- Nunca faça push direto na `main`: branch + PR, sempre com squash and merge. O título do PR vira o commit na `main`, então escreva-o em Conventional Commits. O e2e só roda no CI em PRs para a `main` (AGENTS.md §9), então rode `make test-e2e` localmente quando alterar fluxo de tela.
- Não edite `docs/design-spec.md`: é a fonte de verdade da UI. Divergências de produto viram issue no GitHub.
- Nunca troque `prisma`, `react-router` ou `typescript` para `latest` (ver AGENTS.md §5).
- Copy de UI só via `packages/shared/src/labels/pt-br.ts`; nada de strings soltas em português nos componentes quando já existir label.
- Skills do projeto ficam em `.claude/skills/` (AGENTS.md §10). Prefira `tdd` para regras de negócio e `code-review` antes de abrir PR.
