import { relations } from 'drizzle-orm';
import {
  approvalBatches,
  availabilityDefaultApprovers,
  availabilitySettings,
  communications,
  decisions,
  flowEvents,
  passwordSetupTokens,
  projects,
  sessions,
  users,
} from './schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  project: one(projects, {
    fields: [users.projectId],
    references: [projects.id],
    relationName: 'projectMembers',
  }),
  sessions: many(sessions),
  passwordSetupTokens: many(passwordSetupTokens),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  defaultApprover: one(users, {
    fields: [projects.defaultApproverId],
    references: [users.id],
    relationName: 'projectDefaultApprover',
  }),
  members: many(users, { relationName: 'projectMembers' }),
  communications: many(communications),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const passwordSetupTokensRelations = relations(passwordSetupTokens, ({ one }) => ({
  user: one(users, { fields: [passwordSetupTokens.userId], references: [users.id] }),
}));

export const availabilitySettingsRelations = relations(availabilitySettings, ({ many }) => ({
  defaultApprovers: many(availabilityDefaultApprovers),
}));

export const availabilityDefaultApproversRelations = relations(
  availabilityDefaultApprovers,
  ({ one }) => ({
    settings: one(availabilitySettings, {
      fields: [availabilityDefaultApprovers.settingsId],
      references: [availabilitySettings.id],
    }),
    user: one(users, { fields: [availabilityDefaultApprovers.userId], references: [users.id] }),
  }),
);

export const communicationsRelations = relations(communications, ({ one, many }) => ({
  author: one(users, {
    fields: [communications.authorId],
    references: [users.id],
    relationName: 'communicationAuthor',
  }),
  cover: one(users, {
    fields: [communications.coverId],
    references: [users.id],
    relationName: 'communicationCover',
  }),
  approver: one(users, {
    fields: [communications.approverId],
    references: [users.id],
    relationName: 'communicationApprover',
  }),
  project: one(projects, { fields: [communications.projectId], references: [projects.id] }),
  decisions: many(decisions),
  events: many(flowEvents),
}));

export const approvalBatchesRelations = relations(approvalBatches, ({ one, many }) => ({
  approver: one(users, { fields: [approvalBatches.approverId], references: [users.id] }),
  decisions: many(decisions),
}));

export const decisionsRelations = relations(decisions, ({ one }) => ({
  communication: one(communications, {
    fields: [decisions.communicationId],
    references: [communications.id],
  }),
  decider: one(users, { fields: [decisions.deciderId], references: [users.id] }),
  batch: one(approvalBatches, { fields: [decisions.batchId], references: [approvalBatches.id] }),
}));

export const flowEventsRelations = relations(flowEvents, ({ one }) => ({
  communication: one(communications, {
    fields: [flowEvents.communicationId],
    references: [communications.id],
  }),
  actor: one(users, { fields: [flowEvents.actorId], references: [users.id] }),
}));
