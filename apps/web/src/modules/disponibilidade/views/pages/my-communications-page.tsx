import { formatSentDate } from '@nacif/shared';
import { Link, useSearchParams } from 'react-router';
import { PageHeader } from '@/modules/core/views/layouts/page-header';
import { Button, Card, EmptyState, SkeletonCard, StatusBadge } from '@/ui';
import { useMyCommunications } from '../../controllers/use-communications';
import { paths } from '../../manifest';
import { communicationTitle } from '../../models';
import { CommunicationList } from '../components/communication-list';
import { StatusFilterChips } from '../components/status-filter-chips';

const OPTIONS = ['ALL', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
const GRID = 'grid-cols-[1.6fr_80px_1.2fr_1.2fr_1fr_120px]';

export function MyCommunicationsPage() {
  const [params, setParams] = useSearchParams();
  const status = OPTIONS.find((o) => o === params.get('status')) ?? 'ALL';
  const page = Number(params.get('page') ?? '1') || 1;
  const query = useMyCommunications({
    status: status === 'ALL' ? undefined : status,
    page,
    pageSize: 20,
  });

  const update = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '' || v === 'ALL' || v === '1') p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  };

  const data = query.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Minhas comunicações"
        subtitle={
          data ? `${data.total} ${data.total === 1 ? 'comunicação' : 'comunicações'}` : undefined
        }
        actions={
          <Link to={paths.create}>
            <Button variant="accent" tabIndex={-1}>
              Nova comunicação
            </Button>
          </Link>
        }
      />
      <StatusFilterChips
        options={OPTIONS}
        value={status}
        onChange={(v) => update({ status: v, page: undefined })}
      />

      {query.isPending ? (
        <SkeletonCard />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          eyebrow="Vazio"
          title="Nenhuma comunicação"
          body="Quando você comunicar um período de indisponibilidade, ele aparece aqui."
        />
      ) : (
        <Card className="overflow-hidden">
          <div
            className={`hidden h-12 items-center gap-4 border-b border-line bg-canvas px-5 md:grid ${GRID}`}
          >
            {['Período', 'Dias', 'Cobertura', 'Aprovador', 'Enviada em', 'Status'].map((h) => (
              <span key={h} className="text-eyebrow">
                {h}
              </span>
            ))}
          </div>
          <ul className="hidden md:block">
            {data.items.map((c) => (
              <li key={c.id} className="border-b border-line last:border-b-0">
                <Link
                  to={paths.detail(c.code)}
                  className={`grid h-[70px] items-center gap-4 px-5 text-inherit hover:bg-canvas hover:text-inherit ${GRID}`}
                >
                  <span className="text-[15px] font-semibold text-ink">
                    {communicationTitle(c).split(' · ')[0]}
                  </span>
                  <span className="font-mono text-[15px] font-medium text-ink">
                    {c.businessDays}
                  </span>
                  <span className="text-[15px] text-ink-muted">{c.cover.name}</span>
                  <span className="text-[15px] text-ink-muted">{c.approver.name}</span>
                  <span className="font-mono text-[14px] text-ink-muted">
                    {formatSentDate(c.submittedAt)}
                  </span>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="md:hidden">
            <CommunicationList items={data.items} />
          </div>
        </Card>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-[14px] text-ink-muted">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
          >
            Anterior
          </Button>
          <span>
            Página {page} de {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pages}
            onClick={() => update({ page: String(page + 1) })}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
