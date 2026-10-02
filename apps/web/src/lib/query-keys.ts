/** Chaves do TanStack Query. Invalidação por prefixo: qk.disp.all invalida tudo do módulo. */
export const qk = {
  auth: { me: ['auth', 'me'] as const },
  services: ['services'] as const,
  users: {
    all: ['users'] as const,
    list: (filters: Record<string, unknown> = {}) => ['users', 'list', filters] as const,
    options: (purpose: 'cover' | 'approver') => ['users', 'options', purpose] as const,
  },
  projects: ['projects'] as const,
  disp: {
    all: ['disp'] as const,
    settings: ['disp', 'settings'] as const,
    dashboard: ['disp', 'dashboard'] as const,
    communications: (filters: Record<string, unknown> = {}) =>
      ['disp', 'communications', filters] as const,
    communication: (code: string) => ['disp', 'communication', code] as const,
    conflicts: (range: { startDate: string; endDate: string; exclude?: string }) =>
      ['disp', 'conflicts', range] as const,
    approvals: (filters: Record<string, unknown> = {}) => ['disp', 'approvals', filters] as const,
    calendar: (month: string, projectId: string | null) =>
      ['disp', 'calendar', month, projectId] as const,
  },
};
