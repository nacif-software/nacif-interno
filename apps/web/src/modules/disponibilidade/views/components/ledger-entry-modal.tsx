import {
  APP_TIMEZONE,
  createLedgerEntryBodySchema,
  MESSAGES,
  todayIso,
  type CreateLedgerEntryBody,
  type PersonRef,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLayoutEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button, Field, Input, Modal, NumberInput, Textarea } from '@/ui';

type FormInput = z.input<typeof createLedgerEntryBodySchema>;

/** Crédito manual ou venda de dias para uma pessoa, com nota obrigatória. */
export function LedgerEntryModal({
  person,
  type,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  person: PersonRef | null;
  type: 'GRANT' | 'SALE';
  open: boolean;
  onClose: () => void;
  onConfirm: (body: CreateLedgerEntryBody) => void;
  loading: boolean;
}) {
  const defaults = (): FormInput => ({
    type,
    days: 1,
    referenceDate: todayIso(APP_TIMEZONE),
    note: '',
  });
  const form = useForm<FormInput, unknown, CreateLedgerEntryBody>({
    resolver: zodResolver(createLedgerEntryBodySchema),
    defaultValues: defaults(),
  });
  useLayoutEffect(() => {
    if (open) form.reset(defaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset só na abertura
  }, [open, type]);
  if (!person) return null;
  const isSale = type === 'SALE';
  const onSubmit = form.handleSubmit((v) => onConfirm(v));
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isSale ? MESSAGES.saleTitle : MESSAGES.grantTitle}
      description={person.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="accent"
            type="submit"
            form="ledger-entry-form"
            loading={loading}
            className="px-[22px]"
          >
            {isSale ? MESSAGES.saleAction : MESSAGES.grantAction}
          </Button>
        </>
      }
    >
      <form id="ledger-entry-form" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <input type="hidden" {...form.register('type')} />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label={MESSAGES.ledgerDaysLabel}
            required
            error={form.formState.errors.days?.message}
          >
            {(p) => <NumberInput {...p} min={1} max={366} {...form.register('days')} autoFocus />}
          </Field>
          <Field
            label={MESSAGES.ledgerDateLabel}
            required
            error={form.formState.errors.referenceDate?.message}
          >
            {(p) => <Input {...p} type="date" {...form.register('referenceDate')} />}
          </Field>
        </div>
        <Field
          label={MESSAGES.ledgerNoteLabel}
          required
          hint={MESSAGES.ledgerNoteHint}
          error={form.formState.errors.note?.message}
        >
          {(p) => <Textarea {...p} {...form.register('note')} className="min-h-[96px]" />}
        </Field>
      </form>
    </Modal>
  );
}
