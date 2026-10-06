# Push notifications e preferências de notificação

**Labels**: enhancement, integração

**Status da revisão**: revisada em 2026-10-06.

**Depende de**: issue 005 (e-mail) para a preferência de e-mail ter efeito. Pode ser desenvolvida antes, com o e-mail como canal ainda inexistente.

## Contexto

As notificações previstas são o canal do Slack para aprovadores (issue 001) e e-mail (issue 005). Falta um canal que alcance a pessoa na hora, no navegador, e um lugar onde cada pessoa escolha por onde quer ser avisada.

## Proposta

Duas partes, na mesma issue.

### Menu "Notificações"

Um item **Notificações** no menu do usuário, que abre uma tela com uma chave liga/desliga por canal:

| Canal  | Padrão    | Observação                                                                                                                  |
| ------ | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| E-mail | ligado    | Depende da issue 005.                                                                                                       |
| Slack  | ligado    | Aparece quando houver aviso do Slack por pessoa. O aviso da issue 001 é por canal, não por pessoa, e não é controlado aqui. |
| Push   | desligado | Só no navegador; ver limitações abaixo.                                                                                     |

A tela explica em texto simples o que cada canal faz e as limitações do push.

### Push no navegador (Web Push)

Eventos: nova comunicação para o aprovador e decisão para o autor, os mesmos do e-mail.

A pessoa é convidada a ativar o push **ao menos uma vez**, em uma mensagem no próprio sistema depois do login. A mensagem diz com clareza que ela pode escolher por onde receber os avisos no menu Notificações. Se recusar ou fechar, a pergunta não volta; a opção continua no menu.

## Decisões

- Só navegador nesta versão. Sem app.
- Na tela de Notificações fica explícito: no computador funciona em Chrome, Edge e Firefox; no Android com Chrome também; no iPhone e iPad só funciona se o site for adicionado à tela inicial, e depende da versão do iOS. Essa limitação deve ser confirmada e atualizada na implementação.
- A permissão do push é por dispositivo e navegador. A chave na tela reflete o dispositivo atual.
- E-mail e Slack ligados por padrão; push desligado até a pessoa ativar.

## Fora do escopo

- App móvel.
- Preferências por tipo de evento. É liga/desliga por canal.
- Notificar cancelamento ou edição de período.

## Notas de implementação

- Web Push padrão: service worker, chaves VAPID em variáveis de ambiente, tabela de inscrições por pessoa e dispositivo. Mudança de schema: usar plan mode.
- Novo canal no `NotificationChannel` da issue 001. Inscrição inválida ou expirada é removida ao falhar.
- Preferências guardadas por pessoa, na tabela de usuários ou em tabela própria, e respeitadas por todos os canais.
- Copy no `packages/shared/src/labels/pt-br.ts`, sem emojis.

## Critérios de aceite

- [ ] Menu Notificações com as chaves por canal, texto explicativo e limitações do push.
- [ ] A pessoa vê a pergunta de ativar o push uma vez após o login, com o guia para o menu Notificações; recusar ou fechar não repete a pergunta.
- [ ] Com o push ativo, aprovador recebe aviso de nova comunicação e autor recebe aviso de decisão, com link para o detalhe.
- [ ] Desligar um canal interrompe os avisos daquele canal; os outros seguem.
- [ ] Inscrição expirada não gera erro visível nem bloqueia a operação.
- [ ] Testes de integração dos canais e das preferências; teste de tela do menu e da pergunta única.
