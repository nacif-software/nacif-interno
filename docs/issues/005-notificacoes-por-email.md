# Notificações por e-mail (convite e decisões)

**Labels**: enhancement, integração

## Contexto

O convite gera um link que o administrador precisa copiar; decisões não notificam o autor por e-mail.

## Proposta

Provedor de e-mail configurável (SMTP ou API) com templates para convite, envio ao aprovador, decisão ao autor e cancelamento. Reutiliza a interface `NotificationChannel` criada na issue 001. Push notification fica na issue 006.

## Critérios de aceite

- [ ] Convite enviado automaticamente, com o link ainda visível ao admin.
- [ ] Templates com o vocabulário do produto, sem emojis.
- [ ] Testes com provedor mockado.
