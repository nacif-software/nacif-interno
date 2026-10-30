# Deploy e operação

Como o Nacif Interno é publicado e operado na Cloudflare (ADR 0011). Este documento descreve o que o código espera da conta; criar os recursos é a issue #16. Comandos `wrangler` rodam de `apps/api` (`pnpm --filter @nacif/api exec wrangler ...`) e exigem `wrangler login` com uma conta que tenha acesso à conta da empresa.

## Visão geral

| Peça       | Valor                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Worker     | `nacif-interno`: API Hono em `/api/*` e o SPA do web pelos Static Assets (`apps/web/dist`)             |
| Banco      | D1 `nacif-interno` (migrações em `apps/api/drizzle/`)                                                  |
| Domínio    | `interno.nacif.software`, Custom Domain do Worker (`routes` no `wrangler.jsonc`, `workers_dev: false`) |
| Publicação | Workers Builds a partir da `main`; nenhuma publicação manual                                           |
| Cron       | `0 3 * * *` (UTC) limpa sessões e tokens expirados; só em produção                                     |
| Logs       | Workers Logs (`observability.enabled`) e `wrangler tail`                                               |
| Plano      | Workers Paid (necessário para o Email Service da #10 e para a retenção de 30 dias do D1)               |
| Ambientes  | Só produção. Não há staging. Previews por branch ficam para depois do Access (#7), ver "Previews"      |

A configuração do Worker vive em `apps/api/wrangler.jsonc` e é a fonte de verdade: o deploy sobrescreve o que estiver no painel (vars, cron, domínio). Mudou algo lá, rode `make types` e `make deploy-check`.

## Bindings, vars e secrets

| Nome               | Tipo | Produção (`wrangler.jsonc`)      | Dev (`apps/api/.dev.vars`) | Uso                                            |
| ------------------ | ---- | -------------------------------- | -------------------------- | ---------------------------------------------- |
| `DB`               | D1   | `nacif-interno` (`database_id`)  | D1 local                   | todo o acesso a dados (Drizzle)                |
| `APP_ENV`          | var  | `production`                     | `development`              | formato do log; `test` desliga o log de acesso |
| `APP_URL`          | var  | `https://interno.nacif.software` | `http://localhost:5173`    | links de definição de senha                    |
| `COOKIE_SECURE`    | var  | `true`                           | `false`                    | flag `Secure` do cookie de sessão              |
| `SESSION_TTL_DAYS` | var  | `30`                             | (padrão 30)                | validade da sessão                             |
| `LOG_LEVEL`        | var  | `info`                           | `debug`                    | nível do log                                   |

Não há secrets hoje. Quando entrarem (Email Service na #10, Access na #7), ficam fora do repositório: `wrangler secret put NOME` em produção e `.dev.vars` em dev, com os nomes listados em `secrets.required` no `wrangler.jsonc` para o `wrangler types` e o `wrangler dev` avisarem o que falta. O `database_id` do D1 não é segredo e fica no `wrangler.jsonc` (placeholder até a #16).

## Workers Builds

Configuração a aplicar no painel (Workers → `nacif-interno` → Settings → Build), ligada ao repositório `nacif-software/nacif-interno`:

| Campo                      | Valor                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Git branch (produção)      | `main`                                                                                                                               |
| Root directory             | `/` (raiz do repositório; o `wrangler.jsonc` fica em `apps/api`, e os comandos usam `pnpm --filter`)                                 |
| Build command              | `pnpm --filter @nacif/web build`                                                                                                     |
| Deploy command             | `pnpm --filter @nacif/api exec wrangler d1 migrations apply nacif-interno --remote && pnpm --filter @nacif/api exec wrangler deploy` |
| Preview builds             | **desligados** (ver "Previews")                                                                                                      |
| Build watch paths: include | `apps/*`, `packages/*`, `pnpm-lock.yaml`, `package.json`, `pnpm-workspace.yaml` (mudança só em `docs/` ou `.github/` não gera build) |
| Build variables            | nenhuma (nada do build chega ao runtime)                                                                                             |
| API token                  | token próprio, ver abaixo                                                                                                            |

Detalhes que importam:

- A instalação das dependências é automática antes do build command. O Builds usa o pnpm do campo `packageManager` do `package.json` da raiz (hoje `pnpm@10.33.0`) e o Node do `.nvmrc` (hoje 22). Mudar essas versões no repositório muda o build.
- O deploy command aplica as migrações **antes** de publicar o código. Em modo não interativo o wrangler não pede confirmação e faz um backup (bookmark) antes de aplicar. Se uma migração falhar, ela é revertida, as anteriores ficam e o deploy não acontece.
- O token gerado automaticamente pelo Builds **não tem permissão de D1**, então as migrações falhariam. Crie um token de usuário (My Profile → API Tokens) com: Account Settings (read), Workers Scripts (edit), **D1 (edit)**, Workers Routes (edit, para o Custom Domain), User Details (read), Memberships (read); selecione esse token no campo "API token" e use sempre o mesmo.
- Limites no Paid: 6.000 minutos de build por mês, 6 builds simultâneos, 20 minutos por build. Um build deste repositório leva poucos minutos.
- `.github/workflows/ci.yml` continua sendo a validação: o Builds não roda testes. Nada entra na `main` sem o CI verde (AGENTS.md §9), então o Builds só publica código testado.

## Como uma publicação acontece

1. PR aprovado com `quality` e `e2e` verdes → squash and merge na `main`.
2. O Builds detecta o push, instala, builda o web, aplica migrações pendentes no D1 e publica o Worker com os assets novos. Acompanhe em Workers → `nacif-interno` → Deployments (ou `wrangler deployments list`).
3. Confira: `curl -s https://interno.nacif.software/api/health` → `{"status":"ok","db":"ok"}`; abra o app e faça login.
4. Problema? Veja "Rollback". Logs ao vivo: `wrangler tail`; histórico: Workers Logs no painel (retenção de 7 dias).

**Regra para migrações.** Como a migração roda antes do código novo e **não é desfeita** num rollback, toda migração tem que ser compatível com o código que está em produção: adicionar tabela, coluna com default ou índice é seguro; remover ou renomear coluna só num PR posterior, depois que nenhum código em produção a usa. O template de PR lembra disso.

## Domínio e a zona `nacif.software`

A zona `nacif.software` hospeda o site da empresa na raiz e em `www`. O app usa só o hostname `interno`:

- O primeiro `wrangler deploy` (issue #16) cria o Custom Domain: um registro DNS `interno` apontando para o Worker e um certificado para `interno.nacif.software`. Nada mais na zona é alterado.
- Antes desse deploy, confira no painel (DNS da zona) que **não existe** registro `interno` (um CNAME existente faz o deploy falhar; qualquer outro registro deve ser removido conscientemente). Confira depois que a raiz e `www` continuam respondendo o site da empresa.
- Nunca use rota com curinga (`*.nacif.software`, `nacif.software/*`) nem `workers_dev: true`: o Worker só deve existir em `interno`.
- Para remover: apague o domínio em Workers → `nacif-interno` → Domains & Routes e o certificado em SSL/TLS → Edge Certificates (ele não é apagado sozinho).

## Primeiro administrador

Produção não tem seed. Depois do primeiro deploy, crie quem vai administrar:

```bash
make create-admin email=nome@nacif.xyz          # D1 remoto (produção)
make create-admin email=nome@nacif.xyz db=local # D1 local, para testar o fluxo
```

O script (`apps/api/scripts/create-admin.ts`) cria a pessoa com papel ADMIN (ou promove a existente, mantendo o nome), invalida links anteriores e imprime um link `APP_URL/definir-senha/<token>` válido por 7 dias. O link abre a tela "Definir senha": pede nome e senha para quem é novo, só senha para quem já tinha. Se a pessoa já tinha senha, a atual continua valendo até o link ser usado. Rodar de novo com o mesmo e-mail gera um link novo; serve também para recuperar o acesso de um administrador. Só e-mails `@nacif.xyz` são aceitos. O token nunca é gravado: o banco guarda o hash SHA-256.

A partir daí, convites e redefinições são feitos pela Administração no próprio app.

## Rollback

### Código

```bash
wrangler rollback                       # volta para a versão anterior (pede confirmação)
wrangler rollback <version-id> -m "motivo"   # volta para uma versão específica
wrangler versions list                  # ids das versões
```

O rollback troca o código e os assets; **não** desfaz migrações nem dados. Por isso a regra de migrações compatíveis acima. Depois de um rollback, o próximo push na `main` volta a publicar a versão mais nova.

### Dados (D1 Time Travel)

O D1 guarda o histórico do banco por 30 dias (Paid). Para voltar o banco a um instante:

```bash
wrangler d1 time-travel info nacif-interno                        # bookmark atual: guarde-o antes de qualquer restore
wrangler d1 time-travel info nacif-interno --timestamp=2026-11-05T13:00:00Z
wrangler d1 time-travel restore nacif-interno --timestamp=2026-11-05T13:00:00Z
wrangler d1 time-travel restore nacif-interno --bookmark=<bookmark>
```

O restore é **destrutivo**: sobrescreve o banco no lugar e cancela queries em andamento. A saída do `restore` imprime o bookmark de antes da operação; restaurar para ele desfaz o restore. Combine com o código: se o restore volta o schema para antes de uma migração, faça antes o rollback do código para uma versão compatível, ou o app vai quebrar. Só as migrações do deploy e o `create-admin` escrevem no banco remoto; `make seed` recusa `--remote`.

## Cron, logs e custos

- **Cron**: `0 3 * * *` chama `scheduled()` em `apps/api/src/worker.ts` (`maintenanceService.purgeExpired`). Para testar local: `wrangler dev --test-scheduled` e `curl "localhost:8787/__scheduled?cron=0+3+*+*+*"`.
- **Logs**: JSON por requisição (`infra/http/request-logger.ts`) e erros com stack. `wrangler tail` ao vivo; Workers Logs no painel com filtros, 7 dias de retenção, 20 milhões de eventos por mês inclusos.
- **Custos** (preços de 2026-10): Workers Paid US$ 5/mês inclui 10 milhões de requisições e 30 milhões de CPU-ms; D1 inclui 25 bilhões de linhas lidas, 50 milhões escritas e 5 GB; Builds inclui 6.000 minutos. Para o volume do time, tudo cabe no valor fixo. Uso em Workers & Pages → Usage e em Billing.

## Previews

Workers Previews publicam uma cópia do Worker por branch (`<branch>-nacif-interno.<conta>.workers.dev`) com `vars` e D1 próprios (bloco `previews` no `wrangler.jsonc`). Decidimos **não ligar** por enquanto: a URL é pública até o Access (#7) proteger o Worker, e o CI com e2e já valida cada PR. Na #16, deixe "Preview builds" desligado. Ligar depois é uma issue pequena: bloco `previews` com `vars` e D1 `nacif-interno-preview` (`preview_database_id` + `wrangler d1 migrations apply nacif-interno --preview`), token com acesso ao banco de preview, Access na frente das URLs.

## Checklist da issue #16

1. Workers Paid ativo na conta.
2. `wrangler d1 create nacif-interno` → copiar o `database_id` para o `wrangler.jsonc` (PR).
3. Conferir a zona (`interno` livre; raiz e `www` intocados).
4. Token de API para o Builds com D1 (edit).
5. Conectar o repositório no Builds com a configuração acima; preview builds desligados.
6. Merge na `main` → primeiro build → `api/health` ok, domínio ativo, site da empresa intacto.
7. `make create-admin email=...` e primeiro login.
