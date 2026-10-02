# Integração com o Hermes

**Labels**: enhancement, módulo

## Contexto

Hermes é outro sistema interno da Nacif. O portal já mostra o card "Hermes" como "Em breve".

## Proposta

Criar o módulo `hermes` seguindo AGENTS.md §7: `apps/api/src/modules/hermes`, `apps/web/src/modules/hermes`, reuso de auth, pessoas e papéis do core. Escopo funcional a definir com o responsável pelo Hermes.

## Critérios de aceite

- [ ] Escopo do MVP do Hermes documentado em `docs/`.
- [ ] Módulo registrado nos dois registries; placeholder removido de `PLANNED_SERVICES`.
- [ ] Navegação por papel definida em `navItems(role)`.
