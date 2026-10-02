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
import { Badge, Button, Chip, DropdownMenu, MenuItem, NumberInput, useToast } from '@/ui';
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
      defaultApproverIds: settings.defaultApprovers.map((a) => a.id),
    },
  });
  const onSubmit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: () => toast.success(MESSAGES.settingsSavedToast),
      onError: (e) => toast.error(e.message),
    });
  });
  const nameOf = (id: string) =>
    approvers.find((a) => a.id === id)?.name ??
    settings.defaultApprovers.find((a) => a.id === id)?.name ??
    id;

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
        <span className="text-[15px] font-semibold text-ink">Aprovadores padrão</span>
        <Controller
          control={form.control}
          name="defaultApproverIds"
          render={({ field }) => {
            const selected = field.value;
            const available = approvers.filter((a) => !selected.includes(a.id));
            return (
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="Aprovadores padrão"
              >
                {selected.map((id) => (
                  <Badge key={id} tone="brand" size="lg" className="gap-2">
                    {nameOf(id)}
                    <button
                      type="button"
                      aria-label={`Remover ${nameOf(id)}`}
                      className="cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => field.onChange(selected.filter((v) => v !== id))}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {available.length > 0 && (
                  <DropdownMenu
                    align="left"
                    trigger={({ open: _open, ...props }) => (
                      <Chip {...props} dashed aria-haspopup="menu">
                        + adicionar
                      </Chip>
                    )}
                  >
                    {available.map((a) => (
                      <MenuItem key={a.id} onClick={() => field.onChange([...selected, a.id])}>
                        {a.name}
                      </MenuItem>
                    ))}
                  </DropdownMenu>
                )}
              </div>
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
