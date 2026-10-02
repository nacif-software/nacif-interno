# Login com a conta corporativa (Google Workspace)

**Labels**: enhancement, auth

**Status da revisão**: revisada em 2026-10-02.

## Contexto

O design prevê um botão único "Entrar com e-mail Nacif". Hoje o login é por e-mail e senha, atrás da interface `AuthProvider` (ADR 0004), pensada para trocar o mecanismo sem mexer em sessão nem em permissões.

## Primeiro passo: investigação

Antes de implementar, confirmar e registrar na própria issue:

- A Nacif usa Google Workspace no domínio `nacif.xyz`? Se o e-mail corporativo for de outro provedor, o alvo desta issue muda para o provedor correto.
- Quem administra o Workspace e pode criar as credenciais OAuth.
- Se todas as pessoas do time, incluindo prestadores, têm conta nesse domínio.

A implementação só começa depois dessa resposta.

## Proposta

Implementar um novo `AuthProvider` para login com a conta corporativa: fluxo authorization code, validação de que a conta pertence ao domínio `nacif.xyz` e criação da sessão como hoje.

## Decisões

- **Convite continua sendo a única porta de entrada.** Quem entra com a conta corporativa sem ter sido convidado por um administrador é barrado, com mensagem orientando a procurar um administrador. Não há cadastro automático.
- **Login por senha continua existindo**, como contingência para administradores, caso o provedor externo fique indisponível.
- Sessões, papéis e guards não mudam.

## Fora do escopo

- Provisionamento automático de pessoas a partir do diretório do Workspace.
- Login por outros provedores.

## Critérios de aceite

- [ ] Resultado da investigação registrado na issue.
- [ ] Credenciais e URL de retorno configuráveis por variável de ambiente; sem elas, o botão de login corporativo não aparece.
- [ ] Pessoa convidada e ativa entra com a conta corporativa e cai no portal.
- [ ] Conta de outro domínio vê o erro de domínio não autorizado, como na tela 01b do design.
- [ ] Conta do domínio que não foi convidada é barrada com mensagem clara.
- [ ] Pessoa inativa é barrada.
- [ ] Administrador consegue entrar por senha quando o login corporativo está desligado.
- [ ] Testes de integração com o provedor simulado.
- [ ] ADR 0004 atualizado.
