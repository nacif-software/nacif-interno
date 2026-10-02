import { useState } from 'react';
import { Button, Modal } from '@/ui';

export function SetupLinkModal({
  link,
  email,
  onClose,
}: {
  link: string | null;
  email: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Modal
      open={link !== null}
      onClose={onClose}
      title="Convite criado"
      description={
        <>
          Envie este link para <span className="font-mono text-ink">{email}</span>. Ele vale por 7
          dias e define nome e senha no primeiro acesso.
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
        {link}
      </code>
    </Modal>
  );
}
