import type { SessionUser } from '@nacif/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { stubPushBrowser, unstubPushBrowser } from '@/test/push-env';
import { renderWithProviders } from '@/test/render';
import { PushOnboardingModal } from '../components/push-onboarding-modal';

afterEach(() => unstubPushBrowser());

const user = (role: SessionUser['role']): SessionUser => ({
  id: `u-${role}`,
  name: 'Marina Duarte',
  initials: 'MD',
  email: 'marina@nacif.xyz',
  role,
  active: true,
  projects: [],
});

function pushApi(enabled = true) {
  return mockApi((url, init) => {
    if (url.pathname === '/api/push/config')
      return { body: { enabled, publicKey: enabled ? 'BAAA' : null } };
    if (url.pathname === '/api/push/subscriptions' && init?.method === 'POST')
      return { status: 201 };
    return undefined;
  });
}

describe('PushOnboardingModal', () => {
  it('aparece uma vez com os avisos do papel e "Agora não" não volta a perguntar', async () => {
    stubPushBrowser();
    pushApi();
    const { unmount } = renderWithProviders(<PushOnboardingModal />, {
      sessionUser: user('APPROVER'),
    });
    const dialog = await screen.findByRole('dialog', { name: 'Avisos no navegador' });
    expect(dialog).toHaveTextContent('Com o papel Aprovador, você recebe:');
    expect(dialog).toHaveTextContent('Nova comunicação endereçada a você para avaliar');
    expect(dialog).toHaveTextContent('Crédito anual, crédito manual ou venda de dias no seu saldo');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Agora não' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('nacif.push.prompt:u-APPROVER')).toBe('dismissed');

    unmount();
    renderWithProviders(<PushOnboardingModal />, { sessionUser: user('APPROVER') });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('membro só vê os avisos de membro', async () => {
    stubPushBrowser();
    pushApi();
    renderWithProviders(<PushOnboardingModal />, { sessionUser: user('MEMBER') });
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Com o papel Membro, você recebe:');
    expect(dialog).not.toHaveTextContent('Nova comunicação endereçada a você');
  });

  it('ativa: registra o service worker, pede permissão, assina e envia à API', async () => {
    const { registration } = stubPushBrowser();
    registration.pushManager.getSubscription.mockResolvedValueOnce(null).mockResolvedValue({
      endpoint: 'https://push.example/new',
      toJSON: () => ({
        endpoint: 'https://push.example/new',
        expirationTime: null,
        keys: { p256dh: 'p', auth: 'a' },
      }),
    });
    registration.pushManager.subscribe.mockResolvedValue({
      endpoint: 'https://push.example/new',
      toJSON: () => ({
        endpoint: 'https://push.example/new',
        expirationTime: null,
        keys: { p256dh: 'p', auth: 'a' },
      }),
    });
    const fetchMock = pushApi();
    renderWithProviders(<PushOnboardingModal />, { sessionUser: user('MEMBER') });
    await screen.findByRole('dialog');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Ativar avisos' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(post?.[0]).toBe('/api/push/subscriptions');
    expect(JSON.parse(post?.[1]?.body as string).keys).toEqual({ p256dh: 'p', auth: 'a' });
    expect(localStorage.getItem('nacif.push.prompt:u-MEMBER')).toBe('enabled');
  });

  it('não aparece sem suporte do navegador nem sem chaves no servidor', async () => {
    pushApi(true);
    renderWithProviders(<PushOnboardingModal />, { sessionUser: user('MEMBER') });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    stubPushBrowser();
    pushApi(false);
    renderWithProviders(<PushOnboardingModal />, { sessionUser: user('MEMBER') });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
