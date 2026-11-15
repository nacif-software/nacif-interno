import type { ProjectDto, SessionUser, UserDto } from '@nacif/shared';
import { screen, waitFor, within } from '@testing-library/react';
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
  projects: [],
};

function user(overrides: Partial<UserDto> & Pick<UserDto, 'id' | 'name' | 'email'>): UserDto {
  return {
    initials: 'XX',
    role: 'MEMBER',
    active: true,
    invitePending: false,
    projects: [],
    creditBaseDate: null,
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

  it('marca projeto no dropdown e envia a lista completa', async () => {
    const projects: ProjectDto[] = [
      { id: 'p-atlas', name: 'Atlas', active: true, defaultApprover: null, memberCount: 1 },
      { id: 'p-vega', name: 'Vega', active: true, defaultApprover: null, memberCount: 0 },
      { id: 'p-orion', name: 'Órion', active: false, defaultApprover: null, memberCount: 0 },
    ];
    const fetchMock = mockApi((url) => {
      if (url.pathname === '/api/users/u-pedro') return { body: users[1] };
      return undefined;
    });
    const withProject = users.map((u) =>
      u.id === 'u-pedro' ? { ...u, projects: [{ id: 'p-atlas', name: 'Atlas' }] } : u,
    );
    renderWithProviders(
      <PeopleTable users={withProject} projects={projects} onSetupLink={() => {}} />,
      { sessionUser: caio },
    );
    const group = screen.getByRole('group', { name: 'Projetos de Pedro Nakano' });
    const ue = userEvent.setup();
    await ue.click(within(group).getByRole('button', { name: 'Atlas' }));
    // lista só os projetos ativos da empresa, marcando os da pessoa
    const boxes = within(group).getAllByRole('checkbox');
    expect(
      boxes.map((b) => [b.closest('label')?.textContent, (b as HTMLInputElement).checked]),
    ).toEqual([
      ['Atlas', true],
      ['Vega', false],
    ]);
    await ue.click(within(group).getByRole('checkbox', { name: 'Vega' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/users/u-pedro');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(init?.body as string)).toEqual({ projectIds: ['p-atlas', 'p-vega'] });
    // o painel continua aberto para marcar mais de um; a marcação é otimista
    expect(within(group).getByRole('checkbox', { name: 'Vega' })).toBeChecked();
    expect(within(group).getByRole('button', { name: '2 projetos' })).toBeInTheDocument();
  });

  it('desfaz a marcação quando o servidor recusa', async () => {
    const projects: ProjectDto[] = [
      { id: 'p-atlas', name: 'Atlas', active: true, defaultApprover: null, memberCount: 1 },
      { id: 'p-vega', name: 'Vega', active: true, defaultApprover: null, memberCount: 0 },
    ];
    mockApi((url) => {
      if (url.pathname === '/api/users/u-pedro')
        return { status: 409, body: { error: { code: 'CONFLICT', message: 'Projeto inativo.' } } };
      return undefined;
    });
    renderWithProviders(<PeopleTable users={users} projects={projects} onSetupLink={() => {}} />, {
      sessionUser: caio,
    });
    const group = screen.getByRole('group', { name: 'Projetos de Pedro Nakano' });
    const ue = userEvent.setup();
    await ue.click(within(group).getByRole('button', { name: 'Sem projeto' }));
    await ue.click(within(group).getByRole('checkbox', { name: 'Vega' }));
    await waitFor(() =>
      expect(within(group).getByRole('checkbox', { name: 'Vega' })).not.toBeChecked(),
    );
  });

  it('mostra "Sem projeto" e "N projetos" no resumo do dropdown', () => {
    mockApi(() => undefined);
    const projects: ProjectDto[] = [
      { id: 'p-atlas', name: 'Atlas', active: true, defaultApprover: null, memberCount: 1 },
      { id: 'p-vega', name: 'Vega', active: true, defaultApprover: null, memberCount: 1 },
    ];
    const withProjects = users.map((u) =>
      u.id === 'u-pedro'
        ? {
            ...u,
            projects: [
              { id: 'p-atlas', name: 'Atlas' },
              { id: 'p-vega', name: 'Vega' },
            ],
          }
        : u,
    );
    renderWithProviders(
      <PeopleTable users={withProjects} projects={projects} onSetupLink={() => {}} />,
      { sessionUser: caio },
    );
    const pedro = screen.getByRole('group', { name: 'Projetos de Pedro Nakano' });
    expect(within(pedro).getByRole('button', { name: '2 projetos' })).toBeInTheDocument();
    const caioGroup = screen.getByRole('group', { name: 'Projetos de Caio Bertelli' });
    expect(within(caioGroup).getByRole('button', { name: 'Sem projeto' })).toBeInTheDocument();
  });
});
