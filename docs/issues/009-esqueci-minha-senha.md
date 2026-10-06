# "Esqueci minha senha" na tela de login

**Labels**: enhancement, auth

**Status da revisão**: revisada em 2026-10-06.

**Depende de**: issue 005 (e-mail) e issue 008 (link de redefinição).

## Contexto

Com a issue 008, o administrador consegue gerar um link de redefinição. Com a 005, esse link chega por e-mail. Falta a pessoa conseguir pedir isso sozinha, sem procurar um administrador.

## Proposta

Link "Esqueci minha senha" na tela de login. A pessoa informa o e-mail e, se ele pertencer a uma conta ativa do domínio, recebe o link de redefinição por e-mail. A tela responde sempre da mesma forma, exista a conta ou não, para não revelar quais e-mails estão cadastrados.

## Decisões

- Limite de pedidos: no máximo 3 por e-mail a cada hora. Acima disso, a tela responde igual, sem enviar nada.
- Conta inativa ou inexistente recebe a mesma resposta da tela e nenhum e-mail. Só a conta ativa do domínio recebe o link.
- O link é o mesmo da issue 008, com a mesma validade e uso único.

## Critérios de aceite

- [ ] Pessoa com conta ativa pede o link na tela de login e recebe por e-mail.
- [ ] Conta inexistente, inativa ou de outro domínio vê a mesma mensagem e não recebe e-mail.
- [ ] Acima do limite por hora, nenhum e-mail é enviado e a tela não muda.
- [ ] Testes de integração dos três casos e do limite; teste de tela.
