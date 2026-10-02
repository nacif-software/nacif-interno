import { addMonths, APP_TIMEZONE, formatMonthTitle, isoDateMonth, todayIso } from '@nacif/shared';
import { useSearchParams } from 'react-router';
import { useProjects } from '@/modules/core/controllers/use-projects';
import { LegendItem, MonthNav, Select, SkeletonCard } from '@/ui';
import { useCalendar } from '../../controllers/use-calendar';
import { CalendarGrid } from '../components/calendar-grid';

export function TeamCalendarPage() {
  const [params, setParams] = useSearchParams();
  const month = /^\d{4}-\d{2}$/.test(params.get('month') ?? '')
    ? params.get('month')!
    : isoDateMonth(todayIso(APP_TIMEZONE));
  const projectId = params.get('projectId') || null;
  const calendar = useCalendar(month, projectId);
  const projects = useProjects();

  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-section-title md:text-screen-title">{formatMonthTitle(month)}</h1>
          <MonthNav
            onPrev={() => update({ month: addMonths(month, -1) })}
            onNext={() => update({ month: addMonths(month, 1) })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-5">
          <LegendItem variant="approved" label="Aprovada" />
          <LegendItem variant="in-review" label="Em análise" />
          <div className="w-[200px]">
            <Select
              aria-label="Filtrar por projeto"
              value={projectId ?? ''}
              onChange={(e) => update({ projectId: e.target.value || null })}
              className="py-[9px] text-[14px] font-medium"
            >
              <option value="">Todos os projetos</option>
              {projects.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  Projeto: {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      {calendar.isPending || !calendar.data ? (
        <SkeletonCard />
      ) : (
        <CalendarGrid data={calendar.data} />
      )}
    </div>
  );
}
