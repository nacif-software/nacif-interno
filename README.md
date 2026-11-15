# Nacif Interno

Portal de sistemas internos da Nacif, publicado em `interno.nacif.software`. Primeiro módulo: **Nacif Disponibilidade**, onde membros do time comunicam períodos de indisponibilidade, aprovadores decidem e o saldo de dias de cada pessoa é controlado.

## O que o sistema faz

- **Portal** (`/`): login com e-mail `@nacif.xyz` e senha; lista os serviços internos. Pessoas entram por convite de um administrador (link de definição de senha, 7 dias, uso único).
- **Comunicação de indisponibilidade**: o membro escolhe o período (dias úteis), quem cobre e o aprovador; vê conflitos com outras pessoas dos mesmos projetos e o saldo que ficaria. Pode editar o período ou cancelar enquanto está em análise.
- **Aprovação**: fila por aprovador (administrador vê tudo), aprovar com ou sem ajuste dos dias descontados, recusar com justificativa, aprovação em lote com 30 s para desfazer. Calendário do time por mês e projeto.
- **Saldo de dias** (ADR 0012): saldo = créditos − vendas − dias descontados das comunicações aprovadas; pode ficar negativo, com aviso. Crédito anual de 10 dias no aniversário da data base do crédito, lançado pelo cron. Extrato por pessoa.
- **Administração**: pessoas, papéis, projetos (N:N com as pessoas), data base, saldos (créditos manuais e vendas, com nota), configurações (antecedência mínima, limite por projeto, dias por ano, aprovadores padrão).
- **Notificações push** (ADR 0013): avisos no navegador, por dispositivo, do que precisa da atenção de cada papel. Ver abaixo.

Vocabulário obrigatório, arquitetura e convenções estão no `AGENTS.md`. A UI segue `docs/design-spec.md`.

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

| Quero...                                    | Comando                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Rodar só a API ou só o web                  | `make dev-api` / `make dev-web`                                                                                |
| Zerar o banco local e refazer o seed        | `make db-reset`                                                                                                |
| Mudar o schema                              | editar `apps/api/src/db/schema.ts`, `make migrate-new name=descricao`, `make migrate`                          |
| Mudar o `wrangler.jsonc`                    | `make types` (regera `worker-configuration.d.ts`)                                                              |
| Ver o banco local                           | `pnpm --filter @nacif/api exec wrangler d1 execute nacif-interno-prod --local --command "select * from users"` |
| Testar o build de produção do web no Worker | `make build-web && make dev-api`, depois http://localhost:8787                                                 |
| Checar o bundle antes de publicar           | `make deploy-check`                                                                                            |
| Criar ou promover um administrador          | `make create-admin email=x@nacif.xyz db=local` (sem `db=local` escreve em produção)                            |
| Importar o histórico da planilha (uma vez)  | `make import-sheet file=x.json db=local` (ver `docs/deploy.md`)                                                |
| Gerar chaves VAPID para o push              | `make vapid-keys`                                                                                              |
| Rodar o cron à mão                          | `wrangler dev --test-scheduled` e `curl "localhost:8787/__scheduled?cron=0+3+*+*+*"`                           |

### Variáveis e segredos

Variáveis locais ficam em `apps/api/.dev.vars` (criado a partir de `.dev.vars.example`; não é versionado). As de produção ficam em `vars` no `apps/api/wrangler.jsonc`; segredos entram com `wrangler secret put`. Tabela completa em `docs/deploy.md`.

| Nome                                               | Para quê                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| `APP_URL`, `APP_ENV`, `COOKIE_SECURE`, `LOG_LEVEL` | links de senha, formato do log, cookie de sessão                         |
| `SESSION_TTL_DAYS`                                 | validade da sessão (30)                                                  |
| `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`                | Web Push: chave pública e contato (públicos, em `vars`)                  |
| `VAPID_PRIVATE_KEY` (**secret**)                   | assina os envios de push; sem ela o push fica desligado e nada mais muda |

### Se algo der errado

- **Porta 8787 ou 5173 ocupada**: encerre o processo anterior (`lsof -i :8787`) ou rode `make dev-api`/`make dev-web` separados.
- **Erro de tipo em `Env` ou `D1Database`**: `make types`.
- **"no such table" ou dados estranhos no D1 local**: `make db-reset`.
- **`make test-e2e` usou um web antigo ou travou**: localmente ele reaproveita um Worker já de pé. Derrube quem está na porta (`lsof -nP -iTCP:8787 -sTCP:LISTEN`, mate o processo **e o pai dele**) e rode de novo; um `wrangler dev` órfão ressuscita o `workerd`.
- **Instalou dependências e algo não resolve**: `make clean && make install`.

## Cron e crédito anual

O Worker tem um Cron Trigger diário, `0 3 * * *` em UTC (00:00 em São Paulo), que faz duas coisas: apaga sessões e tokens de senha expirados e lança o **crédito anual de dias** de quem fez aniversário da data base do crédito (10 dias por ano, a partir do primeiro aniversário; configurável em Administração). É idempotente: rodar duas vezes não duplica, e pessoas reativadas recuperam os anos perdidos.

Para antecipar o crédito sem esperar o cron (por exemplo, depois de preencher uma data base), um administrador chama a API:

```bash
read -s -p "senha: " PW; echo
curl -s -c /tmp/nacif.jar -H 'content-type: application/json' \
  -d "{\"email\":\"voce@nacif.xyz\",\"password\":\"$PW\"}" \
  https://interno.nacif.software/api/auth/login >/dev/null
curl -s -b /tmp/nacif.jar -X POST https://interno.nacif.software/api/disponibilidade/balance/accrual/run
rm /tmp/nacif.jar; unset PW
```

A resposta é `{"created": N}`. Em desenvolvimento, troque a origem por `http://localhost:8787`.

## Notificações push

- A pessoa é convidada a ativar os avisos uma vez por navegador, logo após o login; depois liga ou desliga em **Notificações**, no menu do próprio nome. A escolha vale por dispositivo.
- O que chega, por papel: membro recebe decisão sobre suas comunicações, comunicação que voltou para análise e movimentações do saldo (crédito anual, crédito manual, venda). Aprovador recebe também nova comunicação endereçada a ele, período alterado e cancelamento pelo autor. Administrador recebe como aprovador quando é o endereçado.
- Funciona em Chrome, Edge, Firefox e Safari no computador, Chrome no Android e, no iPhone/iPad, só com o site adicionado à Tela de Início (iOS 16.4+).
- Em produção o push depende das variáveis VAPID; sem elas tudo funciona igual, só sem avisos. Detalhes em `docs/adr/0013-notificacoes-push-no-navegador.md` e `docs/deploy.md`.

## Qualidade

```bash
make test        # shared + web + api
make test-e2e    # Playwright contra o build de produção servido pelo Worker local
make lint && make typecheck && make vocab-check
```

No GitHub Actions, o job `quality` roda em todo PR e em todo push na `main`. O job `e2e` roda só em PRs para a `main`. Detalhes em `AGENTS.md`, seção 9.

## Publicação

O Workers Builds publica a `main` a cada merge (migrações do D1 antes do código). Nada é publicado à mão. Rollback de código com `wrangler rollback`; de dados com o Time Travel do D1. Tudo em `docs/deploy.md`.

## Documentação

- `AGENTS.md`: guia para pessoas e agentes (vocabulário, arquitetura, convenções).
- `docs/architecture.md`, `docs/data-model.md`, `docs/api.md`, `docs/design-spec.md`.
- `docs/deploy.md`: como o app é publicado na Cloudflare (Workers Builds), primeiro administrador, importação da planilha, rollback de código e de dados.
- `docs/adr/`: decisões. Trabalho futuro: [issues do GitHub](https://github.com/nacif-software/nacif-interno/issues).
