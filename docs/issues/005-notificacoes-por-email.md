# Notificações por e-mail

**Labels**: enhancement, integração

**Status da revisão**: revisada em 2026-10-02.

## Contexto

Hoje o convite e o link de redefinição de senha precisam ser copiados pelo administrador e entregues à mão. E o autor de uma comunicação não é avisado por nenhum canal quando ela é aprovada ou recusada. O aviso ao aprovador fica coberto pelo canal do Slack (issue 001).

## Proposta

Enviar três e-mails:

| E-mail               | Para      | Quando                                                              |
| -------------------- | --------- | ------------------------------------------------------------------- |
| Convite              | convidado | administrador cria o convite ou gera um novo link                   |
| Redefinição de senha | pessoa    | administrador gera o link de redefinição (issue 008)                |
| Decisão              | autor     | comunicação aprovada ou recusada, com a justificativa quando houver |

## Decisões

- **Provedor: Resend**, pela API, no pacote gratuito. Evita montar e manter um SMTP próprio. O limite gratuito deve cobrir o volume da Nacif; o número exato de envios por mês e por dia deve ser confirmado na conta no momento da implementação.
- O envio fica atrás de uma interface própria (`EmailSender`), implementada pelo `NotificationChannel` da issue 001. Trocar de provedor depois não muda as regras.
- Sem a chave da API configurada, nada é enviado: o sistema registra o e-mail no log e o link continua visível ao administrador, como hoje. É assim que funciona em desenvolvimento e nos testes.
- Falha no envio não bloqueia a operação: registra um aviso e segue.

## Fora do escopo

- "Esqueci minha senha" pela tela de login (issue 009).
- Aviso ao aprovador por e-mail (coberto pelo Slack na issue 001).
- Aviso de cancelamento ou de edição de período.
- Preferências de notificação por pessoa.

## Dependências

- Domínio de envio verificado no Resend, com os registros DNS de `nacif.xyz`. Quem administra o DNS precisa fazer essa etapa. Enquanto isso, o Resend permite testar só para o próprio e-mail da conta.

## Notas de implementação

- Variáveis `RESEND_API_KEY` e `EMAIL_FROM`. Sem elas, modo de log.
- Templates em texto simples e HTML mínimo, com o vocabulário do `AGENTS.md` e sem emojis, centralizados em um só lugar.
- Os links usam `APP_URL`.

## Critérios de aceite

- [ ] Convite e link de redefinição chegam por e-mail, e o link continua visível ao administrador na tela.
- [ ] Autor recebe e-mail ao ter a comunicação aprovada ou recusada, com a justificativa na recusa e link para o detalhe.
- [ ] Sem a chave configurada, nenhum envio é tentado e o conteúdo aparece no log.
- [ ] Falha do provedor não impede convite, redefinição nem decisão.
- [ ] Testes de integração com o provedor simulado cobrindo os três e-mails, o modo de log e a falha.
- [ ] `.env.example` e `docs/architecture.md` documentam as variáveis e o modo de log.
