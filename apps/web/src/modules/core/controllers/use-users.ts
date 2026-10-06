import type {
  InviteBody,
  InviteResult,
  UpdateUserBody,
  UserDto,
  UserOption,
  UsersListQuery,
} from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

export function useUsers(filters: Partial<Record<keyof UsersListQuery, string>> = {}) {
  return useQuery({
    queryKey: qk.users.list(filters),
    queryFn: () => apiFetch<UserDto[]>('/users', { query: filters }),
  });
}

export function useUserOptions(purpose: 'cover' | 'approver') {
  return useQuery({
    queryKey: qk.users.options(purpose),
    queryFn: () => apiFetch<UserOption[]>('/users/options', { query: { purpose } }),
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteBody) =>
      apiFetch<InviteResult>('/users/invites', { method: 'POST', body }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.users.all }),
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ setupLink: string }>(`/users/${id}/invites/resend`, { method: 'POST' }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ setupLink: string }>(`/users/${id}/password-reset`, { method: 'POST' }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserBody & { id: string }) =>
      apiFetch<UserDto>(`/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.users.all });
      void qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}
