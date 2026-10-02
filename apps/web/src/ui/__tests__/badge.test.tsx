import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoleChip, StatusBadge } from '../badge';

describe('badges', () => {
  it('usa os rótulos do design para status', () => {
    render(
      <>
        <StatusBadge status="IN_REVIEW" />
        <StatusBadge status="APPROVED" />
        <StatusBadge status="REJECTED" />
        <StatusBadge status="CANCELLED" />
      </>,
    );
    expect(screen.getByText('Em análise')).toHaveClass('bg-warning-bg', 'text-warning');
    expect(screen.getByText('Aprovada')).toHaveClass('bg-success-bg');
    expect(screen.getByText('Recusada')).toHaveClass('bg-danger-bg');
    expect(screen.getByText('Cancelada')).toHaveClass('bg-neutral-bg');
  });
  it('usa os rótulos de papel', () => {
    render(<RoleChip role="ADMIN" />);
    expect(screen.getByText('Administrador')).toHaveClass('bg-ink');
  });
});
