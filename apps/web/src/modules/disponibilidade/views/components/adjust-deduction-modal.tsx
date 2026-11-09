import {
  approveBodySchema,
  formatDateRange,
  MESSAGES,
  type ApproveBody,
  type CommunicationSummaryDto,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLayoutEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { Button, Field, Modal, NumberInput, Textarea } from '@/ui';

type FormInput = z.input<typeof approveBodySchema>;

/** Aprovação com ajuste dos dias descontados do saldo (ex.: troca de feriado = 0), com motivo. */
export function AdjustDeductionModal({
  communication,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  communication: CommunicationSummaryDto | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (body: ApproveBody) => void;
  loading: boolean;
}) {
  const form = useForm<FormInput, unknown, ApproveBody>({
    resolver: zodResolver(approveBodySchema),
    defaultValues: { deductedDays: communication?.businessDays ?? 0, deductionNote: '' },
  });
  // Antes da pintura: quem abre o modal pode começar a digitar sem o reset sobrescrever.
  useLayoutEffect(() => {
    if (open) form.reset({ deductedDays: communication?.businessDays ?? 0, deductionNote: '' });
  }, [open, communication?.businessDays, form]);
  const watched = useWatch({ control: form.control, name: 'deductedDays' });
  if (!communication) return null;
  const days = Number(watched ?? communication.businessDays);
  const onSubmit = form.handleSubmit((v) => onConfirm(v));
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={MESSAGES.adjustDeductionTitle}
      description={`${communication.author.name} · ${formatDateRange(communication.startDate, communication.endDate)}. ${MESSAGES.adjustDeductionDescription(communication.businessDays)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="adjust-deduction-form"
            loading={loading}
            className="px-[22px]"
          >
            {MESSAGES.approveWithDays(Number.isFinite(days) ? days : communication.businessDays)}
          </Button>
        </>
      }
    >
      <form
        id="adjust-deduction-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-5"
        noValidate
      >
        <Field
          label={MESSAGES.adjustDeductionDaysLabel}
          required
          error={form.formState.errors.deductedDays?.message}
        >
          {(p) => (
            <NumberInput
              {...p}
              min={0}
              max={366}
              suffix={`de ${communication.businessDays} ${communication.businessDays === 1 ? 'dia útil' : 'dias úteis'}`}
              className="max-w-[220px]"
              {...form.register('deductedDays')}
              autoFocus
            />
          )}
        </Field>
        <Field
          label={MESSAGES.adjustDeductionNoteLabel}
          required
          hint={MESSAGES.adjustDeductionNoteHint}
          error={form.formState.errors.deductionNote?.message}
        >
          {(p) => <Textarea {...p} {...form.register('deductionNote')} className="min-h-[96px]" />}
        </Field>
      </form>
    </Modal>
  );
}
