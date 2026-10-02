# Push notifications

**Labels**: enhancement, integração

**Status da revisão**: rascunho, ainda não revisada.

## Contexto

As notificações previstas hoje são o canal do Slack para aprovadores (issue 001) e e-mail (issue 005). Falta um canal que alcance a pessoa no navegador ou no celular sem depender de Slack ou e-mail.

## Proposta (a detalhar na revisão)

Notificações push do navegador (Web Push) para os eventos do fluxo: comunicação enviada, para o aprovador; decisão registrada, para o autor.

## Pontos em aberto

- Web Push no navegador é suficiente, ou há plano de app móvel?
- Quais eventos notificam e para quem.
- Onde a pessoa liga e desliga as notificações.
- Reaproveitar a interface `NotificationChannel` criada na issue 001.

## Critérios de aceite

- [ ] A definir na revisão.
