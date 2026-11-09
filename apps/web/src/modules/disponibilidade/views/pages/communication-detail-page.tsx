import { displayCommunicationCode, formatDateRange, formatSentDate, MESSAGES } from '@nacif/shared';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/modules/core/controllers/use-session';
import { Breadcrumb, Button, Card, EmptyState, SkeletonCard, StatusBadge, useToast } from '@/ui';
import { useApprove, useReject } from '../../controllers/use-approvals';
import { useCancelCommunication, useCommunication } from '../../controllers/use-communications';
import { paths } from '../../manifest';
import { AdjustDeductionModal } from '../components/adjust-deduction-modal';
import { BalanceAfter } from '../components/balance-after';
import { CancelModal } from '../components/cancel-modal';
import { FlowTimeline } from '../components/flow-timeline';
import { RejectModal } from '../components/reject-modal';

export function CommunicationDetailPage() {
  const { code } = useParams();
  const query = useCommunication(code);
  const cancel = useCancelCommunication();
  const approve = useApprove();
  const reject = useReject();
  const toast = useToast();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const me = useCurrentUser();

  if (query.isPending) return <SkeletonCard />;
  if (query.isError)
    return (
      <EmptyState
        title="Comunicação não encontrada"
        body={query.error.message}
        action={<Link to={paths.list}>Voltar para minhas comunicações</Link>}
      />
    );
  const c = query.data;
  const balanceAfter = c.authorBalance - c.businessDays;
  const isAuthor = me.id === c.author.id;
  const debits = c.status === 'APPROVED';

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Minhas comunicações', to: paths.list },
          { label: displayCommunicationCode(c.code) },
        ]}
      />
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-7">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[32px] leading-[1.05] font-bold tracking-[-0.035em] text-ink md:text-[40px]">
                {formatDateRange(c.startDate, c.endDate)}
              </h1>
              <p className="text-[15px] text-ink-muted">
                {c.author.name}
                {c.projects.length > 0 && ` · ${c.projects.map((p) => p.name).join(', ')}`} ·
                enviada em {formatSentDate(c.submittedAt)}
              </p>
            </div>
            <StatusBadge status={c.status} size="lg" />
          </div>

          <Card className="grid grid-cols-2 gap-y-6 p-6 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow">Dias úteis</span>
              <span className="text-[26px] leading-none font-bold text-ink">{c.businessDays}</span>
            </div>
            <div className="flex flex-col gap-2 border-l border-line pl-6">
              <span className="text-eyebrow">{MESSAGES.deductedDaysLabel}</span>
              <span
                className={cn(
                  'text-[26px] leading-none font-bold',
                  debits ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {debits ? (c.deductedDays ?? c.businessDays) : '—'}
              </span>
              <span className="text-[13px] text-ink-muted">
                {c.status === 'IN_REVIEW'
                  ? MESSAGES.deductedDaysPending
                  : debits && c.deductedDays !== null && c.deductedDays !== c.businessDays
                    ? MESSAGES.deductedDaysAdjusted
                    : !debits
                      ? MESSAGES.deductedDaysNotApplicable
                      : undefined}
              </span>
            </div>
            <div className="flex flex-col gap-2 border-l border-line pl-6 max-md:border-l-0 max-md:pl-0">
              <span className="text-eyebrow">Cobertura</span>
              <span className="text-[18px] leading-[1.2] font-semibold text-ink">
                {c.cover?.name ?? MESSAGES.coverNotInformed}
              </span>
            </div>
            <div className="flex flex-col gap-2 border-l border-line pl-6">
              <span className="text-eyebrow">Aprovador</span>
              <span className="text-[18px] leading-[1.2] font-semibold text-ink">
                {c.approver.name}
              </span>
            </div>
          </Card>

          {c.notes && (
            <Card className="flex flex-col gap-3 p-6">
              <h2 className="text-[15px] font-semibold text-ink">Observações</h2>
              <p className="text-[16px] leading-[1.6] text-ink-muted">{c.notes}</p>
            </Card>
          )}

          {c.status === 'IN_REVIEW' && (
            <p className="text-[14px] text-ink-muted" data-testid="author-balance">
              {isAuthor ? MESSAGES.balanceMineLabel : MESSAGES.balanceOf(c.author.name)}:{' '}
              <BalanceAfter before={c.authorBalance} deducted={c.businessDays} />
              {balanceAfter < 0 && (
                <span className="text-danger"> · {MESSAGES.balanceNegativeHint}</span>
              )}
              {me.role === 'APPROVER' && !isAuthor && (
                <span className="block text-[13px]">{MESSAGES.balanceAdminOnlyHint}</span>
              )}
            </p>
          )}

          {c.conflicts.length > 0 && c.status === 'IN_REVIEW' && (
            <p className="text-[14px] text-warning">
              {c.conflicts
                .map(
                  (k) =>
                    `${k.name} (${formatDateRange(k.startDate, k.endDate, { withYear: false })})`,
                )
                .join(', ')}{' '}
              com indisponibilidade aprovada no mesmo período.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {c.permissions.canCancel && (
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                Cancelar comunicação
              </Button>
            )}
            {c.permissions.canEditPeriod && (
              <Link to={paths.edit(c.code)}>
                <Button variant="outline" tabIndex={-1}>
                  Editar período
                </Button>
              </Link>
            )}
            {c.permissions.canDecide && (
              <>
                <Button
                  variant="accent"
                  loading={approve.isPending && !adjustOpen}
                  onClick={() =>
                    approve.mutate(
                      { id: c.id },
                      {
                        onSuccess: () => toast.success(MESSAGES.approvedToast),
                        onError: (e) => toast.error(e.message),
                      },
                    )
                  }
                >
                  Aprovar
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  Recusar
                </Button>
                <Button variant="outline" onClick={() => setAdjustOpen(true)}>
                  {MESSAGES.adjustDeductionTitle}
                </Button>
              </>
            )}
          </div>
        </div>

        <aside className="w-full lg:w-[400px] lg:shrink-0">
          <FlowTimeline communication={c} />
        </aside>
      </div>

      <CancelModal
        communication={c}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        loading={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(c.id, {
            onSuccess: () => {
              setCancelOpen(false);
              toast.success(MESSAGES.cancelledToast);
              void navigate(paths.list);
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
      <AdjustDeductionModal
        communication={c}
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        loading={approve.isPending}
        onConfirm={(body) =>
          approve.mutate(
            { id: c.id, body },
            {
              onSuccess: () => {
                setAdjustOpen(false);
                toast.success(MESSAGES.approvedToast);
              },
              onError: (e) => toast.error(e.message),
            },
          )
        }
      />
      <RejectModal
        communication={c}
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        loading={reject.isPending}
        onConfirm={(justification) =>
          reject.mutate(
            { id: c.id, justification },
            {
              onSuccess: () => {
                setRejectOpen(false);
                toast.error(MESSAGES.rejectedToast);
              },
              onError: (e) => toast.error(e.message),
            },
          )
        }
      />
    </div>
  );
}
