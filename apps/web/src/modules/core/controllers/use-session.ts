import type { LoginBody, SessionUser, SetPasswordBody, SetPasswordInfo } from '@nacif/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, isApiError } from '@/lib/api-client';
import { qk } from '@/lib/query-keys';

async function fetchMe(): Promise<SessionUser | null> {
  try {
    const res = await apiFetch<{ user: SessionUser }>('/auth/me');
    return res.user;
  } catch (err) {
    if (isApiError(err) && err.status === 401) return null;
    throw err;
  }
}

/** Usuário da sessão: `undefined` carregando, `null` deslogado. */
export function useSession() {
  const query = useQuery({ queryKey: qk.auth.me, queryFn: fetchMe, staleTime: 5 * 60_000 });
  return { user: query.data, isLoading: query.isPending, error: query.error };
}

/** Só usar dentro de RequireAuth, onde o usuário é garantido. */
export function useCurrentUser(): SessionUser {
  const { user } = useSession();
  if (!user) throw new Error('useCurrentUser fora de RequireAuth');
  return user;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) =>
      apiFetch<{ user: SessionUser }>('/auth/login', { method: 'POST', body }),
    onSuccess: ({ user }) => {
      qc.clear();
      qc.setQueryData(qk.auth.me, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(qk.auth.me, null);
    },
  });
}

export function useSetupInfo(token: string) {
  return useQuery({
    queryKey: ['auth', 'setup', token],
    queryFn: () => apiFetch<SetPasswordInfo>(`/auth/set-password/${encodeURIComponent(token)}`),
    retry: false,
  });
}

export function useSetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SetPasswordBody) =>
      apiFetch<{ user: SessionUser }>('/auth/set-password', { method: 'POST', body }),
    onSuccess: ({ user }) => {
      qc.clear();
      qc.setQueryData(qk.auth.me, user);
    },
  });
}
