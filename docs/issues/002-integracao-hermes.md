# Conectar o Hermes Agent ao MCP do Nacif Disponibilidade

**Labels**: enhancement, integração

**Status da revisão**: rascunho em revisão (2026-10-02).

**Quem pode fazer**: somente Ricardo ou Lucca. O Hermes tem acesso a informações críticas e privadas da empresa, e a configuração acontece dentro da instância dele.

**Depende de**: issue 007 (servidor MCP de leitura) e de um ambiente publicado do Nacif Disponibilidade.

## Contexto

O Hermes Agent roda em uma instância EC2 própria e participa de um grupo no Slack, com acesso restrito a Ricardo, Lucca, Wenderson e Luisa. A infraestrutura de acesso à instância está no repositório `nacif-software/nacif-hermes-agent`.

Queremos que o Hermes responda, nesse grupo, perguntas sobre o status das comunicações de indisponibilidade: quem comunicou, o que está em análise, quem foi aprovado recentemente, quem está indisponível em determinado período.

## Proposta

Registrar o servidor MCP do Nacif Disponibilidade (issue 007) como fonte de dados do Hermes, com um token de serviço exclusivo para ele.

## Fora do escopo

- Qualquer ação do Hermes que altere dados no Nacif Disponibilidade.
- Abrir o Hermes para pessoas além das quatro com acesso hoje.
- O servidor MCP em si (issue 007).

## Passos

- Gerar o token de serviço do Hermes e guardá-lo apenas na instância, fora de qualquer repositório.
- Configurar o cliente MCP do Hermes com a URL publicada e o token.
- Validar no grupo do Slack com perguntas reais.
- Atualizar a lista "O que o Hermes Agent já faz" e a versão no repositório `nacif-hermes-agent`, conforme as regras de lá.

## Critérios de aceite

- [ ] No grupo do Slack, o Hermes responde corretamente: o que está em análise, quem foi aprovado nos últimos dias e quem está indisponível em uma data.
- [ ] O Hermes não consegue criar, aprovar, recusar nem cancelar nada.
- [ ] O token está só na instância e pode ser trocado sem alterar código.
- [ ] O README do `nacif-hermes-agent` lista a nova capacidade.
