import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
  it('aplica a variante e o tamanho', () => {
    render(
      <Button variant="accent" size="lg">
        Enviar comunicação
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Enviar comunicação' });
    expect(btn).toHaveClass('bg-brand');
    expect(btn).toHaveAttribute('type', 'button');
  });
  it('fica desabilitado quando carregando', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});
