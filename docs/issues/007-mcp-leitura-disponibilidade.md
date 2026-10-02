# Servidor MCP de leitura do Nacif Disponibilidade

**Labels**: enhancement, integração

**Status da revisão**: revisada em 2026-10-02. Pré-requisito da issue 002.

**Quem pode fazer**: qualquer pessoa do time.

## Contexto

O Hermes Agent é o agente da Nacif para assuntos gerais da empresa. Ele roda em uma instância própria e responde em um grupo do Slack. Queremos que ele consiga responder perguntas sobre comunicações de indisponibilidade, por exemplo "alguém comunicou indisponibilidade esta semana?", "quem foi aprovado recentemente?" ou "quem está indisponível em 12 de outubro?".

Para isso o Nacif Disponibilidade precisa expor seus dados em um formato que agentes consomem. O padrão é o Model Context Protocol (MCP). Esta issue cria o servidor MCP. Conectar o Hermes a ele é a issue 002.

## Proposta

Um servidor MCP **somente leitura**, exposto pela API deste repositório, com ferramentas que reutilizam os services já existentes.

Ferramentas iniciais:

| Ferramenta                 | Responde                                                                | Filtros                                          |
| -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ |
| `listar_comunicacoes`      | comunicações com pessoa, projeto, período, dias úteis, status e datas   | status, pessoa, projeto, período, enviadas desde |
| `consultar_comunicacao`    | uma comunicação pelo código, com o fluxo (enviada, em análise, decisão) | código                                           |
| `listar_em_analise`        | o que está aguardando decisão e de quem                                 | aprovador, projeto                               |
| `listar_decisoes_recentes` | aprovações e recusas recentes, com quem decidiu e quando                | dias para trás, tipo de decisão                  |
| `quem_esta_indisponivel`   | pessoas com indisponibilidade aprovada ou em análise em uma data ou mês | data ou mês, projeto                             |

## Decisões

- **Sem dados sensíveis.** O MCP devolve só dados básicos: pessoa, projeto, período, dias úteis, status, cobertura, aprovador e datas. Observações do autor e justificativa de recusa ficam de fora, porque o que o agente recebe pode ser repetido no Slack. Dados completos continuam disponíveis apenas na plataforma, para administradores e aprovadores.
- **Autenticação por token de serviço** em variável de ambiente, comparado por hash. Sem tela de gestão de tokens por enquanto.
- **Endpoint HTTP na própria API**, com o transporte Streamable HTTP do MCP. Não é um processo separado.

## Fora do escopo

- Qualquer ferramenta de escrita: criar, aprovar, recusar, cancelar ou editar.
- Dados de administração: pessoas inativas, convites, configurações.
- Tela para gerar e revogar tokens.
- A configuração do lado do Hermes (issue 002).

## Dependências

- Nenhuma para desenvolver e testar: o servidor pode ser construído e validado localmente com um cliente MCP.
- O uso real pelo Hermes (issue 002) depende de o sistema estar em produção.

## Notas de implementação

- Novo módulo `mcp` em `apps/api/src/modules/`, montado em `/api/mcp`, usando o SDK oficial `@modelcontextprotocol/sdk` em modo sem estado.
- As ferramentas chamam os services de `disponibilidade`. Nada de consulta direta ao banco nas ferramentas.
- Schemas de entrada e saída em zod no `packages/shared`.
- Middleware próprio de autenticação por `Authorization: Bearer`, separado da sessão por cookie. Sem token configurado, o endpoint responde 404.
- Cada chamada gera uma linha de log com ferramenta, filtros e quantidade de registros devolvidos, sem o conteúdo.
- Limite de requisições por minuto e limite de registros por resposta.
- Nomes e descrições das ferramentas seguem o vocabulário do `AGENTS.md`, porque o agente repete esses termos.
- Mudança de contrato da API: usar plan mode, conforme o `CLAUDE.md`.

## Critérios de aceite

- [ ] Um cliente MCP autenticado lista as ferramentas e recebe respostas corretas para os dados do seed.
- [ ] Sem token, com token errado ou com a variável ausente, nenhuma informação é devolvida.
- [ ] Não existe ferramenta que altere dados.
- [ ] Observações e justificativas não aparecem nas respostas.
- [ ] Testes de integração cobrem cada ferramenta, a autenticação e os limites.
- [ ] `docs/api.md`, `docs/architecture.md` e `.env.example` documentam o endpoint, as ferramentas e a variável do token.
- [ ] Um ADR registra a decisão de expor leitura por MCP e o modelo de autenticação.
