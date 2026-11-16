import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SetupLinkModal, type SetupLink } from '../components/setup-link-modal';

const link = (token: string): SetupLink => ({
  link: `http://localhost:5173/set-password/${token}`,
  email: 'pedro@nacif.xyz',
  mode: 'invite',
});

describe('SetupLinkModal', () => {
  it('mostra "Copiar link", vira "Copiado" ao copiar e volta a "Copiar link" para um link novo', async () => {
    // userEvent.setup() instala um clipboard falso em navigator.clipboard
    const ue = userEvent.setup();
    const { rerender } = render(<SetupLinkModal setup={link('aaa')} onClose={() => {}} />);

    const button = screen.getByRole('button', { name: 'Copiar link' });
    await ue.click(button);
    expect(await navigator.clipboard.readText()).toBe('http://localhost:5173/set-password/aaa');
    expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument();

    // fecha e abre de novo com outro link: o botão não pode continuar em "Copiado"
    rerender(<SetupLinkModal setup={null} onClose={() => {}} />);
    rerender(<SetupLinkModal setup={link('bbb')} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copiado' })).toBeNull();
  });
});
