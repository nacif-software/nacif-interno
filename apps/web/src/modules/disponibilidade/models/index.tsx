import {
  formatBusinessDays,
  formatDateRange,
  MESSAGES,
  STATUS_LABEL_LOWER,
  type CommunicationSummaryDto,
  type FlowEventDto,
} from '@nacif/shared';
import type { TimelineStep } from '@/ui';
import { formatTimestamp } from '@nacif/shared';

/** Título de item de lista: '14 – 18 set 2026 · 5 dias úteis' */
export function communicationTitle(c: CommunicationSummaryDto, withYear = true): string {
  return `${formatDateRange(c.startDate, c.endDate, { withYear })} · ${formatBusinessDays(c.businessDays)}`;
}

/** Subtítulo por status, como na tela 02. */
export function communicationSubtitle(c: CommunicationSummaryDto): string {
  switch (c.status) {
    case 'REJECTED':
      return c.decision
        ? `Recusada por ${c.decision.decider.name}: ${lowerFirst(c.decision.justification ?? '')}`
        : 'Recusada.';
    case 'CANCELLED':
      return c.cancelledAt
        ? `Cancelada pelo autor em ${formatDayMonthFromInstant(c.cancelledAt)}.`
        : 'Cancelada pelo autor.';
    default:
      return `Cobertura: ${c.cover.name} · Aprovador: ${c.approver.name}`;
  }
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function formatDayMonthFromInstant(iso: string): string {
  // '21 ago 2026, 09:12' → '21 ago'
  return (
    formatTimestamp(iso)
      .split(',')[0]
      ?.replace(/ \d{4}$/, '') ?? ''
  );
}

/** Texto curto de status em prosa: '5 dias úteis · aprovada'. */
export function businessDaysWithStatus(c: {
  businessDays: number;
  status: CommunicationSummaryDto['status'];
}): string {
  return `${formatBusinessDays(c.businessDays)} · ${STATUS_LABEL_LOWER[c.status]}`;
}

interface FlowMeta {
  conflictNotes?: string[];
  decision?: 'APPROVED' | 'REJECTED';
  justification?: string | null;
}

/** Converte eventos de fluxo em passos da timeline (tela 04). */
export function flowToTimeline(
  flow: FlowEventDto[],
  status: CommunicationSummaryDto['status'],
): TimelineStep[] {
  const steps: TimelineStep[] = flow.map((e) => {
    const meta = (e.metadata ?? {}) as FlowMeta;
    const when = formatTimestamp(e.occurredAt);
    switch (e.type) {
      case 'SUBMITTED':
        return {
          key: e.id,
          title: 'Enviada',
          tone: 'brand',
          detail: `${e.actor?.name ?? e.description} · ${when}`,
        };
      case 'IN_REVIEW':
        return {
          key: e.id,
          title: 'Em análise',
          tone: 'warning',
          detail: `${e.description} · ${when}`,
          extra:
            meta.conflictNotes && meta.conflictNotes.length > 0 ? (
              <p className="text-[14px] leading-[1.5] text-warning">
                {meta.conflictNotes.join(' ')}
              </p>
            ) : undefined,
        };
      case 'DECISION': {
        const approved = meta.decision === 'APPROVED';
        return {
          key: e.id,
          title: approved ? 'Aprovada' : 'Recusada',
          tone: approved ? 'success' : 'danger',
          detail: `${e.description} em ${when}`,
          extra: meta.justification ? (
            <p className="text-[14px] leading-[1.5] text-ink-muted">“{meta.justification}”</p>
          ) : undefined,
        };
      }
      case 'CANCELLED':
        return {
          key: e.id,
          title: 'Cancelada',
          tone: 'neutral',
          detail: `${e.description.replace(/\.$/, '')} · ${when}`,
        };
      case 'EDITED':
        return {
          key: e.id,
          title: 'Período editado',
          tone: 'neutral',
          detail: `${e.description} · ${when}`,
        };
      case 'DECISION_REVERTED':
        return {
          key: e.id,
          title: 'Decisão desfeita',
          tone: 'neutral',
          detail: `${e.description} · ${when}`,
        };
    }
  });
  if (status === 'IN_REVIEW') {
    steps.push({
      key: 'pending',
      title: 'Decisão',
      tone: 'pending',
      detail: MESSAGES.decisionPending,
    });
  }
  return steps;
}
