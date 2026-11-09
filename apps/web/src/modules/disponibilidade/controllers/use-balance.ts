import type { BalanceDto } from '@nacif/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

/** Extrato e saldo da própria pessoa. */
export function useMyBalance() {
  return useQuery({
    queryKey: qk.disp.balance(),
    queryFn: () => apiFetch<BalanceDto>('/disponibilidade/balance'),
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
