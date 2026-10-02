import type { ConflictsResult } from '@nacif/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Conflitos para o período escolhido no formulário (com debounce para não consultar a cada clique). */
export function useConflicts(range: { startDate?: string; endDate?: string }, exclude?: string) {
  const key = useDebounced(`${range.startDate ?? ''}|${range.endDate ?? ''}`, 250);
  const [startDate, endDate] = key.split('|');
  const enabled = Boolean(startDate && endDate);
  return useQuery({
    queryKey: qk.disp.conflicts({ startDate: startDate ?? '', endDate: endDate ?? '', exclude }),
    queryFn: () =>
      apiFetch<ConflictsResult>('/disponibilidade/communications/conflicts', {
        query: { startDate, endDate, exclude },
      }),
    enabled,
    placeholderData: (prev) => prev,
  });
}
