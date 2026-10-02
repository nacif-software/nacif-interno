# API

Base `/api`. JSON. Cookie de sessão `nacif_session` (httpOnly). Erros: `{ error: { code, message, details? } }` (códigos em `docs/architecture.md`). Datas `YYYY-MM-DD`; instantes ISO-8601 UTC. Listas paginadas: `{ items, total, page, pageSize }`.

## Core

| Método | Rota                                     | Acesso      | Corpo / query → resposta                                                                                                                |
| ------ | ---------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`                                | público     | `{ status, db }`                                                                                                                        |
| POST   | `/auth/login`                            | público     | `{ email, password }` → `{ user }` + cookie. 403 `DOMAIN_NOT_ALLOWED` (`details.email`), 401 `INVALID_CREDENTIALS`, 403 `USER_INACTIVE` |
| POST   | `/auth/logout`                           | qualquer    | 204                                                                                                                                     |
| GET    | `/auth/me`                               | autenticado | `{ user: SessionUser }`                                                                                                                 |
| GET    | `/auth/set-password/:token`              | público     | `{ email, name }` ou 404                                                                                                                |
| POST   | `/auth/set-password`                     | público     | `{ token, name, password }` → `{ user }` + cookie                                                                                       |
| GET    | `/services`                              | autenticado | `ServiceDescriptor[]`                                                                                                                   |
| GET    | `/users?role&active`                     | autenticado | admin: todas as pessoas; demais: só ativas                                                                                              |
| GET    | `/users/options?purpose=cover\|approver` | autenticado | `UserOption[]` (exclui quem chama e inativos; `approver` só APPROVER/ADMIN)                                                             |
| POST   | `/users/invites`                         | ADMIN       | `{ email, name?, role?, projectId? }` → 201 `{ user, setupLink }`                                                                       |
| POST   | `/users/:id/invites/resend`              | ADMIN       | `{ setupLink }`                                                                                                                         |
| PATCH  | `/users/:id`                             | ADMIN       | `{ name?, role?, active?, projectId? }` → `UserDto`. Inativar revoga sessões.                                                           |
| GET    | `/projects`                              | autenticado | `ProjectDto[]`                                                                                                                          |
| POST   | `/projects`                              | ADMIN       | `{ name, defaultApproverId? }` → 201                                                                                                    |
| PATCH  | `/projects/:id`                          | ADMIN       | `{ name?, active?, defaultApproverId? }`                                                                                                |

## Disponibilidade (`/api/disponibilidade`)

| Método | Rota                                                   | Acesso                          | Corpo / query → resposta                                                                                          |
| ------ | ------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| GET    | `/settings`                                            | autenticado                     | `{ minNoticeDays, maxSimultaneousPerProject, defaultApprovers[] }`                                                |
| PUT    | `/settings`                                            | ADMIN                           | `{ minNoticeDays, maxSimultaneousPerProject, defaultApproverIds[] }`                                              |
| GET    | `/dashboard`                                           | autenticado                     | `{ year, daysCommunicatedInYear, inReviewCount, inReviewApproverName, nextUnavailability, recent[] }`             |
| GET    | `/communications?status&page&pageSize`                 | autenticado                     | minhas comunicações, mais recentes primeiro                                                                       |
| GET    | `/communications/conflicts?startDate&endDate&exclude?` | autenticado                     | `{ conflicts[], limitReached, projectName }`                                                                      |
| POST   | `/communications`                                      | autenticado com projeto         | `{ startDate, endDate, coverId, approverId, notes? }` → 201 `CommunicationDetailDto`                              |
| GET    | `/communications/:idOuCodigo`                          | autor, aprovador, admin         | `CommunicationDetailDto` (`flow`, `conflicts`, `permissions`)                                                     |
| PATCH  | `/communications/:id/period`                           | autor, em análise               | `{ startDate, endDate }`                                                                                          |
| POST   | `/communications/:id/cancel`                           | autor, em análise               | detail                                                                                                            |
| GET    | `/approvals?status&from&to&projectId&page`             | APPROVER, ADMIN                 | `{ items: QueueItemDto[], total, page, pageSize, counts }`. Aprovador vê só as endereçadas a ele; admin vê todas. |
| POST   | `/approvals/:id/approve`                               | quem pode decidir               | detail                                                                                                            |
| POST   | `/approvals/:id/reject`                                | quem pode decidir               | `{ justification }` (≥ 20 caracteres)                                                                             |
| POST   | `/approvals/batch`                                     | APPROVER, ADMIN                 | `{ communicationIds[] }` → `{ batchId, approvedCount, skipped[], undoableUntil }`                                 |
| POST   | `/approvals/batch/:batchId/undo`                       | mesmo aprovador, dentro de 30 s | `{ revertedCount }` ou 409 `UNDO_WINDOW_EXPIRED`                                                                  |
| GET    | `/calendar?month=AAAA-MM&projectId?`                   | autenticado                     | `{ month, days[], rows[{ user, project, isApprover, bars[] }] }`                                                  |

Tipos em `packages/shared/src/schemas`.
