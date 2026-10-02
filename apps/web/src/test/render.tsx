import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

/** Renderiza com QueryClient limpo e um router de memória. */
export function renderWithProviders(
  ui: ReactElement,
  options: { route?: string; path?: string } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { route = '/', path = '*', ...rest } = options;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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
