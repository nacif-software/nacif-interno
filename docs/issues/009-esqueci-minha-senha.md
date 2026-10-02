# "Esqueci minha senha" na tela de login

**Labels**: enhancement, auth

**Status da revisão**: rascunho, ainda não revisada.

**Depende de**: issue 005 (e-mail) e issue 008 (link de redefinição).

## Contexto

Com a issue 008, o administrador consegue gerar um link de redefinição. Com a 005, esse link chega por e-mail. Falta a pessoa conseguir pedir isso sozinha, sem procurar um administrador.

## Proposta

Link "Esqueci minha senha" na tela de login. A pessoa informa o e-mail e, se ele pertencer a uma conta ativa do domínio, recebe o link de redefinição por e-mail. A tela responde sempre da mesma forma, exista a conta ou não, para não revelar quais e-mails estão cadastrados.

## Pontos a decidir na revisão

- Limite de pedidos por e-mail e por hora.
- Se a conta inativa recebe alguma resposta diferente.

## Critérios de aceite

- [ ] A definir na revisão.
