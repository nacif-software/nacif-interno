import {
  formatDate,
  formatDateRange,
  MESSAGES,
  type BalanceDto,
  type BalanceEntryDto,
} from '@nacif/shared';
import { Link, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/modules/core/controllers/use-session';
import { PageHeader } from '@/modules/core/views/layouts/page-header';
import { Breadcrumb, Card, EmptyState, SkeletonCard } from '@/ui';
import { useBalanceOf, useMyBalance } from '../../controllers/use-balance';
import { paths } from '../../manifest';
import { MetricCard } from '../components/metric-card';

const GRID = 'grid-cols-[120px_1fr_90px_110px]';

function entryLabel(e: BalanceEntryDto): string {
  switch (e.kind) {
    case 'ACCRUAL':
      return MESSAGES.balanceEntryAccrual;
    case 'GRANT':
      return MESSAGES.balanceEntryGrant;
    case 'SALE':
      return MESSAGES.balanceEntrySale;
    case 'COMMUNICATION':
      return e.communication
        ? `${MESSAGES.balanceEntryCommunication} ${formatDateRange(e.communication.startDate, e.communication.endDate, { withYear: false })}`
        : MESSAGES.balanceEntryCommunication;
  }
}

function signed(days: number): string {
  return days > 0 ? `+${days}` : String(days);
}

/** Extrato do saldo de dias: da própria pessoa (`/saldo`) ou, para o administrador, de outra (`/saldo/:userId`). */
export function BalancePage() {
  const { userId } = useParams();
  const me = useCurrentUser();
  const mine = useMyBalance();
  const other = useBalanceOf(userId);
  const query = userId ? other : mine;
  const isMine = !userId || userId === me.id;

  if (query.isPending) return <SkeletonCard />;
  if (query.isError) {
    return (
      <EmptyState
        title="Não foi possível carregar"
        body={query.error.message}
        action={<Link to={paths.base}>Voltar ao início</Link>}
      />
    );
  }
  const b: BalanceDto = query.data;
  const negative = b.balance < 0;

  return (
    <div className="flex flex-1 flex-col gap-5 md:gap-7">
      {!isMine && (
        <Breadcrumb items={[{ label: 'Administração', to: paths.admin }, { label: b.user.name }]} />
      )}
      <PageHeader
        title={isMine ? MESSAGES.balanceMine : MESSAGES.balanceOf(b.user.name)}
        subtitle={
          b.creditBaseDate
            ? MESSAGES.balanceBaseDate(formatDate(b.creditBaseDate))
            : MESSAGES.balanceNoBaseDate
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        <MetricCard
          label={MESSAGES.balanceTitle}
          shortLabel="Saldo"
          value={<span className={cn(negative && 'text-danger')}>{b.balance}</span>}
          hint={negative ? MESSAGES.balanceNegativeHint : undefined}
        />
        <MetricCard label={MESSAGES.balanceCreditsLabel} value={b.credits} size="md" />
        <MetricCard label={MESSAGES.balanceSalesLabel} value={b.sales} size="md" />
        <MetricCard
          label={MESSAGES.deductedDaysLabel}
          shortLabel="Descontados"
          value={b.deducted}
          size="md"
        />
      </div>

      {b.entries.length === 0 ? (
        <EmptyState
          centered
          title={MESSAGES.balanceEmptyTitle}
          body={MESSAGES.balanceEmptyBody}
          className="flex-1"
        />
      ) : (
        <Card className="overflow-hidden">
          <div
            className={cn(
              'hidden h-12 items-center gap-4 border-b border-line bg-canvas px-5 md:grid',
              GRID,
            )}
          >
            {['Data', 'Lançamento', 'Dias', 'Saldo após'].map((h) => (
              <span key={h} className="text-eyebrow last:text-right">
                {h}
              </span>
            ))}
          </div>
          <ul>
            {b.entries.map((e) => (
              <li
                key={e.id}
                className={cn(
                  'flex flex-col gap-1 border-b border-line px-5 py-4 last:border-b-0 md:grid md:min-h-[64px] md:items-center md:gap-4 md:py-0',
                  GRID,
                )}
              >
                <span className="font-mono text-[14px] text-ink-muted">{formatDate(e.date)}</span>
                <span className="flex min-w-0 flex-col">
                  {e.communication ? (
                    <Link
                      to={paths.detail(e.communication.code)}
                      className="truncate text-[15px] font-semibold text-ink hover:text-brand"
                    >
                      {entryLabel(e)}
                    </Link>
                  ) : (
                    <span className="truncate text-[15px] font-semibold text-ink">
                      {entryLabel(e)}
                    </span>
                  )}
                  {e.note && <span className="text-[13px] text-ink-muted">{e.note}</span>}
                </span>
                <span
                  className={cn(
                    'font-mono text-[15px] font-medium',
                    e.days < 0 ? 'text-ink' : 'text-success',
                  )}
                >
                  {signed(e.days)}
                </span>
                <span
                  className={cn(
                    'font-mono text-[15px] text-ink-muted md:text-right',
                    e.runningBalance < 0 && 'text-danger',
                  )}
                >
                  {e.runningBalance}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
