# Especificação funcional — Nacif Disponibilidade

> Fonte de verdade da UI. Extraída do design no Claude Design em 2026-09-23. Não editar sem alinhar com o design; mudanças de produto entram como issue.

Fonte: Claude Design, projeto `0a5a1443-594e-419d-b644-3edafff622df`, arquivo `Nacif Disponibilidade.dc.html` .

Frames: 01 Login 1120×720 · 01b Login erro 1120×720 · 02 Dashboard 1440×980 · 02b Dashboard vazio 1440×620 · 03 Formulário 1440×1290 · 04 Detalhe 1440×860 · 05 Fila 1440×900 · 05b Modal recusa 1440×640 · 06 Calendário 1440×820 · 07 Administração 1440×960 · M1/M2/M3 390×844/930/844. Fundo de tela `#F7F7F8`.

## A.1 Design tokens

Paleta documentada:

| Nome             | Hex       | Papel                                                                                                                                        |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Roxo principal   | `#5316E8` | marca NACIF, CTA roxo, links, foco, valores calculados, barra "aprovada", checkbox marcado, toggle ativo                                     |
| Roxo wash        | `#DDD2FB` | fundo de avatar, chip "Membro", barra de seleção em lote, pontos decorativos, dias internos do range, hachura "em análise", ilustração empty |
| Quase-preto      | `#080D24` | títulos, botão primário escuro, chip "Administrador", toast escuro, borda de input em foco, filtro ativo                                     |
| Cinza de texto   | `#4A4A55` | corpo secundário, rótulos, metadados, nav inativo                                                                                            |
| Superfície/borda | `#E5E5E5` | bordas, divisores, botão secundário, toggle off, métricas zeradas                                                                            |
| Fundo geral      | `#F7F7F8` | fundo de tela, cabeçalho de tabela, fim de semana, faixa de convite                                                                          |
| Sucesso          | `#16A34A` | "Aprovada", chip "Aprovador", ponto de toast sucesso                                                                                         |
| Atenção          | `#D97706` | "Em análise", alerta de conflito                                                                                                             |
| Recusa           | `#DC2626` | "Recusada", erro, borda de erro, destrutivo, "(obrigatória)"                                                                                 |
| Card             | `#FFFFFF` | cards, topbar, modal, inputs                                                                                                                 |

Auxiliares: `#FEF3E2` (fundo badge Em análise / alerta atenção), `#E8F6EC` (fundo Aprovada / Aprovador), `#FCEAEA` (fundo Recusada / alerta erro), `#EFEFF1` (fundo Cancelada / skeleton), `#C9C9CE` (dias passados, números de fim de semana), `#F2F2F3` (linhas verticais do calendário), `#F9F6FE` (linha de tabela selecionada), `rgba(8,13,36,.45)` overlay de modal.

Fontes: Space Grotesk 400/500/600/700 (UI) e IBM Plex Mono 400/500 (eyebrows, cabeçalhos de tabela, e-mails, datas de envio, números de config, coluna Dias, dias do calendário). `-webkit-font-smoothing:antialiased`.

Escala: Display 64/700/-0.035em; Título de tela 38 (na prática 34/700/-0.03em nas telas 02/05/06/07, 38 no formulário, 40 no detalhe); Título de seção 26/700/-0.03em; Título de card 20/700/-0.02em; Corpo 16/400/1.55; Auxiliar 14/400/1.5; Rótulo de tabela 12/500 mono .06em uppercase. Métrica grande 44/700; métrica média 30/700; título de item de lista 17/600; botões 15/600 (grande 16/600, pequeno 13–14/600); labels 14/600; hint/erro 13/400; badges 12/600 (.02em) ou 13/600; mono 11/500 para dias da semana e dias do calendário.

Radius: 6 cards/tabelas/modais; 5 botões/inputs/alertas/toasts; 4 badges/chips/botões pequenos/barras; 3 checkbox/skeleton; 12 toggle; 50% avatares/pontos. **Sem box-shadow em lugar nenhum.** Elevação só por borda `1px solid #E5E5E5`.

Layout: topbar desktop 68px branca, border-bottom, padding lateral 40px, gap logo↔nav 44, entre itens 28, item ativo 600 #080D24 com `border-bottom:2px solid #5316E8`. Topbar mobile 56px; tab bar inferior 64px. Conteúdo desktop padding 40 (36–44 vertical). Footer fixo de formulário branco border-top padding 20px 40px (mobile 16px 20px, botões empilhados). Card padding 24–28 (hero 32px 36px, modal 32, mobile 16–18). Larguras: login 420; coluna do formulário 720; sidebar detalhe 400; sidebar config 420; modal recusa 560; modal padrão 520; toast 420; coluna de nomes do calendário 200; empty state 460. Padrão decorativo: `radial-gradient(#DDD2FB 1.5px, transparent 1.5px)` 26px (login, opacity .55) / 22px (hero, opacity .7, faixa 280px à direita). Controles: input padding 13px 14px; textarea min-height 96 (modal 104, mobile 72); botão padrão 13px 20–22px; pequeno 8px 14px; badge 5px 11px.

## A.2 Telas

### 01 Login

Tela cheia com pontos lilás; card 420 centralizado padding 44px 40px gap 28. Conteúdo: `NACIF` (700 26 #5316E8) · H2 `Disponibilidade` (700 30) · `Acesse para comunicar períodos de indisponibilidade e acompanhar aprovações.` · botão primário escuro full `Entrar com e-mail Nacif` (círculo branco 18px à esquerda como ícone) · rodapé com border-top: `Apenas contas @nacif.xyz têm acesso. Se você é prestador do time e não consegue entrar, procure um administrador.` (`@nacif.xyz` em mono #080D24).
**Adaptação decidida (auth local):** o card ganha campos `E-mail` e `Senha` e o botão vira `Entrar`; mantém a restrição de domínio e o rodapé.

### 01b Login erro

Mesmo card, gap 24, sem parágrafo. Alerta de erro (borda #DC2626, fundo #FCEAEA, ponto 8px): título `Domínio não autorizado`, corpo `A conta rafael@gmail.com não pertence ao domínio nacif.xyz. Entre com seu e-mail Nacif.` (e-mail em mono, ecoado dinamicamente). Botão `Tentar com outra conta`. Rodapé curto `Apenas contas @nacif.xyz têm acesso.` Para auth local acrescentar erro de credenciais: título `E-mail ou senha incorretos` (copy nova, mesmo componente).

### 02 Dashboard do membro

Topbar: `NACIF` + nav `Início` (ativo) · `Minhas comunicações` · `Time`; à direita nome `Marina Duarte` + avatar 34px `MD` (#DDD2FB/#5316E8) + caret.
Hero (padding 32px 36px, pontos à direita): H2 `Precisa se ausentar?` · `Comunique o período com pelo menos 7 dias de antecedência.` · botão roxo `Nova comunicação de indisponibilidade`.
Métricas (3 cards): `Dias comunicados no ano` → `14` (44/700) + `Contador informativo, referente a 2026.` · `Comunicações em análise` → `1` + `Aguardando decisão de Caio Bertelli.` · `Próxima indisponibilidade` → `14 – 18 set` (30/700) + `5 dias úteis · aprovada`.
Card `Minhas comunicações recentes` + link `Ver todas`; linhas (padding 20px 28px): título `14 – 18 set 2026 · 5 dias úteis`, subtítulo `Cobertura: Pedro Nakano · Aprovador: Caio Bertelli`, badge, `enviada 02 ago` (mono 13). Subtítulo por status: em análise/aprovada → cobertura e aprovador; recusada → `Recusada por Caio Bertelli: sobreposição com entrega do projeto Órion.`; cancelada → `Cancelada pelo autor em 10 mai.`

### 02b Dashboard vazio

Métricas `0`, `0`, `—` em `#E5E5E5` sem texto de apoio. Empty state centralizado 460px: quadrado 56px #DDD2FB · `Nenhuma comunicação enviada` (26/700) · `Quando você precisar se ausentar, comunique o período aqui. O aprovador do seu projeto recebe e decide.` · botão roxo `Nova comunicação de indisponibilidade`.

### 03 Formulário

Topbar só com logo + breadcrumb `Minhas comunicações / Nova`. Coluna 720 gap 28.
H2 `Nova comunicação de indisponibilidade` (38/700) · `Antecedência mínima configurada: 7 dias.`
Card `Período de indisponibilidade` (600 15) com `Outubro 2026` à direita; grade 7 col gap 4; cabeçalho `D S T Q Q S S` (mono 11); células 38px com estados: empty, past (#C9C9CE), normal (#4A4A55), sel (#DDD2FB/#5316E8 600), edge (#5316E8/#FFF 600 radius 4), conflict (#FEF3E2/#D97706). Rodapé com 3 blocos separados por divisor: `INÍCIO` → `05 out 2026` · `FIM` → `09 out 2026` · `DIAS ÚTEIS NO PERÍODO` → `5 dias úteis` (600 17 #5316E8). **Implementar com controles ‹ › de mês e suporte a período cruzando meses** (o design omite, mas os dados exigem).
Alerta de conflito (borda #D97706, fundo #FEF3E2): `Conflito no projeto Órion` · `Pedro Nakano já tem indisponibilidade aprovada de 06 a 08 out no mesmo projeto. Você pode seguir, mas o aprovador verá esse conflito.` Não bloqueante.
Card de campos (gap 22): `Quem cobre suas entregas` select, opção formato `Júlia Reis — projeto Órion` · `Aprovador` select pré-preenchido `Caio Bertelli`, hint `Aprovador padrão do seu projeto.` · `Observações` + `(opcional)` textarea 96px.
Footer fixo: `Resumo: 05 – 09 out 2026 · 5 dias úteis · cobertura Júlia Reis` (trecho de datas em 600 #080D24) · botões `Cancelar` (secundário) e `Enviar comunicação` (primário escuro).

### 04 Detalhe

Breadcrumb `Minhas comunicações / #2026-0184` (código `#AAAA-NNNN`).
Coluna principal: H2 `05 – 09 out 2026` (40/700) + `Marina Duarte · projeto Órion · enviada em 21 ago 2026` + badge grande `Em análise`. Card de 3 métricas com divisores: `DIAS ÚTEIS` → `5` (26/700) · `COBERTURA` → `Júlia Reis` (18/600) · `APROVADOR` → `Caio Bertelli`. Card `Observações` com o texto. Ações: `Cancelar comunicação` (secundário) · `Editar período` (contorno roxo).
Sidebar 400 `Fluxo` (timeline, marcador 12px, conector 2px #E5E5E5): `Enviada` (marcador #5316E8) `Marina Duarte · 21 ago 2026, 09:12` · `Em análise` (marcador #D97706) `Encaminhada a Caio Bertelli · 21 ago 2026, 09:12` + linha #D97706 `Conflito sinalizado com Pedro Nakano (06–08 out).` · `Decisão` (marcador vazado, título #4A4A55) `Pendente. Quem decidir e a justificativa aparecem aqui.` Bloco final `Exemplo de decisão registrada` em caixa #F7F7F8: `Recusada por Caio Bertelli em 12 jun 2026, 17:40 — “Sobreposição com a entrega final do Órion. Podemos retomar após 20/06.”` (na implementação: mostrar a decisão real quando existir).

### 05 Fila de aprovação

Nav aprovador/admin: `Início` · `Aprovações` (ativo) · `Calendário do time` · `Administração`; avatar `CB`.
H2 `Fila de aprovação` + `6 comunicações em análise`. Filtros: `Em análise` (ativo #080D24/branco) · `Aprovadas` · `Recusadas` · chip período `Set – out 2026`.
Barra de lote (#DDD2FB, borda #5316E8): `2 selecionadas` · `Aprovar em lote` (roxo) · `Limpar seleção` (contorno escuro).
Tabela grid `44px 1.4fr 1.3fr 80px 1.1fr 1fr 110px 190px`, header 48px #F7F7F8 com checkbox geral, colunas `Pessoa` (nome + projeto) · `Período` · `Dias` (mono) · `Cobertura` · `Enviada em` (mono) · `Status` · ações `Aprovar` (roxo pequeno) + `Recusar` (branco, texto #DC2626). Linha 70px; selecionada #F9F6FE.
Dados exemplo: Pedro Nakano/Órion 12 – 16 out 2026/5/Marina Duarte/20 ago 2026 · Júlia Reis/Atlas 19 – 23 out 2026/5/Rafael Sousa/20 ago 2026 · Marina Duarte/Órion 05 – 09 out 2026/5/Júlia Reis/21 ago 2026 · Rafael Sousa/Atlas 28 out – 03 nov 2026/5/Pedro Nakano/22 ago 2026 · Bruna Alencar/Vega 09 – 10 nov 2026/2/Caio Bertelli/23 ago 2026 · Thiago Lemos/Vega 16 – 27 nov 2026/10/Bruna Alencar/24 ago 2026.

### 05b Modal recusa

Overlay rgba(8,13,36,.45), modal 560 padding 32 gap 22: `Recusar comunicação` (26/700) · `Pedro Nakano · 12 – 16 out 2026 · 5 dias úteis. A justificativa é enviada ao autor.` · label `Justificativa` + `(obrigatória)` em #DC2626, textarea 104px, hint `Mínimo de 20 caracteres.` · footer border-top: `Voltar` (secundário) · `Confirmar recusa` (fundo #DC2626, branco). Erro: `Informe uma justificativa com ao menos 20 caracteres.`

### 06 Calendário do time

Nav: `Início` · `Aprovações` · `Calendário do time` (ativo) (+ `Administração` para admin). H2 `Outubro 2026` + botões 32px `‹` `›`. Legenda: amostra sólida #5316E8 `Aprovada`; amostra hachurada (`repeating-linear-gradient(45deg,#DDD2FB 0 4px,#FFFFFF 4px 8px)` borda #5316E8) `Em análise`; chip `Projeto: Órion` (implementar como seletor com opção "Todos os projetos").
Grade: coluna 200px (nome 600 15 + projeto 400 13, ex. `Órion · aprovador`) + `repeat(N dias,1fr)`, header 40px com dias em mono 11, fins de semana #C9C9CE com fundo #F7F7F8, `border-right:1px solid #F2F2F3`. Linhas 66px; barras absolutas top 19 height 28 radius 4 padding 0 10px 600 12: aprovada sólida #5316E8/branco (`Aprovada`); em análise hachurada `45deg,#DDD2FB 0 5px,#FFFFFF 5px 10px` borda #5316E8 texto #5316E8 (`Em análise · 5 dias` quando couber). Mostra aprovadas e em análise; recusadas/canceladas não aparecem. Períodos cruzando o mês são truncados.

### 07 Administração

Nav com `Administração` ativo. Duas colunas: `Pessoas` (flex 1) e `Configurações` (420).
Pessoas: botão `Convidar por e-mail` (primário escuro pequeno). Tabela grid `1.6fr 1.4fr 1fr 120px`, header 46px: `Pessoa` · `E-mail` (mono) · `Papel` (chip: `Administrador` #080D24/#FFF, `Aprovador` #E8F6EC/#16A34A, `Membro` #DDD2FB/#5316E8) · `Ativo` (toggle 44×24 à direita). Linhas 64px. Dados: Caio Bertelli caio@nacif.xyz Administrador on · Marina Duarte marina@ Aprovador on · Pedro Nakano pedro@ Membro on · Júlia Reis julia@ Membro on · Rafael Sousa rafael@ Membro on · Thiago Lemos thiago@ Membro **off**. Rodapé #F7F7F8: input placeholder `nome@nacif.xyz` (mono) + botão roxo `Enviar convite`.
Configurações (card padding 26, seções com border-top): `Antecedência mínima` input 88px mono valor `7` + `dias antes do início` · `Limite de pessoas simultaneamente indisponíveis` input `2` + `por projeto` · `Aprovadores padrão` chips lilás `Caio Bertelli`, `Marina Duarte` + chip tracejado `+ adicionar`, hint `Usados quando o membro do time não escolhe um aprovador.` · botão `Salvar configurações` à direita.
**Acréscimo necessário (não desenhado):** CRUD de projetos e associação pessoa↔projeto, com os mesmos componentes de tabela.

### M1 Dashboard mobile

Header 56: `NACIF` (18) + avatar 30 `MD`. H2 `Suas comunicações` (26) · botão roxo full `Nova comunicação` · métricas 2 col `Dias no ano` → `14`, `Em análise` → `1` (30/700) · lista: `14 – 18 set` + badge (11/600, 4px 9px) + `5 dias úteis · cobertura Pedro Nakano`; `05 – 09 out` Em análise `5 dias úteis · cobertura Júlia Reis`; `02 – 04 jul` Recusada `3 dias úteis`. Tab bar: `Início` (ativo 600 #5316E8) · `Comunicações` · `Time`.

### M2 Nova comunicação mobile

Header: `‹` + `Nova comunicação`. Card `Período` com grade compacta (células 30px, 13px) e rodapé `05 – 09 out · 5 dias úteis` (600 15 #5316E8). Alerta compacto: `Conflito no projeto Órion.` + ` Pedro Nakano está indisponível de 06 a 08 out.` Campos (labels 600 13): `Quem cobre suas entregas` → `Júlia Reis` · `Aprovador` → `Caio Bertelli` · `Observações` textarea 72px. Footer empilhado: `Enviar comunicação` (escuro, 16) sobre `Cancelar` (secundário).

### M3 Fila mobile

Header: `Fila de aprovação` + badge contador `6` (#DDD2FB/#5316E8). Chips `Em análise` · `Aprovadas` · `Recusadas`. Cards (padding 18 gap 14): `Pedro Nakano` (16/600) · `12 – 16 out · 5 dias úteis · Órion` · `Cobertura: Marina Duarte` · botões lado a lado flex 1 `Aprovar` (roxo) e `Recusar` (branco/#DC2626). Sem lote.

## A.3 Componentes

- Botões (radius 5, 600 15, 13px 20px): Primário escuro #080D24/#FFF · Destaque roxo #5316E8/#FFF · Secundário #E5E5E5/#080D24 · Contorno transparente/#5316E8 borda #E5E5E5 · Destrutivo #FFF/#DC2626 borda #E5E5E5 · Destrutivo sólido #DC2626/#FFF · Contorno escuro transparente/#080D24 borda #080D24 · Desabilitado #E5E5E5/#4A4A55 opacity .55. Tamanhos lg/md/sm.
- Inputs (radius 5, 13px 14px, 16/400): padrão borda #E5E5E5 texto #4A4A55; foco borda #080D24 texto #080D24; erro borda #DC2626 + mensagem 13 #DC2626; desabilitado fundo #F7F7F8 opacity .7. Select = input + caret triangular 5/5/6 #4A4A55. Label 14/600 #080D24 com sufixo `(opcional)` #4A4A55 ou `(obrigatória)` #DC2626. Hint 13/400 #4A4A55. Input numérico 88px mono 16 + sufixo.
- Badges (radius 4, 5px 11px, 12/600 .02em): Em análise #FEF3E2/#D97706 · Aprovada #E8F6EC/#16A34A · Recusada #FCEAEA/#DC2626 · Cancelada #EFEFF1/#4A4A55 · Membro #DDD2FB/#5316E8 · Administrador #080D24/#FFF · Aprovador #E8F6EC/#16A34A. Tamanhos lg (7px 13px, 13) e sm (4px 9px, 11).
- Chips de filtro: ativo #080D24/#FFF 13/600 9px 14px radius 4; inativo #FFF borda #E5E5E5 #4A4A55 13/500; tracejado `+ adicionar`.
- Tabela: card radius 6 overflow hidden; header #F7F7F8 46–48px mono 12 uppercase; linha 64–70px border-bottom; selecionada #F9F6FE; sem zebra; checkbox 16px radius 3; toggle 44×24.
- Lista de card: item 20px 28px, título 17/600, subtítulo 14, badge + timestamp mono 13.
- Modal padrão 520 (padding 28, título 22/700): ex. `Cancelar comunicação` / `O período 05 – 09 out 2026 deixa de constar no calendário do time. A ação não pode ser desfeita.` / `Voltar` + `Cancelar comunicação`.
- Toasts 420 (radius 5, 16px 18px, ponto 8px, 15/500): sucesso escuro ponto #16A34A `Comunicação enviada a Caio Bertelli.` ação `Ver` (#DDD2FB) · erro escuro ponto #DC2626 `Comunicação recusada. O autor foi notificado.` · informativo claro ponto #5316E8 `4 comunicações aprovadas em lote.` ação `Desfazer` (#5316E8).
- Estados: vazio fila `Nada em análise` / `Nenhuma comunicação aguarda sua decisão. Novas aparecem aqui assim que enviadas.` · skeleton 3 barras 16px #EFEFF1 (100/78/54%).
- Alertas inline: erro (#DC2626/#FCEAEA) e atenção (#D97706/#FEF3E2), ponto 8px margin-top 7, título 14/600, corpo 14/400.
- Avatar 34/30px #DDD2FB iniciais #5316E8 13/600. Logo `NACIF` 700 -0.04em #5316E8 (26/20/18). Nav item 15 (ativo 600 + underline). Breadcrumb 15 com `/` #E5E5E5. Timeline. Date picker inline. Gantt. Botões de mês 32px. Legenda 22×10. Link de ação 14/600 #5316E8.

## A.4 Modelo de dados inferido

- **Pessoa**: id, nome, iniciais (derivado), email (@nacif.xyz), papel enum `MEMBRO | APROVADOR | ADMINISTRADOR`, ativo bool, projeto (FK), senha hash (auth local), convite pendente.
- **Projeto**: nome (`Órion`, `Atlas`, `Vega`), aprovadorPadrao (FK Pessoa).
- **Comunicação**: codigo `#2026-0184` (ano + sequencial 4 dígitos), autor, projeto, dataInicio, dataFim, diasUteis (calculado, exclui sáb/dom), cobertura (FK Pessoa, obrigatório), aprovador (FK Pessoa), observacoes (opcional), status enum `EM_ANALISE | APROVADA | RECUSADA | CANCELADA`, enviadaEm, canceladaEm, conflitos (derivado).
- **Decisão**: comunicacaoId, tipo `APROVADA | RECUSADA`, decidor, decididaEm, justificativa (obrigatória ≥20 chars na recusa), loteId (aprovação em lote desfazível).
- **EventoDeFluxo**: comunicacaoId, tipo `ENVIADA | EM_ANALISE | DECISAO | CANCELADA | EDITADA`, ator, timestamp, descricao.
- **Configuração global**: antecedenciaMinimaDias=7, limiteSimultaneosPorProjeto=2, aprovadoresPadrao (lista Pessoa).

## A.5 Regras de negócio

1. Acesso só `@nacif.xyz`; erro `Domínio não autorizado`. Onboarding por convite de admin.
2. Antecedência mínima 7 dias (configurável), exibida no hero e no formulário. Violar → erro de validação no formulário (copy a definir: `O início deve ser pelo menos 7 dias após hoje.`).
3. Período contínuo; dias passados desabilitados; pode cruzar meses.
4. Contagem em dias úteis (exclui sáb/dom; sem feriados no MVP).
5. `Dias comunicados no ano` é informativo, não saldo.
6. Conflito: sobreposição com comunicação **aprovada** de outra pessoa no **mesmo projeto** → aviso amarelo não bloqueante + nota no fluxo visível ao aprovador. Limite de simultâneos (2) alimenta esse aviso; não bloqueia.
7. Cobertura obrigatória; aprovador pré-preenchido com o padrão do projeto (fallback: aprovadores padrão globais), editável.
8. Enviar → `EM_ANALISE` imediatamente + evento `Enviada` e `Em análise` com o mesmo timestamp; toast `Comunicação enviada a <aprovador>.`
9. Aprovar: sem justificativa; em lote com `Desfazer` (janela curta, ex. 10 s, no cliente + endpoint de reversão).
10. Recusar: individual, justificativa ≥ 20 chars; toast `Comunicação recusada. O autor foi notificado.`
11. Cancelar pelo autor enquanto em análise (modal de confirmação); registro `Cancelada pelo autor em <data>.`
12. Editar período enquanto em análise; mantém o código, registra evento `Editada`, reencaminha ao aprovador.
13. Calendário do time: aprovadas + em análise, todas as pessoas ativas, filtro por projeto.
14. Papéis: Membro cria/acompanha; Aprovador decide (e também é membro); Administrador gerencia pessoas, papéis, ativação, convites, projetos e configurações. Fila: aprovador vê as endereçadas a ele; admin vê todas.
15. Nav por papel: membro `Início | Minhas comunicações | Time`; aprovador `Início | Aprovações | Calendário do time`; admin idem + `Administração`.
16. Pessoa inativa não faz login, não aparece como opção de cobertura, mas comunicações passadas permanecem.

## A.6 Ambiguidades resolvidas por decisão de implementação

- Tela `Minhas comunicações` (lista completa) não desenhada → tabela com as mesmas colunas da fila menos ações + filtros de status.
- Tela `Time` para membro → o calendário 06 em modo somente leitura.
- Menu do usuário (caret) → dropdown com nome, e-mail e `Sair`.
- Formatos de data: range `05 – 09 out 2026` (en-dash com espaços, mês abreviado minúsculo sem ponto); timestamp `21 ago 2026, 09:12`; `enviada 02 ago`; mês `Outubro 2026`. Centralizar em `packages/shared/src/format/date.ts`.
- Estados hover/focus não definidos → hover escurece 6% e focus-visible com anel `2px solid #5316E8` offset 2.
- Sem sombras, exceto dropdown do menu do usuário e toasts (sombra leve `0 4px 16px rgba(8,13,36,.12)`).
- Tablet: layout desktop até 1024px, mobile abaixo de 768px, intermediário com grid fluido.
