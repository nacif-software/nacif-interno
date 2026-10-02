import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { disponibilidadeModule } from '@/modules/disponibilidade/manifest';

describe('navItems por papel', () => {
  it('membro, aprovador e admin veem os itens do design', () => {
    const nav = disponibilidadeModule.navItems!;
    expect(nav('MEMBER').map((i) => i.label)).toEqual(['Início', 'Minhas comunicações', 'Time']);
    expect(nav('APPROVER').map((i) => i.label)).toEqual([
      'Início',
      'Aprovações',
      'Calendário do time',
    ]);
    expect(nav('ADMIN').map((i) => i.label)).toEqual([
      'Início',
      'Aprovações',
      'Calendário do time',
      'Administração',
    ]);
    expect(typeof screen.queryByText).toBe('function');
  });
});
