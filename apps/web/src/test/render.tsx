import type { SessionUser } from '@nacif/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { qk } from '@/lib/query-keys';

/**
 * Renderiza com QueryClient limpo e um router de memória.
 * `sessionUser` pré-carrega a sessão para componentes que usam `useCurrentUser`.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: { route?: string; path?: string; sessionUser?: SessionUser } & Omit<
    RenderOptions,
    'wrapper'
  > = {},
) {
  const { route = '/', path = '*', sessionUser, ...rest } = options;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (sessionUser) client.setQueryData(qk.auth.me, sessionUser);
  const router = createMemoryRouter(
    [{ path, element: <QueryClientProvider client={client}>{ui}</QueryClientProvider> }],
    {
      initialEntries: [route],
    },
  );
  return { ...render(<RouterProvider router={router} />, rest), client, router };
}

export function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
