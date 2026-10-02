import { formatDateRange, MESSAGES } from '@nacif/shared';
import { Link } from 'react-router';
import { Button, Card, CardHeader, EmptyState, SkeletonCard } from '@/ui';
import { useDashboard } from '../../controllers/use-dashboard';
import { useSettings } from '../../controllers/use-settings';
import { paths } from '../../manifest';
import { businessDaysWithStatus } from '../../models';
import { CommunicationList } from '../components/communication-list';
import { Hero } from '../components/hero';
import { MetricCard } from '../components/metric-card';

export function DashboardPage() {
  const dashboard = useDashboard();
  const settings = useSettings();

  if (dashboard.isPending) return <SkeletonCard />;
  if (dashboard.isError) {
    return (
      <EmptyState
        title="Não foi possível carregar"
        body={dashboard.error.message}
        action={<Button onClick={() => void dashboard.refetch()}>Tentar novamente</Button>}
      />
    );
  }
  const d = dashboard.data;
  const empty = d.recent.length === 0;
  const next = d.nextUnavailability;

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-7">
      <div className="flex flex-col gap-4 md:hidden">
        <h1 className="text-section-title">Suas comunicações</h1>
        <Link to={paths.create}>
          <Button variant="accent" size="lg" block tabIndex={-1}>
            Nova comunicação
          </Button>
        </Link>
      </div>

      <Hero minNoticeDays={settings.data?.minNoticeDays ?? 7} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        <MetricCard
          label="Dias comunicados no ano"
          shortLabel="Dias no ano"
          value={d.daysCommunicatedInYear}
          hint={empty ? undefined : `Contador informativo, referente a ${d.year}.`}
          muted={empty}
        />
        <MetricCard
          label="Comunicações em análise"
          shortLabel="Em análise"
          value={d.inReviewCount}
          hint={
            d.inReviewApproverName ? `Aguardando decisão de ${d.inReviewApproverName}.` : undefined
          }
          muted={empty}
        />
        <MetricCard
          label="Próxima indisponibilidade"
          size="md"
          value={next ? formatDateRange(next.startDate, next.endDate, { withYear: false }) : '—'}
          hint={next ? businessDaysWithStatus(next) : undefined}
          muted={!next}
          className="max-md:hidden"
        />
      </div>

      {empty ? (
        <EmptyState
          centered
          title={MESSAGES.emptyDashboardTitle}
          body={MESSAGES.emptyDashboardBody}
          action={
            <Link to={paths.create}>
              <Button variant="accent" tabIndex={-1}>
                Nova comunicação de indisponibilidade
              </Button>
            </Link>
          }
          className="flex-1"
        />
      ) : (
        <Card>
          <CardHeader className="max-md:hidden">
            <h2 className="text-card-title">Minhas comunicações recentes</h2>
            <Link to={paths.list} className="text-[14px] font-semibold">
              Ver todas
            </Link>
          </CardHeader>
          <CommunicationList items={d.recent} />
        </Card>
      )}
    </div>
  );
}
