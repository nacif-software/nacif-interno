import type { SessionUser } from '@nacif/shared';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { stubPushBrowser, unstubPushBrowser } from '@/test/push-env';
import { renderWithProviders } from '@/test/render';
import { NotificationsPage } from '../pages/notifications-page';

afterEach(() => unstubPushBrowser());

const admin: SessionUser = {
  id: 'u-caio',
  name: 'Caio Bertelli',
  initials: 'CB',
  email: 'caio@nacif.xyz',
  role: 'ADMIN',
  active: true,
  projects: [],
};

const api = (enabled: boolean) =>
  mockApi((url) =>
    url.pathname === '/api/push/config'
      ? { body: { enabled, publicKey: enabled ? 'B' : null } }
      : undefined,
  );

describe('NotificationsPage', () => {
  it('mostra "não configurado" com a chave desligada e trava o interruptor', async () => {
    stubPushBrowser();
    api(false);
    renderWithProviders(<NotificationsPage />, { sessionUser: admin });
    expect(await screen.findByTestId('push-status')).toHaveTextContent('ainda não configurados');
    expect(screen.getByRole('switch', { name: 'Avisos neste dispositivo' })).toBeDisabled();
  });

  it('mostra ativo quando o navegador já tem assinatura, com a nota do administrador', async () => {
    stubPushBrowser({ permission: 'granted', subscribed: true });
    api(true);
    renderWithProviders(<NotificationsPage />, { sessionUser: admin });
    expect(await screen.findByTestId('push-status')).toHaveTextContent('Ativo neste navegador');
    expect(screen.getByRole('switch', { name: 'Avisos neste dispositivo' })).toBeChecked();
    expect(screen.getByText(/Administradores recebem como aprovadores/)).toBeInTheDocument();
  });

  it('mostra bloqueado quando a permissão foi negada', async () => {
    stubPushBrowser({ permission: 'denied' });
    api(true);
    renderWithProviders(<NotificationsPage />, { sessionUser: admin });
    expect(await screen.findByTestId('push-status')).toHaveTextContent('Bloqueado no navegador');
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
