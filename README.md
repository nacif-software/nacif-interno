# Nacif Interno

Portal de sistemas internos da Nacif. Primeiro módulo: **Nacif Disponibilidade**, comunicação de períodos de indisponibilidade com fluxo de aprovação.

## Rodando localmente

Pré-requisitos: Node 22, pnpm 10 (`corepack enable`), GNU Make. Não precisa de Docker: a API roda como Cloudflare Worker local (`wrangler dev`) e o banco é um D1 local (SQLite em `apps/api/.wrangler/state`). Não precisa de conta na Cloudflare para desenvolver.

```bash
make install   # dependências, apps/api/.dev.vars, tipos do Worker e migrações do D1 local
make seed      # dados de exemplo (senha nacif1234)
make dev       # Worker (API) em :8787 e web (Vite) em :5173, juntos
```

Abra http://localhost:5173. A API responde em http://localhost:8787/api/health; em dev o Vite repassa `/api` para o Worker.

Usuários do seed: `caio@nacif.xyz` (administrador), `marina@nacif.xyz` (aprovadora), `pedro@nacif.xyz`, `julia@nacif.xyz`, `rafael@nacif.xyz`, `bruna@nacif.xyz` (membros). `thiago@nacif.xyz` está inativo.

### Dia a dia

| Quero...                                    | Comando                                                                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Rodar só a API ou só o web                  | `make dev-api` / `make dev-web`                                                                           |
| Zerar o banco local e refazer o seed        | `make db-reset`                                                                                           |
| Mudar o schema                              | editar `apps/api/src/db/schema.ts`, `make migrate-new name=descricao`, `make migrate`                     |
| Mudar o `wrangler.jsonc`                    | `make types` (regera `worker-configuration.d.ts`)                                                         |
| Ver o banco local                           | `pnpm --filter @nacif/api exec wrangler d1 execute nacif-interno-prod --local --command "select * from users"` |
| Testar o build de produção do web no Worker | `make build-web && make dev-api`, depois http://localhost:8787                                            |
| Checar o bundle antes de publicar           | `make deploy-check`                                                                                       |

Variáveis locais ficam em `apps/api/.dev.vars` (criado a partir de `.dev.vars.example`; não é versionado). As de produção ficam em `vars` no `apps/api/wrangler.jsonc`.

### Se algo der errado

- **Porta 8787 ou 5173 ocupada**: encerre o processo anterior (`lsof -i :8787`) ou rode `make dev-api`/`make dev-web` separados.
- **Erro de tipo em `Env` ou `D1Database`**: `make types`.
- **"no such table" ou dados estranhos no D1 local**: `make db-reset`.
- **`make test-e2e` usou um web antigo**: localmente ele reaproveita um Worker já de pé; rode `make build-web` antes ou derrube o `wrangler dev`.
- **Instalou dependências e algo não resolve**: `make clean && make install`.

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
- `docs/deploy.md`: como o app é publicado na Cloudflare (Workers Builds), primeiro administrador, rollback de código e de dados.
- `docs/adr/`: decisões. Trabalho futuro: [issues do GitHub](https://github.com/nacif-software/nacif-interno/issues).
