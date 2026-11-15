import {
  formatDate,
  MESSAGES,
  type BalanceOverviewItem,
  type CreateLedgerEntryBody,
} from '@nacif/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import { Button, EmptyState, useToast } from '@/ui';
import { useCreateLedgerEntry } from '../../controllers/use-balance';
import { paths } from '../../manifest';
import { LedgerEntryModal } from './ledger-entry-modal';

const GRID = 'md:grid-cols-[1fr_110px_70px_120px_250px]';

/** Tabela de saldos da Administração: pessoa, data base, saldo, último movimento e lançamentos. */
export function BalancesCard({ items }: { items: BalanceOverviewItem[] }) {
  const create = useCreateLedgerEntry();
  const toast = useToast();
  const [modal, setModal] = useState<{ item: BalanceOverviewItem; type: 'GRANT' | 'SALE' } | null>(
    null,
  );

  const confirm = (body: CreateLedgerEntryBody) => {
    if (!modal) return;
    const { item, type } = modal;
    create.mutate(
      { userId: item.user.id, ...body },
      {
        onSuccess: () => {
          setModal(null);
          toast.success(
            type === 'SALE'
              ? MESSAGES.saleToast(body.days, item.user.name)
              : MESSAGES.grantToast(body.days, item.user.name),
          );
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (items.length === 0) return <EmptyState title={MESSAGES.balancesEmpty} body="" />;

  return (
    <div>
      <div
        className={cn(
          'hidden h-[46px] items-center gap-4 border-b border-line bg-canvas px-[22px] md:grid',
          GRID,
        )}
      >
        {['Pessoa', MESSAGES.creditBaseDateLabel, 'Saldo', MESSAGES.lastEntryLabel].map((h) => (
          <span key={h} className="text-eyebrow">
            {h}
          </span>
        ))}
        <span />
      </div>
      <ul>
        {items.map((it) => (
          <li
            key={it.user.id}
            className={cn(
              'grid grid-cols-1 gap-3 border-b border-line px-[22px] py-4 last:border-b-0 md:min-h-16 md:items-center md:gap-4 md:py-0',
              GRID,
              !it.user.active && 'opacity-70',
            )}
          >
            <Link
              to={`${paths.balance}/${encodeURIComponent(it.user.id)}`}
              className="truncate text-[15px] font-semibold text-ink hover:text-brand"
            >
              {it.user.name}
            </Link>
            <span className="font-mono text-[14px] text-ink-muted">
              {it.creditBaseDate ? formatDate(it.creditBaseDate) : '—'}
            </span>
            <span
              data-testid="row-balance"
              className={cn(
                'font-mono text-[15px] font-semibold',
                it.balance < 0 ? 'text-danger' : 'text-ink',
              )}
            >
              {it.balance}
            </span>
            <span className="font-mono text-[14px] text-ink-muted">
              {it.lastEntryDate ? formatDate(it.lastEntryDate) : '—'}
            </span>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="py-[7px] text-[13px]"
                onClick={() => setModal({ item: it, type: 'GRANT' })}
              >
                {MESSAGES.grantAction}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="py-[7px] text-[13px]"
                onClick={() => setModal({ item: it, type: 'SALE' })}
              >
                {MESSAGES.saleAction}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <LedgerEntryModal
        key={modal ? `${modal.item.user.id}:${modal.type}` : 'closed'}
        person={modal?.item.user ?? null}
        type={modal?.type ?? 'GRANT'}
        open={modal !== null}
        onClose={() => setModal(null)}
        onConfirm={confirm}
        loading={create.isPending}
      />
    </div>
  );
}
