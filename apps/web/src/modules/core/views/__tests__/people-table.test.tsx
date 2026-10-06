import type { SessionUser, UserDto } from '@nacif/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/api-mock';
import { renderWithProviders } from '@/test/render';
import { PeopleTable } from '../components/people-table';

afterEach(() => vi.unstubAllGlobals());

const caio: SessionUser = {
  id: 'u-caio',
  name: 'Caio Bertelli',
  initials: 'CB',
  email: 'caio@nacif.xyz',
  role: 'ADMIN',
  active: true,
  project: null,
};

function user(overrides: Partial<UserDto> & Pick<UserDto, 'id' | 'name' | 'email'>): UserDto {
  return {
    initials: 'XX',
    role: 'MEMBER',
    active: true,
    invitePending: false,
    project: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const users = [
  user({ id: 'u-caio', name: 'Caio Bertelli', email: 'caio@nacif.xyz', role: 'ADMIN' }),
  user({ id: 'u-pedro', name: 'Pedro Nakano', email: 'pedro@nacif.xyz' }),
  user({ id: 'u-ana', name: 'Ana Lima', email: 'ana@nacif.xyz', invitePending: true }),
  user({ id: 'u-thiago', name: 'Thiago Lemos', email: 'thiago@nacif.xyz', active: false }),
];

describe('PeopleTable', () => {
  it('oferece "Redefinir senha" só para pessoa ativa que já tem senha', () => {
    mockApi(() => undefined);
    renderWithProviders(<PeopleTable users={users} projects={[]} onSetupLink={() => {}} />, {
      sessionUser: caio,
    });
    const actions = screen.getAllByRole('button', { name: /^Redefinir senha de / });
    expect(actions.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Redefinir senha de Caio Bertelli',
      'Redefinir senha de Pedro Nakano',
    ]);
    expect(
      screen.getByRole('button', { name: 'Convite pendente · gerar novo link' }),
    ).toBeInTheDocument();
  });

  it('gera o link de redefinição e entrega ao modal', async () => {
    const fetchMock = mockApi((url) => {
      if (url.pathname === '/api/users/u-pedro/password-reset')
        return { body: { setupLink: 'http://localhost:5173/definir-senha/abc' } };
      return undefined;
    });
    const onSetupLink = vi.fn();
    renderWithProviders(<PeopleTable users={users} projects={[]} onSetupLink={onSetupLink} />, {
      sessionUser: caio,
    });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Redefinir senha de Pedro Nakano' }));
    await waitFor(() =>
      expect(onSetupLink).toHaveBeenCalledWith({
        link: 'http://localhost:5173/definir-senha/abc',
        email: 'pedro@nacif.xyz',
        mode: 'reset',
      }),
    );
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.method).toBe('POST');
  });
});
