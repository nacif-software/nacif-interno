import {
  MESSAGES,
  updateSettingsBodySchema,
  type SettingsDto,
  type UpdateSettingsBody,
  type UserOption,
} from '@nacif/shared';
import type { z } from 'zod';

type SettingsFormInput = z.input<typeof updateSettingsBodySchema>;
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, NumberInput, RefChips, useToast } from '@/ui';
import { useUpdateSettings } from '../../controllers/use-settings';

export function SettingsCard({
  settings,
  approvers,
}: {
  settings: SettingsDto;
  approvers: UserOption[];
}) {
  const update = useUpdateSettings();
  const toast = useToast();
  const form = useForm<SettingsFormInput, unknown, UpdateSettingsBody>({
    resolver: zodResolver(updateSettingsBodySchema),
    defaultValues: {
      minNoticeDays: settings.minNoticeDays,
      maxSimultaneousPerProject: settings.maxSimultaneousPerProject,
      daysPerYear: settings.daysPerYear,
      defaultApproverIds: settings.defaultApprovers.map((a) => a.id),
    },
  });
  const onSubmit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: () => toast.success(MESSAGES.settingsSavedToast),
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-card border border-line bg-card p-[26px]"
      noValidate
    >
      <div className="flex flex-col gap-3">
        <label htmlFor="minNoticeDays" className="text-[15px] font-semibold text-ink">
          Antecedência mínima
        </label>
        <NumberInput
          id="minNoticeDays"
          min={0}
          max={365}
          suffix="dias antes do início"
          {...form.register('minNoticeDays')}
        />
        {form.formState.errors.minNoticeDays && (
          <p className="text-[13px] text-danger">{form.formState.errors.minNoticeDays.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-[22px]">
        <label htmlFor="maxSimultaneous" className="text-[15px] font-semibold text-ink">
          Limite de pessoas simultaneamente indisponíveis
        </label>
        <NumberInput
          id="maxSimultaneous"
          min={1}
          max={100}
          suffix="por projeto"
          {...form.register('maxSimultaneousPerProject')}
        />
        {form.formState.errors.maxSimultaneousPerProject && (
          <p className="text-[13px] text-danger">
            {form.formState.errors.maxSimultaneousPerProject.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-[22px]">
        <label htmlFor="daysPerYear" className="text-[15px] font-semibold text-ink">
          Crédito anual
        </label>
        <NumberInput
          id="daysPerYear"
          min={1}
          max={365}
          suffix="dias por ano, no aniversário da data base"
          {...form.register('daysPerYear')}
        />
        <p className="text-[13px] text-ink-muted">{MESSAGES.daysPerYearHint}</p>
        {form.formState.errors.daysPerYear && (
          <p className="text-[13px] text-danger">{form.formState.errors.daysPerYear.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-[22px]">
        <span className="text-[15px] font-semibold text-ink">Aprovadores padrão</span>
        <Controller
          control={form.control}
          name="defaultApproverIds"
          render={({ field }) => {
            const selected = field.value
              .map(
                (id) =>
                  approvers.find((a) => a.id === id) ??
                  settings.defaultApprovers.find((a) => a.id === id),
              )
              .filter((a): a is { id: string; name: string } => Boolean(a));
            return (
              <RefChips
                label="Aprovadores padrão"
                selected={selected}
                options={approvers.map((a) => ({ id: a.id, name: a.name }))}
                onChange={field.onChange}
                addLabel={MESSAGES.defaultApproversAdd}
              />
            );
          }}
        />
        <p className="text-[13px] leading-[1.5] text-ink-muted">{MESSAGES.defaultApproversHint}</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={update.isPending} className="px-5 py-3">
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}
