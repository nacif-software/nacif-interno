import type { CommunicationStatus } from '../enums/communication-status';

/** Transições permitidas pelo fluxo normal (sem contar o undo de lote). */
export const TRANSITIONS: Record<CommunicationStatus, readonly CommunicationStatus[]> = {
  IN_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransition(
  from: CommunicationStatus,
  to: CommunicationStatus,
  options: { allowUndo?: boolean } = {},
): boolean {
  if (options.allowUndo && from === 'APPROVED' && to === 'IN_REVIEW') return true;
  return TRANSITIONS[from].includes(to);
}

export function canCancel(status: CommunicationStatus): boolean {
  return status === 'IN_REVIEW';
}

export function canEditPeriod(status: CommunicationStatus): boolean {
  return status === 'IN_REVIEW';
}

export function canDecide(status: CommunicationStatus): boolean {
  return status === 'IN_REVIEW';
}

/** Status que aparecem no calendário do time. */
export const CALENDAR_STATUSES: readonly CommunicationStatus[] = ['APPROVED', 'IN_REVIEW'];
