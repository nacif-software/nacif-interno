import type { SetPasswordInfo } from '@nacif/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { SetPasswordPage } from '../pages/set-password-page';

afterEach(() => vi.unstubAllGlobals());

function setup(info: SetPasswordInfo) {
  const fetchMock = mockApi((url) => {
    if (url.pathname === '/api/auth/set-password/tok') return { body: info };
    if (url.pathname === '/api/auth/set-password')
      return { body: { user: { id: 'u1', name: info.name, email: info.email } } };
    return undefined;
  });
  renderWithProviders(<SetPasswordPage />, {
    route: '/definir-senha/tok',
    path: '/definir-senha/:token',
  });
  return fetchMock;
}

describe('SetPasswordPage', () => {
  it('convite: pede nome e senha', async () => {
    setup({ email: 'nova@nacif.xyz', name: 'Nova Pessoa', mode: 'invite' });
    expect(await screen.findByLabelText('Nome')).toHaveValue('Nova Pessoa');
    expect(screen.getByRole('heading', { name: 'Defina sua senha' })).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('redefinição: só pede a senha e não envia o nome', async () => {
    const fetchMock = setup({ email: 'pedro@nacif.xyz', name: 'Pedro Nakano', mode: 'reset' });
    expect(await screen.findByRole('heading', { name: 'Redefina sua senha' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Senha'), 'senha-nova-123');
    await user.click(screen.getByRole('button', { name: 'Salvar e entrar' }));
    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
      expect(post).toBeDefined();
      expect(JSON.parse(post![1]?.body as string)).toEqual({
        token: 'tok',
        password: 'senha-nova-123',
      });
    });
  });
});
