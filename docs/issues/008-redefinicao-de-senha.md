# Redefinição de senha pelo administrador

**Labels**: enhancement, auth

**Status da revisão**: rascunho, ainda não revisada.

## Contexto

Hoje não existe caminho para quem esqueceu a senha. O administrador só consegue gerar link de definição de senha para convite pendente: para quem já definiu a senha, a API recusa. Também não há "esqueci minha senha" na tela de login nem troca da própria senha por quem está logado. Na prática, uma pessoa que esquece a senha fica sem acesso.

## Proposta

Na tela de Administração, uma ação "Redefinir senha" em cada pessoa ativa. Ela gera um link de uso único, igual ao do convite, que o administrador entrega à pessoa. Ao definir a nova senha, as sessões antigas dela são encerradas.

O mecanismo de link com token já existe para o convite (`password_setup_tokens`), então a mudança é pequena.

## Pontos a decidir na revisão

- A senha antiga continua valendo até a pessoa usar o link, ou é invalidada na hora em que o administrador gera o link?
- Incluir aqui a troca da própria senha por quem está logado, ou deixar para outra issue?
- "Esqueci minha senha" pela tela de login depende de envio de e-mail (issue 005). Fica fora desta.

## Critérios de aceite

- [ ] Administrador gera o link de redefinição para uma pessoa ativa que já tem senha.
- [ ] O link vale por tempo limitado e só pode ser usado uma vez.
- [ ] Depois da redefinição, a senha antiga não funciona e as sessões anteriores são encerradas.
- [ ] Quem não é administrador não consegue gerar o link.
- [ ] A ação fica registrada em log.
- [ ] Testes de integração e de tela.
