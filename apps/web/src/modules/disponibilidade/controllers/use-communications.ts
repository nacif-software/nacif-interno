import type {
  CommunicationDetailDto,
  CommunicationStatus,
  CommunicationSummaryDto,
  CreateCommunicationBody,
  Paginated,
  UpdatePeriodBody,
} from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export type MyCommunicationsFilters = {
  status?: CommunicationStatus;
  page?: number;
  pageSize?: number;
};

export function useMyCommunications(filters: MyCommunicationsFilters = {}) {
  return useQuery({
    queryKey: qk.disp.communications(filters),
    queryFn: () =>
      apiFetch<Paginated<CommunicationSummaryDto>>('/disponibilidade/communications', {
        query: filters,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useCommunication(code: string | undefined) {
  return useQuery({
    queryKey: qk.disp.communication(code ?? ''),
    queryFn: () =>
      apiFetch<CommunicationDetailDto>(
        `/disponibilidade/communications/${encodeURIComponent(code ?? '')}`,
      ),
    enabled: Boolean(code),
  });
}

function useInvalidateModule() {
  const qc = useQueryClient();
  return (detail?: CommunicationDetailDto) => {
    if (detail) qc.setQueryData(qk.disp.communication(detail.code), detail);
    void qc.invalidateQueries({ queryKey: qk.disp.all });
  };
}

export function useCreateCommunication() {
  const invalidate = useInvalidateModule();
  return useMutation({
    mutationFn: (body: CreateCommunicationBody) =>
      apiFetch<CommunicationDetailDto>('/disponibilidade/communications', { method: 'POST', body }),
    onSuccess: (detail) => invalidate(detail),
  });
}

export function useUpdatePeriod() {
  const invalidate = useInvalidateModule();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdatePeriodBody & { id: string }) =>
      apiFetch<CommunicationDetailDto>(`/disponibilidade/communications/${id}/period`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: (detail) => invalidate(detail),
  });
}

export function useCancelCommunication() {
  const invalidate = useInvalidateModule();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommunicationDetailDto>(`/disponibilidade/communications/${id}/cancel`, {
        method: 'POST',
      }),
    onSuccess: (detail) => invalidate(detail),
  });
}
