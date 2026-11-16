import {
  MESSAGES,
  formatBusinessDays,
  formatDateRange,
  formatDays,
  type IsoDate,
  type PushNotification,
} from '@nacif/shared';

/** Caminhos do web abertos ao clicar no aviso (mantidos num só lugar; `paths` do manifest do web). */
const WEB_PATHS = {
  communication: (code: string) => `/disponibilidade/communications/${code}`,
  approvals: '/disponibilidade/approvals',
  balance: '/disponibilidade/balance',
};

interface CommunicationRef {
  id: string;
  code: string;
  startDate: IsoDate;
  endDate: IsoDate;
}

const JUSTIFICATION_MAX = 80;

function truncate(text: string, max: number): string {
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length <= max ? single : `${single.slice(0, max - 1).trimEnd()}…`;
}

const tagOf = (c: CommunicationRef) => `comm-${c.id}`;
const rangeOf = (c: CommunicationRef) => formatDateRange(c.startDate, c.endDate);

/** Textos dos avisos push; a copy vem de `MESSAGES` (shared). */
export const pushMessages = {
  newForApprover(c: CommunicationRef, authorName: string, businessDays: number): PushNotification {
    return {
      title: MESSAGES.pushNewTitle,
      body: MESSAGES.pushNewBody(authorName, rangeOf(c), formatBusinessDays(businessDays)),
      url: WEB_PATHS.communication(c.code),
      tag: tagOf(c),
    };
  },
  edited(c: CommunicationRef, authorName: string): PushNotification {
    return {
      title: MESSAGES.pushEditedTitle,
      body: MESSAGES.pushEditedBody(authorName, rangeOf(c)),
      url: WEB_PATHS.communication(c.code),
      tag: tagOf(c),
    };
  },
  cancelled(c: CommunicationRef, authorName: string): PushNotification {
    return {
      title: MESSAGES.pushCancelledTitle,
      body: MESSAGES.pushCancelledBody(authorName, rangeOf(c)),
      url: WEB_PATHS.approvals,
      tag: tagOf(c),
    };
  },
  approved(
    c: CommunicationRef,
    approverName: string,
    deductedDays: number | null,
  ): PushNotification {
    return {
      title: MESSAGES.pushApprovedTitle,
      body: MESSAGES.pushApprovedBody(
        rangeOf(c),
        approverName,
        deductedDays === null
          ? null
          : `${deductedDays} ${deductedDays === 1 ? 'dia descontado' : 'dias descontados'}`,
      ),
      url: WEB_PATHS.communication(c.code),
      tag: tagOf(c),
    };
  },
  rejected(c: CommunicationRef, approverName: string, justification: string): PushNotification {
    return {
      title: MESSAGES.pushRejectedTitle,
      body: MESSAGES.pushRejectedBody(approverName, truncate(justification, JUSTIFICATION_MAX)),
      url: WEB_PATHS.communication(c.code),
      tag: tagOf(c),
    };
  },
  reverted(c: CommunicationRef): PushNotification {
    return {
      title: MESSAGES.pushRevertedTitle,
      body: MESSAGES.pushRevertedBody(rangeOf(c)),
      url: WEB_PATHS.communication(c.code),
      tag: tagOf(c),
    };
  },
  ledger(type: 'ACCRUAL' | 'GRANT' | 'SALE', days: number, balance: number): PushNotification {
    const d = formatDays(days);
    const title =
      type === 'ACCRUAL'
        ? MESSAGES.pushAccrualTitle(d)
        : type === 'GRANT'
          ? MESSAGES.pushGrantTitle(d)
          : MESSAGES.pushSaleTitle(d);
    return {
      title,
      body: MESSAGES.pushBalanceBody(balance),
      url: WEB_PATHS.balance,
      tag: `balance-${type.toLowerCase()}`,
    };
  },
};
