import type { CalendarMonthDto } from '@nacif/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export function useCalendar(month: string, projectId: string | null) {
  return useQuery({
    queryKey: qk.disp.calendar(month, projectId),
    queryFn: () =>
      apiFetch<CalendarMonthDto>('/disponibilidade/calendar', {
        query: { month, projectId: projectId ?? undefined },
      }),
    placeholderData: (prev) => prev,
  });
}
