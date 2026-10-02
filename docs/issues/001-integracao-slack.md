# Integração com canal no Slack

**Labels**: enhancement, integração

## Contexto

Hoje as notificações de envio e decisão existem só como toasts. O time acompanha o dia a dia no Slack.

## Proposta

Postar em um canal configurável (webhook ou app do Slack) quando: uma comunicação é enviada (para o aprovador), aprovada/recusada (para o autor) e cancelada. Mensagem com pessoa, período, dias úteis e link para o detalhe. Implementar como `notifications` no core com um `NotificationChannel` (Slack, e-mail depois).

## Critérios de aceite

- [ ] Webhook/token configurável por variável de ambiente, desligado por padrão.
- [ ] Evento de envio, decisão e cancelamento publicados com o vocabulário do produto.
- [ ] Falha no Slack não bloqueia a operação (log + retry simples).
- [ ] Testes de integração com o canal mockado.
