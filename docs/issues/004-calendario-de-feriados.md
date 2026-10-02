# Calendário de feriados no cálculo de dias úteis

**Labels**: enhancement, regra de negócio

## Contexto

`countBusinessDays` exclui só sábado e domingo (ADR 0009).

## Proposta

Tabela `holidays` (data, nome, escopo nacional/local) administrada na tela 07; `countBusinessDays` recebe a lista de feriados; formulário e calendário pintam feriados como não úteis.

## Critérios de aceite

- [ ] CRUD de feriados para administradores.
- [ ] Contagem no formulário, no service e no calendário consistente.
- [ ] Testes unitários com feriados em dia de semana.
