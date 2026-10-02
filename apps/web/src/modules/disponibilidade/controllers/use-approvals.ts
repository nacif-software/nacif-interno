import type {
  ApprovalsResult,
  BatchApproveResult,
  BatchUndoResult,
  CommunicationDetailDto,
} from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export type ApprovalsFilters = {
  status: 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  from?: string;
  to?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
};

export function useApprovals(filters: ApprovalsFilters) {
  return useQuery({
    queryKey: qk.disp.approvals(filters),
    queryFn: () => apiFetch<ApprovalsResult>('/disponibilidade/approvals', { query: filters }),
    placeholderData: (prev) => prev,
  });
}

function useAfterDecision() {
  const qc = useQueryClient();
  return (detail?: CommunicationDetailDto) => {
    if (detail) qc.setQueryData(qk.disp.communication(detail.code), detail);
    void qc.invalidateQueries({ queryKey: qk.disp.all });
  };
}

export function useApprove() {
  const after = useAfterDecision();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CommunicationDetailDto>(`/disponibilidade/approvals/${id}/approve`, {
        method: 'POST',
      }),
    onSuccess: after,
  });
}

export function useReject() {
  const after = useAfterDecision();
  return useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) =>
      apiFetch<CommunicationDetailDto>(`/disponibilidade/approvals/${id}/reject`, {
        method: 'POST',
        body: { justification },
      }),
    onSuccess: after,
  });
}

export function useBatchApprove() {
  const after = useAfterDecision();
  return useMutation({
    mutationFn: (communicationIds: string[]) =>
      apiFetch<BatchApproveResult>('/disponibilidade/approvals/batch', {
        method: 'POST',
        body: { communicationIds },
      }),
    onSuccess: () => after(),
  });
}

export function useUndoBatch() {
  const after = useAfterDecision();
  return useMutation({
    mutationFn: (batchId: string) =>
      apiFetch<BatchUndoResult>(`/disponibilidade/approvals/batch/${batchId}/undo`, {
        method: 'POST',
      }),
    onSuccess: () => after(),
  });
}
