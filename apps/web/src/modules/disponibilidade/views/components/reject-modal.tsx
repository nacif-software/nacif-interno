import {
  formatBusinessDays,
  formatDateRange,
  MESSAGES,
  rejectBodySchema,
  type CommunicationSummaryDto,
  type RejectBody,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Field, Modal, Textarea } from '@/ui';

export function RejectModal({
  communication,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  communication: CommunicationSummaryDto | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  loading: boolean;
}) {
  const form = useForm<RejectBody>({
    resolver: zodResolver(rejectBodySchema),
    defaultValues: { justification: '' },
  });
  useEffect(() => {
    if (open) form.reset({ justification: '' });
  }, [open, form]);
  if (!communication) return null;
  const onSubmit = form.handleSubmit((v) => onConfirm(v.justification));
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Recusar comunicação"
      description={`${communication.author.name} · ${formatDateRange(communication.startDate, communication.endDate)} · ${formatBusinessDays(communication.businessDays)}. A justificativa é enviada ao autor.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="destructive-solid"
            type="submit"
            form="reject-form"
            loading={loading}
            className="px-[22px]"
          >
            Confirmar recusa
          </Button>
        </>
      }
    >
      <form id="reject-form" onSubmit={onSubmit} noValidate>
        <Field
          label="Justificativa"
          required
          hint={MESSAGES.rejectionHint}
          error={form.formState.errors.justification?.message}
        >
          {(p) => (
            <Textarea
              {...p}
              {...form.register('justification')}
              className="min-h-[104px]"
              autoFocus
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
