import type { BalanceDto, BalanceOverviewItem, CreateLedgerEntryBody } from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

/** Extrato e saldo da própria pessoa. */
export function useMyBalance(enabled = true) {
  return useQuery({
    queryKey: qk.disp.balance(),
    queryFn: () => apiFetch<BalanceDto>('/disponibilidade/balance'),
    enabled,
  });
}

/** Extrato de outra pessoa (só administrador). */
export function useBalanceOf(userId: string | undefined) {
  return useQuery({
    queryKey: qk.disp.balance(userId ?? null),
    queryFn: () =>
      apiFetch<BalanceDto>(`/disponibilidade/balance/${encodeURIComponent(userId ?? '')}`),
    enabled: Boolean(userId),
  });
}

/** Saldo e último movimento de todas as pessoas (Administração). */
export function useBalanceOverview() {
  return useQuery({
    queryKey: qk.disp.balanceOverview,
    queryFn: () => apiFetch<BalanceOverviewItem[]>('/disponibilidade/balance/overview'),
  });
}

/** Crédito manual ou venda de dias (só administrador). */
export function useCreateLedgerEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...body }: CreateLedgerEntryBody & { userId: string }) =>
      apiFetch<BalanceDto>(`/disponibilidade/balance/${encodeURIComponent(userId)}/entries`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.disp.all }),
  });
}
