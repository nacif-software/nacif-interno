import { MESSAGES, type SetPasswordMode } from '@nacif/shared';
import { useState } from 'react';
import { Button, Modal } from '@/ui';

export interface SetupLink {
  link: string;
  email: string;
  mode: SetPasswordMode;
}

const COPY: Record<SetPasswordMode, { title: string; body: string }> = {
  invite: { title: MESSAGES.setupLinkInviteTitle, body: MESSAGES.setupLinkInviteBody },
  reset: { title: MESSAGES.setupLinkResetTitle, body: MESSAGES.setupLinkResetBody },
};

export function SetupLinkModal({
  setup,
  onClose,
}: {
  setup: SetupLink | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(setup?.link ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const text = COPY[setup?.mode ?? 'invite'];
  return (
    <Modal
      open={setup !== null}
      onClose={onClose}
      title={text.title}
      description={
        <>
          {MESSAGES.setupLinkSendTo} <span className="font-mono text-ink">{setup?.email}</span>.{' '}
          {text.body}
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => void copy()}>{copied ? 'Copiado' : 'Copiar link'}</Button>
        </>
      }
    >
      <code className="block overflow-x-auto rounded-control border border-line bg-canvas p-3 font-mono text-[13px] text-ink">
        {setup?.link}
      </code>
    </Modal>
  );
}
