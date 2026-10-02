# Login com Google Workspace (OAuth)

**Labels**: enhancement, auth

## Contexto

O design prevê "Entrar com e-mail Nacif". O MVP usa e-mail/senha local atrás da interface `AuthProvider` (ADR 0004).

## Proposta

Implementar `GoogleOAuthProvider`: fluxo authorization code, validação do domínio `nacif.xyz` (hd claim), criação/ativação da pessoa se convidada. Manter sessões e guards atuais. Login local pode continuar como fallback para administradores.

## Critérios de aceite

- [ ] Variáveis `GOOGLE_CLIENT_ID/SECRET` e callback configuráveis.
- [ ] Tela 01 com o botão único do design; erro 01b para domínio inválido.
- [ ] Testes de integração com o provider mockado.
