import { QueryClient } from '@tanstack/react-query';
import { ApiError, setUnauthenticatedHandler } from './api-client';
import { qk } from './query-keys';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

setUnauthenticatedHandler(() => {
  queryClient.setQueryData(qk.auth.me, null);
});
