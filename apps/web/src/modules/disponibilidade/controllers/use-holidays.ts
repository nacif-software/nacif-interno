import { NO_HOLIDAYS, type CreateHolidayBody, type HolidayDto, type IsoDate } from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

/** Calendário de feriados da Nacif (ordenado por data). */
export function useHolidays() {
  return useQuery({
    queryKey: qk.disp.holidays,
    queryFn: () => apiFetch<HolidayDto[]>('/disponibilidade/holidays'),
  });
}

/** Datas do calendário para contar dias úteis; vazio enquanto carrega. */
export function useHolidayDates(): ReadonlySet<IsoDate> {
  const { data } = useHolidays();
  return useMemo(() => (data ? new Set(data.map((h) => h.date)) : NO_HOLIDAYS), [data]);
}

/** Mudar o calendário reconta comunicações futuras no servidor: invalida o módulo inteiro. */
export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateHolidayBody) =>
      apiFetch<HolidayDto>('/disponibilidade/holidays', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.disp.all }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holiday: HolidayDto) =>
      apiFetch<void>(`/disponibilidade/holidays/${encodeURIComponent(holiday.id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.disp.all }),
  });
}
