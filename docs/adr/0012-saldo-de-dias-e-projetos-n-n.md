# ADR 0012 — Saldo de dias, projetos N:N e migração da planilha

**Status**: aceito (2026-11-09); importação concluída em produção (2026-11-15)

## Contexto

Com o sistema no ar (`interno.nacif.software`, ADR 0011) cobrindo o fluxo comunicar → aprovar, a empresa ainda controlava os dias de cada pessoa numa planilha (Google Sheets, seis abas: pessoas, configuração, aquisições, vendas, solicitações e saldo). A planilha fazia o que o sistema não fazia:

- Concedia **10 dias por ano** a cada pessoa, no aniversário de uma data de início, e registrava créditos manuais com nota (uma concessão retroativa em 22/08/2025 de 15, 10 ou 20 dias, conforme o tempo de casa).
- Registrava **vendas de dias** (débito com data).
- Guardava as **solicitações** com aprovador, dias e status (`Approved`, `Pending`, `Denied`, `Cancelled`); só as aprovadas debitavam, e os dias eram ajustados à mão quando convinha (fim de semana no meio, troca de feriado = 0).
- Calculava o **saldo** = aquisições − vendas − dias das aprovadas, que podia ficar negativo.

O objetivo da épica #29 (issues #30 a #34) foi trazer isso para o sistema com o histórico completo e aposentar a planilha. Dois pontos do modelo original atrapalhavam: a pessoa tinha **um** projeto (FK em `users`) quando na prática participa de vários, e a comunicação escolhia um projeto no formulário.

## Decisão

Decisões do responsável pelo produto, tomadas em 2026-11-09:

1. **Saldo de dias** é derivado, nunca armazenado: `Σ créditos (ACCRUAL + GRANT) − Σ vendas (SALE) − Σ dias descontados das comunicações aprovadas`. Lançamentos ficam em `availability_ledger_entries`; o débito das aprovadas vem de `communications.deducted_days` (nulo = `business_days`). O undo de uma aprovação em lote corrige o saldo sozinho, porque o débito deriva do status.
2. **Crédito anual de 10 dias para todos** (`availability_settings.days_per_year`, configurável), no aniversário da **data base do crédito** (`users.credit_base_date`), a partir do primeiro aniversário. Sem data base, sem crédito automático. Os 15/10/20 de 2025 foram uma concessão única e viraram créditos manuais com a nota original. As oito pessoas antigas ficam com data base 22/08/2025.
3. O crédito anual roda no **Cron Trigger** diário (`0 3 * * *` UTC = 00:00 em São Paulo), idempotente por índice único parcial `(user_id, type, reference_year)` para `ACCRUAL`, com catch-up de anos perdidos (reativar uma pessoa recupera os aniversários passados). Também roda ao salvar a data base e em `POST /balance/accrual/run` (admin).
4. O **aprovador pode ajustar os dias descontados** ao aprovar, com motivo obrigatório; o ajuste fica no fluxo da comunicação. Aprovação em lote sempre usa os dias úteis.
5. **Saldo negativo é permitido** com aviso não bloqueante (membro ao preencher, aprovador na fila e no detalhe).
6. **Venda de dias e crédito manual só por administrador** (Administração → Saldos de dias, nota obrigatória). Para o aprovador, a UI diz que vendas são registradas por um administrador.
7. **Pessoa ↔ projetos é N:N** (`user_projects`). A comunicação deixa de escolher projeto e vale para todos os projetos da pessoa; conflito e limite de simultâneos olham cada projeto em comum. `communications.project_id` e `users.project_id` ficam obsoletos e saem numa migração posterior; `cover_id` passa a ser nulo só no histórico importado.
8. **Aprovadores padrão globais** (Ricardo e Lucca Mordente); nenhum projeto com aprovador próprio por enquanto.
9. **Histórico completo importado** por `make import-sheet` a partir de um JSON gerado fora do repositório (dados pessoais nunca entram no git), idempotente por ids determinísticos `sheet-…`, com verificação automática do saldo de cada pessoa contra a aba Saldo. Pessoas que saíram entram inativas com histórico; quem nunca usou o controle não entra.
10. **Vocabulário**: o termo é "saldo de dias"; "dias comunicados no ano" continua como contador informativo (texto de apoio do card). As telas novas foram propostas no PR e registradas na seção 08 do `docs/design-spec.md`, exceção aprovada à regra de não editar o spec.

## Consequências

- Duas migrações compatíveis com o código em produção (`0001_balance_and_user_projects`, só adições; `0002_communications_nullable_refs`, recria `communications` com `PRAGMA defer_foreign_keys`). A remoção de `users.project_id` e `communications.project_id` fica para um PR futuro, depois que nada em produção ler as colunas.
- O conflito usa a associação **atual** da pessoa aos projetos; não é retroativo ao histórico.
- Mudar `days_per_year` não reescreve créditos passados.
- Inserts do cron em pedaços de 10 linhas (`batchAll`) por causa do limite de parâmetros do D1.
- O script de importação é o segundo comando que escreve no D1 remoto (além do `create-admin`); o procedimento e o bookmark do Time Travel estão em `docs/deploy.md`.
- Corte: a planilha vira somente leitura com aviso apontando para o sistema, e cada pessoa ativa recebe o link de definição de senha gerado na Administração.

## Atualização (2026-11-15)

Importação executada em produção: 5 projetos, 18 pessoas (14 ativas), 20 lançamentos, 22 comunicações; os 12 saldos conferiram com a planilha. Três pessoas entraram sem data base (crédito automático só quando um administrador preencher). Bookmark do Time Travel anterior à importação guardado fora do repositório.
