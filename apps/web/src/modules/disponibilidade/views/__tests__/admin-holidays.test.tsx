import type { SessionUser } from '@nacif/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { AdminPage } from '../pages/admin-page';

const admin: SessionUser = {
  id: 'u-caio',
  name: 'Caio Bertelli',
  initials: 'CB',
  email: 'caio@nacif.xyz',
  role: 'ADMIN',
  active: true,
  projects: [],
};

describe('AdminPage · feriados', () => {
  it('falha ao carregar o calendário mostra erro com nova tentativa, não um esqueleto eterno', async () => {
    mockApi(() => undefined);
    renderWithProviders(<AdminPage />, { sessionUser: admin });
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    expect(screen.getByText('Não foi possível carregar')).toBeInTheDocument();
  });
});
