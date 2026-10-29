# Nacif Interno

Portal de sistemas internos da Nacif. Primeiro módulo: **Nacif Disponibilidade**, comunicação de períodos de indisponibilidade com fluxo de aprovação.

## Rodando localmente

Pré-requisitos: Node 22, pnpm 10 (`corepack enable`), GNU Make. Sem Docker: a API roda como Cloudflare Worker local (`wrangler dev`) com um banco D1 local.

```bash
make install   # dependências, .dev.vars, tipos do Worker e migrações do D1 local
make seed      # dados de exemplo (senha nacif1234)
make dev       # Worker (API) em :8787 e web (Vite) em :5173
```

Web em http://localhost:5173, API em http://localhost:8787/api/health.

Usuários do seed: `caio@nacif.xyz` (administrador), `marina@nacif.xyz` (aprovadora), `pedro@nacif.xyz`, `julia@nacif.xyz`, `rafael@nacif.xyz`, `bruna@nacif.xyz` (membros).

## Qualidade

```bash
make test        # shared + web + api
make test-e2e    # Playwright contra o build de produção servido pelo Worker local
make lint && make typecheck && make vocab-check
```

No GitHub Actions, o job `quality` roda em todo PR e em todo push na `main`. O job `e2e` roda só em PRs para a `main`. Detalhes em `AGENTS.md`, seção 9.

## Documentação

- `AGENTS.md`: guia para pessoas e agentes (vocabulário, arquitetura, convenções).
- `docs/architecture.md`, `docs/data-model.md`, `docs/api.md`, `docs/design-spec.md`.
- `docs/adr/`: decisões. Trabalho futuro: [issues do GitHub](https://github.com/nacif-software/nacif-interno/issues).
