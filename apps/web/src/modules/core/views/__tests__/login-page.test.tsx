import { MESSAGES } from '@nacif/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { LoginPage } from '../pages/login-page';

afterEach(() => vi.unstubAllGlobals());

function setup(loginResponse: { status: number; body: unknown }) {
  mockApi((url) => {
    if (url.pathname === '/api/auth/me')
      return { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'x' } } };
    if (url.pathname === '/api/auth/login') return loginResponse;
    return undefined;
  });
  return renderWithProviders(<LoginPage />, { route: '/login', path: '/login' });
}

describe('LoginPage', () => {
  it('mostra a copy inicial do design', async () => {
    setup({ status: 200, body: {} });
    expect(
      await screen.findByRole('button', { name: 'Entrar com e-mail Nacif' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Acesse para comunicar períodos de indisponibilidade/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Se você é prestador do time/)).toBeInTheDocument();
  });

  it('exibe o erro de domínio com o e-mail ecoado', async () => {
    setup({
      status: 403,
      body: {
        error: {
          code: 'DOMAIN_NOT_ALLOWED',
          message: MESSAGES.domainNotAllowed('rafael@gmail.com'),
          details: { email: 'rafael@gmail.com' },
        },
      },
    });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('E-mail'), 'rafael@gmail.com');
    await user.type(screen.getByLabelText('Senha'), 'qualquer');
    await user.click(screen.getByRole('button', { name: 'Entrar com e-mail Nacif' }));
    expect(await screen.findByText('Domínio não autorizado')).toBeInTheDocument();
    expect(screen.getByText('rafael@gmail.com')).toHaveClass('font-mono');
    expect(screen.getByRole('button', { name: 'Tentar com outra conta' })).toBeInTheDocument();
  });

  it('exibe o erro de credenciais', async () => {
    setup({ status: 401, body: { error: { code: 'INVALID_CREDENTIALS', message: 'x' } } });
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('E-mail'), 'marina@nacif.xyz');
    await user.type(screen.getByLabelText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: 'Entrar com e-mail Nacif' }));
    await waitFor(() => expect(screen.getByText('E-mail ou senha incorretos')).toBeInTheDocument());
  });
});
