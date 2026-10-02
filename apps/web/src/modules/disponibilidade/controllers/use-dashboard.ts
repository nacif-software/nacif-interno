import type { DashboardDto } from '@nacif/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export function useDashboard() {
  return useQuery({
    queryKey: qk.disp.dashboard,
    queryFn: () => apiFetch<DashboardDto>('/disponibilidade/dashboard'),
  });
}
