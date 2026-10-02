import type { SettingsDto, UpdateSettingsBody } from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export function useSettings() {
  return useQuery({
    queryKey: qk.disp.settings,
    queryFn: () => apiFetch<SettingsDto>('/disponibilidade/settings'),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSettingsBody) =>
      apiFetch<SettingsDto>('/disponibilidade/settings', { method: 'PUT', body }),
    onSuccess: (data) => qc.setQueryData(qk.disp.settings, data),
  });
}
