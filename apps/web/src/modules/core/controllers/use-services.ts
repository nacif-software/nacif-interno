import type { ServiceDescriptor } from '@nacif/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export function useServices() {
  return useQuery({
    queryKey: qk.services,
    queryFn: () => apiFetch<ServiceDescriptor[]>('/services'),
  });
}
