# API

Base `/api`, na mesma origem do web (o Worker serve os dois). JSON. Cookie de sessão `nacif_session` (httpOnly). Erros: `{ error: { code, message, details? } }` (códigos em `docs/architecture.md`). Datas `YYYY-MM-DD`; instantes ISO-8601 UTC. Listas paginadas: `{ items, total, page, pageSize }`.

## Core

| Método | Rota                                     | Acesso      | Corpo / query → resposta                                                                                                                               |
| ------ | ---------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/health`                                | público     | `{ status, db }`                                                                                                                                       |
| POST   | `/auth/login`                            | público     | `{ email, password }` → `{ user }` + cookie. 403 `DOMAIN_NOT_ALLOWED` (`details.email`), 401 `INVALID_CREDENTIALS`, 403 `USER_INACTIVE`                |
| POST   | `/auth/logout`                           | qualquer    | 204                                                                                                                                                    |
| GET    | `/auth/me`                               | autenticado | `{ user: SessionUser }`                                                                                                                                |
| GET    | `/auth/set-password/:token`              | público     | `{ email, name, mode: 'invite' \| 'reset' }`; 404 se inválido ou expirado, 403 `USER_INACTIVE` se a pessoa foi desativada. `reset` quando já tem senha |
| POST   | `/auth/set-password`                     | público     | `{ token, name?, password }` → `{ user }` + cookie. Revoga as sessões anteriores. `name` obrigatório no convite, ignorado na redefinição               |
| GET    | `/services`                              | autenticado | `ServiceDescriptor[]`                                                                                                                                  |
| GET    | `/users?role&active`                     | autenticado | admin: todas as pessoas; demais: só ativas                                                                                                             |
| GET    | `/users/options?purpose=cover\|approver` | autenticado | `UserOption[]` (exclui quem chama e inativos; `approver` só APPROVER/ADMIN)                                                                            |
| POST   | `/users/invites`                         | ADMIN       | `{ email, name?, role?, projectIds?, creditBaseDate? }` → 201 `{ user, setupLink }`                                                                    |
| POST   | `/users/:id/invites/resend`              | ADMIN       | `{ setupLink }`. 409 se a pessoa já tem senha                                                                                                          |
| POST   | `/users/:id/password-reset`              | ADMIN       | `{ setupLink }` de redefinição (7 dias, uso único). 409 se sem senha ou inativa. A senha atual vale até o link ser usado                               |
| PATCH  | `/users/:id`                             | ADMIN       | `{ name?, role?, active?, projectIds?, creditBaseDate? }` → `UserDto` (`projects[]`, `creditBaseDate`). Inativar revoga sessões.                       |
| GET    | `/projects`                              | autenticado | `ProjectDto[]`                                                                                                                                         |
| POST   | `/projects`                              | ADMIN       | `{ name, defaultApproverId? }` → 201                                                                                                                   |
| PATCH  | `/projects/:id`                          | ADMIN       | `{ name?, active?, defaultApproverId? }`                                                                                                               |

## Disponibilidade (`/api/disponibilidade`)

| Método | Rota                                                   | Acesso                          | Corpo / query → resposta                                                                                                             |
| ------ | ------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/settings`                                            | autenticado                     | `{ minNoticeDays, maxSimultaneousPerProject, daysPerYear, defaultApprovers[] }`                                                      |
| PUT    | `/settings`                                            | ADMIN                           | `{ minNoticeDays, maxSimultaneousPerProject, daysPerYear, defaultApproverIds[] }`                                                    |
| GET    | `/dashboard`                                           | autenticado                     | `{ year, balance, daysCommunicatedInYear, inReviewCount, inReviewApproverName, nextUnavailability, recent[] }`                       |
| GET    | `/communications?status&page&pageSize`                 | autenticado                     | minhas comunicações, mais recentes primeiro                                                                                          |
| GET    | `/communications/conflicts?startDate&endDate&exclude?` | autenticado                     | `{ conflicts[] (com projectNames), limitReached, limitReachedProjects[], projects[] }`: olha todos os projetos da pessoa             |
| POST   | `/communications`                                      | autenticado                     | `{ startDate, endDate, coverId, approverId, notes? }` → 201 `CommunicationDetailDto` (`authorBalance`, `deductedDays`, `projects[]`) |
| GET    | `/communications/:idOuCodigo`                          | autor, aprovador, admin         | `CommunicationDetailDto` (`flow`, `conflicts`, `permissions`)                                                                        |
| PATCH  | `/communications/:id/period`                           | autor, em análise               | `{ startDate, endDate }`                                                                                                             |
| POST   | `/communications/:id/cancel`                           | autor, em análise               | detail                                                                                                                               |
| GET    | `/approvals?status&from&to&projectId&page`             | APPROVER, ADMIN                 | `{ items: QueueItemDto[], total, page, pageSize, counts }`. Aprovador vê só as endereçadas a ele; admin vê todas.                    |
| POST   | `/approvals/:id/approve`                               | quem pode decidir               | corpo opcional `{ deductedDays?, deductionNote? }` (nota ≥ 10 obrigatória com o ajuste) → detail                                     |
| POST   | `/approvals/:id/reject`                                | quem pode decidir               | `{ justification }` (≥ 20 caracteres)                                                                                                |
| POST   | `/approvals/batch`                                     | APPROVER, ADMIN                 | `{ communicationIds[] }` → `{ batchId, approvedCount, skipped[], undoableUntil }`                                                    |
| POST   | `/approvals/batch/:batchId/undo`                       | mesmo aprovador, dentro de 30 s | `{ revertedCount }` ou 409 `UNDO_WINDOW_EXPIRED`                                                                                     |
| GET    | `/balance`                                             | autenticado                     | `BalanceDto` da própria pessoa: `balance`, `credits`, `sales`, `deducted`, `entries[]` (extrato com `runningBalance`)                |
| GET    | `/balance/overview`                                    | ADMIN                           | `BalanceOverviewItem[]` (pessoa, data base, saldo, último movimento), ativos primeiro                                                |
| GET    | `/balance/:userId`                                     | ADMIN                           | `BalanceDto` da pessoa                                                                                                               |
| POST   | `/balance/:userId/entries`                             | ADMIN                           | `{ type: GRANT \| SALE, days, referenceDate, note }` → 201 `BalanceDto`                                                              |
| POST   | `/balance/accrual/run`                                 | ADMIN                           | roda o crédito anual agora (o cron diário já faz) → `{ created }`                                                                    |
| GET    | `/calendar?month=AAAA-MM&projectId?`                   | autenticado                     | `{ month, days[], rows[{ user, projects[], isApprover, bars[] }] }`                                                                  |

Tipos em `packages/shared/src/schemas`.
