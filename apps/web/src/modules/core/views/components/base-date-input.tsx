import { MESSAGES } from '@nacif/shared';
import { useState } from 'react';
import { Input } from '@/ui';

/**
 * Data base do crédito de uma pessoa: salva ao sair do campo e volta ao valor do servidor se falhar.
 * `value` é o que o servidor tem; `onSave` recebe a data nova (ou null para limpar) e resolve quando gravou.
 * O chamador passa `key={value}` para o rascunho acompanhar o servidor após a gravação.
 */
export function BaseDateInput({
  name,
  value,
  onSave,
  disabled,
  className,
}: {
  name: string;
  value: string | null;
  onSave: (next: string | null) => Promise<unknown>;
  disabled?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(value ?? '');
  return (
    <Input
      type="date"
      aria-label={`${MESSAGES.creditBaseDateLabel} de ${name} (${MESSAGES.creditBaseDateHint})`}
      title={MESSAGES.creditBaseDateHint}
      value={draft}
      disabled={disabled}
      className={className}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft || null;
        if (next === value) return;
        onSave(next).catch(() => setDraft(value ?? ''));
      }}
    />
  );
}
