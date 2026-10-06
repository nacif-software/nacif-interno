# Calendário do time na tela de análise da comunicação

**Labels**: enhancement, UI

**Status da revisão**: revisada em 2026-10-06.

## Contexto

Quem analisa uma comunicação de indisponibilidade precisa saber quem mais do time estará fora no mesmo período. Hoje a tela da comunicação mostra apenas o fluxo e uma linha de texto com os conflitos; para ver o quadro completo, o aprovador precisa sair para o Calendário do time e voltar.

## Proposta

Mostrar o calendário do time dentro da tela da comunicação, reaproveitando o componente e a consulta que já existem na tela Calendário do time, sem criar um segundo calendário.

- Posição: abaixo dos dados da comunicação e do fluxo, ocupando a largura toda, porque a grade precisa de espaço.
- Mês inicial: o mês em que a comunicação começa, com as setas de mês para períodos que cruzam o mês.
- Filtro inicial: o projeto da comunicação, com o mesmo seletor de projeto da tela do calendário para ver o time inteiro.
- A comunicação em análise aparece destacada na grade, para o aprovador distinguir o que está decidindo do que já existe.
- No celular, a grade rola na horizontal, como já acontece na tela do calendário.

## Decisões

- O calendário aparece para todo mundo que abre a tela, incluindo o autor. Também ajuda o autor a entender um conflito.
- A comunicação em análise ganha borda mais forte e o rótulo "Esta comunicação" na barra.

## Fora do escopo

- Qualquer mudança nas regras de aprovação ou no cálculo de conflitos.
- Mudanças na tela Calendário do time.

## Notas de implementação

- Reutilizar `CalendarGrid` e `useCalendar` (`apps/web/src/modules/disponibilidade`). O `CalendarGrid` ganha uma propriedade opcional para destacar uma comunicação pelo id.
- Mês e projeto ficam em estado local da tela, não na URL, para não poluir o link da comunicação.
- Nenhuma mudança na API: a consulta de calendário por mês e projeto já atende.
- Teste de tela: calendário presente com o mês e o projeto corretos e a barra destacada; e2e cobrindo a tela de análise com o calendário.

## Critérios de aceite

- [ ] Ao abrir uma comunicação, o calendário do time aparece abaixo, já no mês de início e filtrado pelo projeto dela.
- [ ] A comunicação em análise está destacada na grade; as demais seguem o visual atual.
- [ ] As setas de mês e o seletor de projeto funcionam como na tela Calendário do time.
- [ ] Aprovar e recusar continuam funcionando na mesma tela, sem recarregar.
- [ ] No celular, a grade rola na horizontal e os botões de decisão continuam acessíveis.
- [ ] Testes de tela e e2e verdes.
