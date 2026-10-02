# Modelo de dados

Fonte: `apps/api/prisma/schema.prisma`. Tabelas em snake_case; enums em maiúsculas.

## Core

| Model                | Tabela                  | Campos principais                                                                                                            | Notas                                                                           |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `User`               | `users`                 | `name`, `email` (único, `@nacif.xyz`), `role` (MEMBER/APPROVER/ADMIN), `active`, `passwordHash?`, `invitedAt?`, `projectId?` | `passwordHash` nulo = convite pendente. Uma pessoa pertence a um único projeto. |
| `Session`            | `sessions`              | `id` (token opaco = cookie), `userId`, `expiresAt`, `lastSeenAt`                                                             | Cascade ao apagar a pessoa.                                                     |
| `PasswordSetupToken` | `password_setup_tokens` | `tokenHash` (sha256), `userId`, `expiresAt`, `usedAt?`                                                                       | Uso único, 7 dias.                                                              |
| `Project`            | `projects`              | `name` (único), `active`, `defaultApproverId?`                                                                               | Aprovador padrão sugerido no formulário.                                        |

## Disponibilidade

| Model                  | Tabela                           | Campos principais                                                                                                                                                                               | Notas                                                                                                                              |
| ---------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `AvailabilitySettings` | `availability_settings`          | `id = 1`, `minNoticeDays` (7), `maxSimultaneousPerProject` (2)                                                                                                                                  | Linha única.                                                                                                                       |
| `DefaultApprover`      | `availability_default_approvers` | `userId`, `position`                                                                                                                                                                            | Fallback quando o projeto não tem aprovador padrão.                                                                                |
| `CommunicationCounter` | `communication_counters`         | `year`, `lastSequence`                                                                                                                                                                          | Gera `AAAA-NNNN` atomicamente.                                                                                                     |
| `Communication`        | `communications`                 | `code` (único), `year`+`sequence` (únicos), `authorId`, `projectId`, `startDate`/`endDate` (`date`), `businessDays`, `coverId`, `approverId`, `notes?`, `status`, `submittedAt`, `cancelledAt?` | Índices para fila (`approverId,status,submittedAt`), conflitos/calendário (`projectId,status,startDate,endDate`) e lista do autor. |
| `ApprovalBatch`        | `approval_batches`               | `approverId`, `undoableUntil`, `undoneAt?`                                                                                                                                                      | Aprovação em lote com undo.                                                                                                        |
| `Decision`             | `decisions`                      | `communicationId`, `type` (APPROVED/REJECTED), `deciderId`, `decidedAt`, `justification?`, `batchId?`, `revertedAt?`                                                                            | A decisão vigente é a mais recente com `revertedAt` nulo. Justificativa obrigatória (≥ 20) na recusa, garantida no service.        |
| `FlowEvent`            | `flow_events`                    | `communicationId`, `type`, `actorId?`, `occurredAt`, `description`, `metadata?`                                                                                                                 | Linha do tempo da tela 04. `metadata.conflicts` guarda o snapshot de conflitos no envio/edição.                                    |

## Status e transições

`IN_REVIEW → APPROVED | REJECTED | CANCELLED`. `APPROVED → IN_REVIEW` só via undo de lote. Regras em `packages/shared/src/rules/status-transitions.ts`.

## Relacionamentos

- `User` 1—N `Communication` como autor, cobertura e aprovador (três relações nomeadas).
- `Project` 1—N `User`; `Communication` N—1 `Project` (o projeto do autor no envio).
- `Communication` 1—N `Decision`, 1—N `FlowEvent`.
- `ApprovalBatch` 1—N `Decision`.
