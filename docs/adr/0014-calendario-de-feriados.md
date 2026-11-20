# ADR 0014 — Calendário de feriados no cálculo de dias úteis

**Status**: aceito (2026-11-20)

## Contexto

O ADR 0009 definiu dia útil como segunda a sexta e deixou feriados para a issue #8. A política de descanso remunerado diz que feriados oficiais e o recesso do calendário Nacif não debitam do saldo, e a Nacif publica esse calendário todo ano (canvas da política no Slack). Sem feriados, um período com Natal ou Carnaval descontava um dia a mais, e o aprovador corrigia à mão com o ajuste de dias descontados.

## Decisão

- **Um calendário único da Nacif**, na tabela `holidays` (`date` único, `name`). Vale para todo o time. Não há escopo nacional/local, cálculo automático de feriados nem feriado por pessoa ou cidade, ao contrário do que a issue #8 propunha: a fonte é o calendário que a Nacif publica, que inclui recesso e datas que não são feriado nacional (Carnaval, Corpus Christi, "Descanso Nacif").
- **Carga inicial na migração** `0005_holidays`: os calendários de 2025 e 2026 do canvas e 01/01/2027. O administrador adiciona e remove na Administração (renomear é remover e adicionar). `GET /holidays` (autenticado), `POST /holidays` e `DELETE /holidays/:id` (ADMIN); data repetida devolve 409 `CONFLICT`.
- **`countBusinessDays(start, end, holidays)`** no shared recebe o conjunto de datas (padrão vazio, para o histórico importado e o seed). A API carrega o conjunto ao criar e editar comunicações; o zod continua vendo só o fim de semana, então o período sem dia útil por causa de feriado é barrado no service. O formulário conta com o mesmo conjunto e avisa quando o período toca um ano sem nenhum feriado cadastrado.
- **Recontagem das comunicações que ainda não começaram** (em análise ou aprovadas, início depois de hoje), ao mudar o calendário e no cron diário. Em aprovadas, os dias descontados acompanham só quando não foram ajustados pelo aprovador. Cada recontagem grava um evento `EDITED` sem ator (`metadata.recount`), sem valor novo no CHECK de `flow_events.type`. Diverge da issue #8 ("não recalcula"): sem isso, o primeiro deploy deixaria aprovadas futuras sobre 25/12 e 31/12 descontando um dia a mais.
- **Calendário do time** marca o feriado no dia (`days[].holiday` com o nome).

## Consequências

- Comunicações já iniciadas nunca mudam; o histórico importado segue com os dias da planilha.
- O calendário de cada ano novo precisa ser cadastrado. Até lá, o formulário avisa que a contagem pode mudar, e a recontagem corrige as futuras quando o calendário entrar.
- O ADR 0009 fica substituído na parte "dias úteis sem feriados".
