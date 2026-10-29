import type {
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type PasswordSetupToken = typeof passwordSetupTokens.$inferSelect;
export type AvailabilitySettings = typeof availabilitySettings.$inferSelect;
export type DefaultApprover = typeof availabilityDefaultApprovers.$inferSelect;
export type Communication = typeof communications.$inferSelect;
export type NewCommunication = typeof communications.$inferInsert;
export type ApprovalBatch = typeof approvalBatches.$inferSelect;
export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;
export type FlowEvent = typeof flowEvents.$inferSelect;
export type NewFlowEvent = typeof flowEvents.$inferInsert;

export type UserWithProject = User & { project: Project | null };

/** Projeto com aprovador padrão e contagem de membros ativos. */
export type ProjectRow = Project & { defaultApprover: User | null; memberCount: number };

/** Comunicação com as relações que os mappers e as regras de permissão leem. */
export type CommunicationRow = Communication & {
  author: User;
  cover: User;
  approver: User;
  project: Project;
  /** Decisão vigente (não revertida), no máximo uma. */
  decisions: Decision[];
  events: (FlowEvent & { actor: User | null })[];
};

export type SettingsRow = AvailabilitySettings & {
  defaultApprovers: (DefaultApprover & { user: User })[];
};
