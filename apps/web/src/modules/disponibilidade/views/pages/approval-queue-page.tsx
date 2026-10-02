import { BATCH_UNDO_TOAST_MS, MESSAGES, type QueueItemDto } from '@nacif/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useCurrentUser } from '@/modules/core/controllers/use-session';
import { PageHeader } from '@/modules/core/views/layouts/page-header';
import { Badge, EmptyState, SkeletonCard, useToast } from '@/ui';
import { useApprovalSelection } from '../../controllers/approval-selection.store';
import { useBatchUndo } from '../../controllers/batch-undo.store';
import {
  useApprovals,
  useApprove,
  useBatchApprove,
  useReject,
  useUndoBatch,
} from '../../controllers/use-approvals';
import { BatchBar } from '../components/batch-bar';
import { PeriodFilter, periodPresets, type PeriodPreset } from '../components/period-filter';
import { QueueCard } from '../components/queue-card';
import { QueueTable } from '../components/queue-table';
import { RejectModal } from '../components/reject-modal';
import { StatusFilterChips } from '../components/status-filter-chips';

const STATUSES = ['IN_REVIEW', 'APPROVED', 'REJECTED'] as const;

export function ApprovalQueuePage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const status = STATUSES.find((s) => s === params.get('status')) ?? 'IN_REVIEW';
  const presets = periodPresets();
  const period = presets.find((p) => p.key === params.get('period')) ?? presets[0]!;
  const page = Number(params.get('page') ?? '1') || 1;

  const query = useApprovals({ status, from: period.from, to: period.to, page, pageSize: 50 });
  const approve = useApprove();
  const reject = useReject();
  const batch = useBatchApprove();
  const undo = useUndoBatch();
  const toast = useToast();
  const selection = useApprovalSelection();
  const batchUndo = useBatchUndo();
  const [rejecting, setRejecting] = useState<QueueItemDto | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => () => selection.clear(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  };

  const decidable = status === 'IN_REVIEW';
  const items = query.data?.items ?? [];
  const counts = query.data?.counts;
  const inReviewCount = counts?.inReview ?? 0;

  const onApprove = (item: QueueItemDto) => {
    setBusyId(item.id);
    approve.mutate(item.id, {
      onSuccess: () => toast.success(MESSAGES.approvedToast),
      onError: (e) => toast.error(e.message),
      onSettled: () => setBusyId(null),
    });
  };

  const onBatch = () => {
    const ids = items.filter((i) => selection.selected.has(i.id)).map((i) => i.id);
    batch.mutate(ids, {
      onSuccess: (result) => {
        selection.clear();
        batchUndo.arm(result.batchId, result.approvedCount, BATCH_UNDO_TOAST_MS);
        toast.info(
          MESSAGES.batchApprovedToast(result.approvedCount),
          {
            label: 'Desfazer',
            onClick: () =>
              undo.mutate(result.batchId, {
                onSuccess: (r) => toast.success(MESSAGES.batchUndoneToast(r.revertedCount)),
                onError: (e) => toast.error(e.message),
                onSettled: () => batchUndo.disarm(),
              }),
          },
          BATCH_UNDO_TOAST_MS,
        );
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between gap-3 md:hidden">
        <h1 className="text-[16px] font-semibold text-ink">Fila de aprovação</h1>
        <Badge tone="brand">{inReviewCount}</Badge>
      </div>
      <div className="max-md:hidden">
        <PageHeader
          title="Fila de aprovação"
          subtitle={`${inReviewCount} ${inReviewCount === 1 ? 'comunicação' : 'comunicações'} em análise${user.role === 'ADMIN' ? '' : ' para você'}`}
          actions={
            <>
              <StatusFilterChips
                options={STATUSES}
                value={status}
                onChange={(v) => update({ status: v, page: undefined })}
              />
              <PeriodFilter
                value={period}
                onChange={(p: PeriodPreset) => update({ period: p.key, page: undefined })}
              />
            </>
          }
        />
      </div>
      <div className="md:hidden">
        <StatusFilterChips
          size="sm"
          options={STATUSES}
          value={status}
          onChange={(v) => update({ status: v, page: undefined })}
        />
      </div>

      <BatchBar
        count={selection.selected.size}
        loading={batch.isPending}
        onApprove={onBatch}
        onClear={selection.clear}
      />

      {query.isPending ? (
        <SkeletonCard />
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="Vazio · fila de aprovação"
          title={decidable ? MESSAGES.emptyQueueTitle : 'Nada por aqui'}
          body={
            decidable
              ? MESSAGES.emptyQueueBody
              : 'Nenhuma comunicação com este status no período selecionado.'
          }
        />
      ) : (
        <>
          <QueueTable
            items={items}
            selected={selection.selected}
            onToggle={selection.toggle}
            onToggleAll={(on) =>
              selection.setMany(
                items.map((i) => i.id),
                on,
              )
            }
            onApprove={onApprove}
            onReject={setRejecting}
            decidable={decidable}
            busyId={busyId}
          />
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                decidable={decidable}
                busy={busyId === item.id}
                onApprove={() => onApprove(item)}
                onReject={() => setRejecting(item)}
              />
            ))}
          </div>
        </>
      )}

      <RejectModal
        communication={rejecting}
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        loading={reject.isPending}
        onConfirm={(justification) => {
          if (!rejecting) return;
          reject.mutate(
            { id: rejecting.id, justification },
            {
              onSuccess: () => {
                setRejecting(null);
                toast.error(MESSAGES.rejectedToast);
              },
              onError: (e) => toast.error(e.message),
            },
          );
        }}
      />
    </div>
  );
}
