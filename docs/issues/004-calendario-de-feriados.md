# Feriados no cálculo de dias úteis

**Labels**: enhancement, regra de negócio

**Status da revisão**: revisada em 2026-10-02.

## Contexto

Hoje "dias úteis" exclui só sábado e domingo (ADR 0009). Um período que inclui um feriado conta um dia a mais do que deveria, no formulário, na comunicação registrada e no calendário do time.

## Proposta

Um cadastro de feriados usado em todo lugar que conta ou mostra dias úteis, com duas chaves de configuração na tela de Administração.

- **Feriados nacionais**: ligados por padrão. O sistema já vem com os feriados nacionais carregados e o administrador pode editar.
- **Feriados locais (estaduais e municipais)**: desligados por padrão. O administrador liga a chave e cadastra as datas.

## Decisões

- Dois escopos de feriado: nacional e local. Cada escopo tem sua chave em Configurações, e só os escopos ligados entram na contagem.
- Os feriados nacionais vêm carregados para o ano corrente e o seguinte. São calculados pelo próprio sistema, incluindo a Sexta-feira Santa, que muda a cada ano, sem depender de serviço externo. Uma ação "Carregar feriados nacionais de <ano>" cobre os anos seguintes.
- Tudo é editável: o administrador pode adicionar, renomear e remover qualquer feriado, inclusive os carregados.
- Feriados locais não vêm carregados, porque variam por cidade. Quando a chave está ligada, os feriados locais cadastrados valem para todo o time. Não há feriado por pessoa ou por cidade.
- Comunicações já enviadas não são recalculadas quando o cadastro muda. A contagem nova vale para comunicações criadas ou editadas dali em diante.

## Fora do escopo

- Feriado diferente por pessoa, cidade ou projeto.
- Pontos facultativos automáticos, como Carnaval e Corpus Christi. O administrador pode cadastrá-los à mão se a Nacif os tratar como não úteis.
- Integração com calendários externos.

## Notas de implementação

- Tabela `holidays` (data, nome, escopo) e dois campos novos em `availability_settings`. Mudança de schema: usar plan mode.
- `countBusinessDays` passa a receber a lista de feriados ativos. A função continua pura no `packages/shared`; quem busca os feriados é a API e o formulário.
- A API expõe os feriados ativos de um intervalo para o formulário e para o calendário.
- No seletor de período e no calendário do time, feriado ativo aparece como dia não útil, com o nome ao passar o cursor.
- Atualizar o ADR 0009.

## Critérios de aceite

- [ ] Com a configuração padrão, um período que inclui um feriado nacional conta um dia útil a menos no formulário, na API e no calendário.
- [ ] Desligar a chave de nacionais faz a contagem voltar a considerar só fins de semana.
- [ ] Ligar a chave de locais faz os feriados locais cadastrados entrarem na contagem; desligada, eles são ignorados.
- [ ] Administrador adiciona, edita e remove feriados e carrega os nacionais de outro ano.
- [ ] Feriado que cai em sábado ou domingo não altera a contagem.
- [ ] Comunicações já existentes mantêm o número de dias úteis registrado.
- [ ] Testes unitários da contagem e do cálculo dos feriados nacionais, testes de integração da API e de tela.
