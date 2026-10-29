/**
 * Dados de exemplo do design (docs/design-spec.md), usados por `scripts/seed.ts`.
 * Ids determinísticos (`seed-...`) tornam o seed idempotente: rodar de novo atualiza, não duplica.
 * Senha de todas as pessoas: SEED_PASSWORD (padrão nacif1234).
 */
import type { CommunicationStatus, Role } from '@nacif/shared';

export const SEED_PROJECTS = [
  { id: 'seed-project-orion', name: 'Órion', defaultApprover: 'caio' },
  { id: 'seed-project-atlas', name: 'Atlas', defaultApprover: 'marina' },
  { id: 'seed-project-vega', name: 'Vega', defaultApprover: 'caio' },
] as const;

export type SeedProjectName = (typeof SEED_PROJECTS)[number]['name'];

export const SEED_PEOPLE = [
  {
    key: 'caio',
    name: 'Caio Bertelli',
    email: 'caio@nacif.xyz',
    role: 'ADMIN',
    project: 'Órion',
    active: true,
  },
  {
    key: 'marina',
    name: 'Marina Duarte',
    email: 'marina@nacif.xyz',
    role: 'APPROVER',
    project: 'Órion',
    active: true,
  },
  {
    key: 'pedro',
    name: 'Pedro Nakano',
    email: 'pedro@nacif.xyz',
    role: 'MEMBER',
    project: 'Órion',
    active: true,
  },
  {
    key: 'julia',
    name: 'Júlia Reis',
    email: 'julia@nacif.xyz',
    role: 'MEMBER',
    project: 'Atlas',
    active: true,
  },
  {
    key: 'rafael',
    name: 'Rafael Sousa',
    email: 'rafael@nacif.xyz',
    role: 'MEMBER',
    project: 'Atlas',
    active: true,
  },
  {
    key: 'bruna',
    name: 'Bruna Alencar',
    email: 'bruna@nacif.xyz',
    role: 'MEMBER',
    project: 'Vega',
    active: true,
  },
  {
    key: 'thiago',
    name: 'Thiago Lemos',
    email: 'thiago@nacif.xyz',
    role: 'MEMBER',
    project: 'Vega',
    active: false,
  },
] as const satisfies readonly {
  key: string;
  name: string;
  email: string;
  role: Role;
  project: SeedProjectName;
  active: boolean;
}[];

export type SeedPersonKey = (typeof SEED_PEOPLE)[number]['key'];

export const SEED_SETTINGS = {
  minNoticeDays: 7,
  maxSimultaneousPerProject: 2,
  defaultApprovers: ['caio', 'marina'] as const satisfies readonly SeedPersonKey[],
};

export interface SeedCommunication {
  code: string;
  author: SeedPersonKey;
  cover: SeedPersonKey;
  approver: SeedPersonKey;
  startDate: string;
  endDate: string;
  status: CommunicationStatus;
  submittedAt: string;
  notes?: string;
  decision?: {
    type: 'APPROVED' | 'REJECTED';
    by: SeedPersonKey;
    at: string;
    justification?: string;
  };
  cancelledAt?: string;
  conflictWith?: { person: SeedPersonKey; startDate: string; endDate: string };
}

export const SEED_COMMUNICATIONS: SeedCommunication[] = [
  // Marina (tela 02)
  {
    code: '2026-0151',
    author: 'marina',
    cover: 'pedro',
    approver: 'caio',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    status: 'CANCELLED',
    submittedAt: '2026-05-04T12:00:00Z',
    cancelledAt: '2026-05-10T13:00:00Z',
  },
  {
    code: '2026-0160',
    author: 'marina',
    cover: 'pedro',
    approver: 'caio',
    startDate: '2026-07-02',
    endDate: '2026-07-04',
    status: 'REJECTED',
    submittedAt: '2026-06-12T14:00:00Z',
    decision: {
      type: 'REJECTED',
      by: 'caio',
      at: '2026-06-12T20:40:00Z',
      justification: 'Sobreposição com a entrega final do Órion. Podemos retomar após 20/06.',
    },
  },
  {
    code: '2026-0172',
    author: 'marina',
    cover: 'pedro',
    approver: 'caio',
    startDate: '2026-09-14',
    endDate: '2026-09-18',
    status: 'APPROVED',
    submittedAt: '2026-08-02T15:00:00Z',
    decision: { type: 'APPROVED', by: 'caio', at: '2026-08-03T12:30:00Z' },
  },
  // Pedro aprovada 06–08 out (gera o conflito da tela 03/04)
  {
    code: '2026-0180',
    author: 'pedro',
    cover: 'marina',
    approver: 'caio',
    startDate: '2026-10-06',
    endDate: '2026-10-08',
    status: 'APPROVED',
    submittedAt: '2026-08-15T12:00:00Z',
    decision: { type: 'APPROVED', by: 'caio', at: '2026-08-16T12:00:00Z' },
  },
  // Caio aprovada 01–02 out (tela 06)
  {
    code: '2026-0181',
    author: 'caio',
    cover: 'marina',
    approver: 'marina',
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    status: 'APPROVED',
    submittedAt: '2026-08-18T12:00:00Z',
    decision: { type: 'APPROVED', by: 'marina', at: '2026-08-18T15:00:00Z' },
  },
  // Thiago aprovada 13–15 out (tela 06)
  {
    code: '2026-0182',
    author: 'thiago',
    cover: 'bruna',
    approver: 'caio',
    startDate: '2026-10-13',
    endDate: '2026-10-15',
    status: 'APPROVED',
    submittedAt: '2026-08-19T12:00:00Z',
    decision: { type: 'APPROVED', by: 'caio', at: '2026-08-19T16:00:00Z' },
  },
  // Fila (tela 05), em ordem de envio
  {
    code: '2026-0183',
    author: 'pedro',
    cover: 'marina',
    approver: 'caio',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-20T12:00:00Z',
  },
  {
    code: '2026-0184',
    author: 'marina',
    cover: 'julia',
    approver: 'caio',
    startDate: '2026-10-05',
    endDate: '2026-10-09',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-21T12:12:00Z',
    notes:
      'Deixo o handoff do Órion documentado até 02/10. Fico acessível para emergências pelo celular.',
    conflictWith: { person: 'pedro', startDate: '2026-10-06', endDate: '2026-10-08' },
  },
  {
    code: '2026-0185',
    author: 'julia',
    cover: 'rafael',
    approver: 'caio',
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-20T13:00:00Z',
  },
  {
    code: '2026-0186',
    author: 'rafael',
    cover: 'pedro',
    approver: 'caio',
    startDate: '2026-10-28',
    endDate: '2026-11-03',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-22T12:00:00Z',
  },
  {
    code: '2026-0187',
    author: 'bruna',
    cover: 'caio',
    approver: 'caio',
    startDate: '2026-11-09',
    endDate: '2026-11-10',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-23T12:00:00Z',
  },
  {
    code: '2026-0188',
    author: 'thiago',
    cover: 'bruna',
    approver: 'caio',
    startDate: '2026-11-16',
    endDate: '2026-11-27',
    status: 'IN_REVIEW',
    submittedAt: '2026-08-24T12:00:00Z',
  },
];
