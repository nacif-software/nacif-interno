# ADR 0010 — Tela de login com copy geral do portal

**Status**: aceito (2026-10-02)

## Contexto

O design original da tela de login (`docs/design-spec.md`, tela 01) usa o título "Disponibilidade" e uma descrição que fala só de comunicar períodos de indisponibilidade. O design já registrava que nome e descrição eram provisórios, porque outros serviços internos entrariam no mesmo sistema. O login é a porta de entrada de todos os serviços, não de um módulo.

## Decisão

A tela de login fala dos serviços e recursos internos da Nacif de forma geral:

- Título: "Serviços internos".
- Descrição: "Acesse os serviços e recursos internos da Nacif."

Botão, alertas de erro e rodapé continuam como no design. A copy fica em `MESSAGES.portalTitle` e `MESSAGES.portalLoginDescription` (`packages/shared/src/labels/pt-br.ts`). O nome "Nacif Disponibilidade" segue valendo para o módulo, dentro do portal.

## Consequências

Esta decisão prevalece sobre a copy da tela 01 em `docs/design-spec.md`, que não é editado. O arquivo de design no Claude Design ainda mostra a copy antiga e deve ser atualizado por quem mantém o design. Novos módulos não alteram a tela de login.
