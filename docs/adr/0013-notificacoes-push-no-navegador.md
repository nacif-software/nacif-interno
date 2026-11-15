# ADR 0013 — Notificações push no navegador (Web Push)

**Status**: aceito (2026-11-15)

## Contexto

Depois da épica do saldo de dias (ADR 0012) o sistema passou a ser o único controle, mas ninguém era avisado de nada: o aprovador descobria comunicações novas abrindo a fila e o autor descobria a decisão abrindo o detalhe. E-mail (#10) e Slack (#4) ficaram para depois; o responsável decidiu começar pelo canal que chega na hora e não depende de provedor externo: **push no navegador**, como a issue #11 propunha.

## Decisão

- **Web Push padrão** (RFC 8030/8291/8292): VAPID e payload cifrado em aes128gcm, enviado **pelo próprio Worker** ao serviço de push do navegador, com `@block65/webcrypto-web-push` (só Web Crypto, sem dependências, devolve o `RequestInit` para `fetch`). Sem serviço intermediário.
- **Assinaturas por pessoa e dispositivo** na tabela `push_subscriptions` (endpoint único; `userAgent` informativo). Rotas `GET /push/config`, `POST /push/subscriptions` (upsert; `replaces` para `pushsubscriptionchange`) e `DELETE /push/subscriptions`. 404/410 do serviço de push apagam a assinatura.
- **Envio depois da resposta**: `background()` encapsula `executionCtx.waitUntil` (requisição e cron); `pushService.notify` nunca lança. Nos testes as tarefas rodam soltas e `drainBackground()` espera.
- **Avisos desta versão**, com link para a tela certa e `tag` por comunicação: para o aprovador endereçado, comunicação nova, período editado e cancelamento; para o autor, aprovação (individual ou em lote, com dias descontados quando ajustados), recusa (com o motivo) e lote desfeito; para a pessoa, crédito anual do cron, crédito manual e venda, com o saldo resultante. Administrador recebe só como aprovador endereçado.
- **Opt-in por dispositivo, sem preferência no servidor**: um modal uma vez por navegador logo após o login (texto por papel; `Ativar avisos` pede a permissão nativa no clique; `Agora não` grava em `localStorage` e não repete) e a tela **Notificações** no menu do usuário (interruptor deste dispositivo, o que a pessoa recebe, onde funciona). Preferências por canal (e-mail, Slack) ficam para as issues respectivas.
- **PWA mínima** (manifest `standalone` + ícones) porque no iPhone/iPad o push só existe com o site na Tela de Início (iOS 16.4+); o app explica o passo a passo e não grava recusa nesse caso.
- **Chaves**: `VAPID_PUBLIC_KEY` e `VAPID_SUBJECT` em `vars`; `VAPID_PRIVATE_KEY` como secret. Sem as três, `enabled: false`, nada de modal e o app segue igual. Par de desenvolvimento versionado em `.dev.vars.example` (só dev e testes); `make vapid-keys` gera outros.
- **Service worker** só para push (`public/sw.js`, sem cache de assets), com `showNotification` sempre dentro de `waitUntil` (o Safari revoga assinaturas após três pushes sem notificação).

## Consequências

- A entrega chega mesmo com o app fechado, mas depende do navegador: Chrome, Edge, Firefox e Safari no computador; Chrome no Android; iOS só instalado. A tela Notificações diz isso.
- Dados nos avisos são os mínimos (nome, período, dias, saldo); nada de observações.
- Não há preferência por tipo de aviso nem no servidor: desligar é por dispositivo. Se um dia houver e-mail, a tela ganha mais um interruptor e as preferências migram para a API.
- Caminhos do web usados nos links ficam em `push.messages.ts` (um só lugar), para a troca de rotas da issue #46.
