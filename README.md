# Nacif Interno

Portal de sistemas internos da Nacif. Primeiro módulo: **Nacif Disponibilidade**, comunicação de períodos de indisponibilidade com fluxo de aprovação.

## Rodando localmente

Pré-requisitos: Docker, Node 22, pnpm 10 (`corepack enable`), GNU Make.

```bash
make install   # cria .env e instala dependências
make up        # sobe db, api e web
make migrate   # aplica as migrações
make seed      # dados de exemplo (senha nacif1234)
```

Web em http://localhost:5173, API em http://localhost:3010/api/health. Portas configuráveis no `.env`.

Usuários do seed: `caio@nacif.xyz` (administrador), `marina@nacif.xyz` (aprovadora), `pedro@nacif.xyz`, `julia@nacif.xyz`, `rafael@nacif.xyz`, `bruna@nacif.xyz` (membros).

## Qualidade

```bash
make test        # shared + web + api
make test-e2e    # Playwright (exige make up + seed)
make lint && make typecheck && make vocab-check
```

No GitHub Actions, o job `quality` roda em todo PR e em todo push na `main`. O job `e2e` roda só em PRs para a `main`. Detalhes em `AGENTS.md`, seção 9.

## Documentação

- `AGENTS.md`: guia para pessoas e agentes (vocabulário, arquitetura, convenções).
- `docs/architecture.md`, `docs/data-model.md`, `docs/api.md`, `docs/design-spec.md`.
- `docs/adr/`: decisões. `docs/issues/`: trabalho futuro a publicar no GitHub.
