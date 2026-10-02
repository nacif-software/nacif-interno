# Notificar aprovadores no Slack quando uma comunicação é enviada

**Labels**: enhancement, integração

**Status da revisão**: revisada em 2026-10-02.

## Contexto

Hoje o aprovador só descobre que há uma comunicação de indisponibilidade em análise ao abrir a fila de aprovação. O time acompanha o dia a dia no Slack.

## Proposta

Quando uma comunicação é enviada, postar uma mensagem em **um canal específico do Slack**, restrito a administradores e aprovadores. A mensagem traz os dados básicos e um link direto para a tela de análise daquela comunicação. Toda a decisão continua acontecendo na plataforma.

Conteúdo da mensagem:

- quem enviou e o projeto;
- período e dias úteis;
- quem cobre as entregas;
- aprovador escolhido;
- aviso de conflito, quando houver;
- link para `/disponibilidade/comunicacoes/<código>`, onde o aprovador vê os detalhes e os botões de aprovar e recusar. Quem não estiver logado cai no login e volta para a mesma tela.

Exemplo:

> Nova comunicação de indisponibilidade em análise
> Pedro Nakano · projeto Órion · 12 – 16 out 2026 · 5 dias úteis
> Cobertura: Marina Duarte · Aprovador: Caio Bertelli
> Abrir para análise: https://…/disponibilidade/comunicacoes/2026-0183

## Decisões

- Um único canal, configurado por ambiente. Sem mensagem direta por pessoa.
- Incoming Webhook do Slack. Não é necessário criar um app com permissões além do webhook.
- Só o evento de envio gera mensagem.

## Fora do escopo

- Aprovar ou recusar pelo Slack, botões ou qualquer interatividade.
- Mensagem direta para o aprovador ou para o autor.
- Notificar decisão, cancelamento ou edição de período.
- Outros canais de notificação. E-mail está na issue 005 e push notification na 006.

## Notas de implementação

- Variável `SLACK_APPROVALS_WEBHOOK_URL`. Sem valor, a integração fica desligada. O link usa `APP_URL`.
- Interface `NotificationChannel` no módulo `core`, com a implementação do Slack. As issues 005 e 006 reutilizam a mesma interface.
- O envio acontece depois do commit da transação em `communications.service.create`, com timeout curto.
- Falha no Slack não bloqueia nem desfaz o envio da comunicação: registra um aviso no log e segue.
- O texto segue o vocabulário do `AGENTS.md` e não usa emojis.

## Critérios de aceite

- [ ] Com o webhook configurado, enviar uma comunicação gera uma mensagem no canal com os dados acima.
- [ ] O link abre a tela da comunicação, com as ações de aprovar e recusar para quem pode decidir.
- [ ] Sem o webhook configurado, nada é enviado e nenhum erro aparece.
- [ ] Com o Slack fora do ar ou respondendo erro, a comunicação é criada normalmente e o log registra a falha.
- [ ] Testes de integração com o webhook simulado cobrindo sucesso, integração desligada e falha.
- [ ] `.env.example` e `docs/architecture.md` documentam a variável e o comportamento.
