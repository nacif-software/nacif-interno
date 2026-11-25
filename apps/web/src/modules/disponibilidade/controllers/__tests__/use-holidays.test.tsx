import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { Providers } from '@/test/render';
import { useHolidayDates } from '../use-holidays';

describe('useHolidayDates', () => {
  it('devolve as datas depois de carregar', async () => {
    mockApi((url) =>
      url.pathname === '/api/disponibilidade/holidays'
        ? { body: [{ id: 'h1', date: '2026-12-25', name: 'Natal' }] }
        : undefined,
    );
    const { result } = renderHook(() => useHolidayDates(), { wrapper: Providers });
    await waitFor(() => expect(result.current?.has('2026-12-25')).toBe(true));
  });

  it('sem calendário carregado (falha ou carregando) devolve null, não um calendário vazio', async () => {
    const fetchMock = mockApi(() => undefined);
    const { result } = renderHook(() => useHolidayDates(), { wrapper: Providers });
    expect(result.current).toBeNull();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
