import {
  APP_TIMEZONE,
  countBusinessDays,
  formatBusinessDays,
  formatDateRange,
  MESSAGES,
  todayIso,
} from '@nacif/shared';
import { useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { isApiError } from '@/lib/api-client';
import { useIsDesktop } from '@/lib/use-media-query';
import { useCurrentUser } from '@/modules/core/controllers/use-session';
import { useProjects } from '@/modules/core/controllers/use-projects';
import { useUserOptions } from '@/modules/core/controllers/use-users';
import { FocusedShell } from '@/modules/core/views/layouts/focused-shell';
import { Alert, Button, Field, Select, SkeletonCard, Textarea, useToast } from '@/ui';
import { useCommunicationForm } from '../../controllers/communication-form';
import {
  useCommunication,
  useCreateCommunication,
  useUpdatePeriod,
} from '../../controllers/use-communications';
import { useConflicts } from '../../controllers/use-conflicts';
import { useSettings } from '../../controllers/use-settings';
import { paths } from '../../manifest';
import { ConflictAlert } from '../components/conflict-alert';
import { DateRangePicker } from '../components/date-range-picker';
import { FormFooter } from '../components/form-footer';

export function CommunicationFormPage() {
  const { code } = useParams();
  const mode: 'create' | 'edit' = code ? 'edit' : 'create';
  const user = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const isDesktop = useIsDesktop();
  const settings = useSettings();
  const covers = useUserOptions('cover');
  const approvers = useUserOptions('approver');
  const projects = useProjects();
  const existing = useCommunication(code);
  const create = useCreateCommunication();
  const updatePeriod = useUpdatePeriod();
  const form = useCommunicationForm();
  const { setValue, watch, getValues, setError } = form;

  const today = todayIso(APP_TIMEZONE);
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const coverId = watch('coverId');
  const conflicts = useConflicts(
    { startDate: startDate || undefined, endDate: endDate || undefined },
    existing.data?.id,
  );

  // Aprovador padrão: do projeto da pessoa; senão o primeiro aprovador padrão global.
  const defaultApproverId = useMemo(() => {
    const fromProject = projects.data?.find((p) => p.id === user.project?.id)?.defaultApprover?.id;
    return fromProject ?? settings.data?.defaultApprovers[0]?.id ?? '';
  }, [projects.data, settings.data, user.project?.id]);

  useEffect(() => {
    if (
      mode === 'create' &&
      !getValues('approverId') &&
      defaultApproverId &&
      approvers.data?.some((a) => a.id === defaultApproverId)
    ) {
      setValue('approverId', defaultApproverId);
    }
  }, [mode, defaultApproverId, approvers.data, getValues, setValue]);

  useEffect(() => {
    if (mode === 'edit' && existing.data && !getValues('startDate')) {
      const c = existing.data;
      setValue('startDate', c.startDate);
      setValue('endDate', c.endDate);
      setValue('coverId', c.cover.id);
      setValue('approverId', c.approver.id);
      setValue('notes', c.notes ?? '');
    }
  }, [mode, existing.data, getValues, setValue]);

  const applyServerErrors = (err: unknown) => {
    if (isApiError(err, 'VALIDATION_ERROR') && Array.isArray(err.details)) {
      for (const issue of err.details as { path: string; message: string }[]) {
        const field = issue.path.replace(/^body\./, '') as keyof typeof form.formState.errors;
        if (field in getValues()) setError(field, { message: issue.message });
      }
      return;
    }
    toast.error(err instanceof Error ? err.message : 'Erro inesperado.');
  };

  const onSubmit = form.handleSubmit((values) => {
    if (mode === 'edit' && existing.data) {
      updatePeriod.mutate(
        { id: existing.data.id, startDate: values.startDate, endDate: values.endDate },
        {
          onSuccess: (detail) => {
            toast.success(MESSAGES.periodUpdatedToast);
            void navigate(paths.detail(detail.code));
          },
          onError: applyServerErrors,
        },
      );
      return;
    }
    create.mutate(
      { ...values, notes: values.notes?.trim() ? values.notes.trim() : undefined },
      {
        onSuccess: (detail) => {
          toast.success(MESSAGES.sentTo(detail.approver.name), {
            label: 'Ver',
            onClick: () => void navigate(paths.detail(detail.code)),
          });
          void navigate(paths.base);
        },
        onError: applyServerErrors,
      },
    );
  });

  const backTo = mode === 'edit' && code ? paths.detail(code) : paths.base;
  const busy = create.isPending || updatePeriod.isPending;
  const coverName = covers.data?.find((c) => c.id === coverId)?.name;
  const minNotice = settings.data?.minNoticeDays ?? 7;
  const loading = mode === 'edit' && existing.isPending;
  const disableEditFields = mode === 'edit';

  const summary =
    startDate && endDate ? (
      <>
        Resumo:{' '}
        <span className="font-semibold text-ink">
          {formatDateRange(startDate, endDate)} ·{' '}
          {formatBusinessDays(countBusinessDays(startDate, endDate))}
        </span>
        {coverName && ` · cobertura ${coverName}`}
      </>
    ) : (
      'Resumo: selecione o período'
    );

  return (
    <FocusedShell
      crumbs={[
        { label: 'Minhas comunicações', to: paths.list },
        { label: mode === 'edit' ? 'Editar período' : 'Nova' },
      ]}
      backTo={backTo}
      title={mode === 'edit' ? 'Editar período' : 'Nova comunicação'}
      footer={
        <FormFooter summary={summary}>
          <Button
            variant="secondary"
            onClick={() => void navigate(backTo)}
            disabled={busy}
            className="max-md:w-full"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="communication-form"
            loading={busy}
            size="md"
            className="max-md:w-full max-md:py-4 max-md:text-[16px]"
          >
            {mode === 'edit' ? 'Salvar período' : 'Enviar comunicação'}
          </Button>
        </FormFooter>
      }
    >
      <div className="hidden flex-col gap-2 md:flex">
        <h1 className="text-[38px] leading-[1.08] font-bold tracking-[-0.035em] text-ink">
          {mode === 'edit' ? 'Editar período' : 'Nova comunicação de indisponibilidade'}
        </h1>
        <p className="text-[16px] leading-[1.55] text-ink-muted">
          {MESSAGES.minimumNoticeConfigured(minNotice)}
        </p>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : (
        <form
          id="communication-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-4 md:gap-7"
          noValidate
        >
          <Controller
            control={form.control}
            name="startDate"
            render={() => (
              <div className="flex flex-col gap-2">
                <DateRangePicker
                  compact={!isDesktop}
                  label={isDesktop ? undefined : 'Período'}
                  minDate={today}
                  startDate={startDate || undefined}
                  endDate={endDate || undefined}
                  conflicts={conflicts.data?.conflicts}
                  onChange={(r) => {
                    setValue('startDate', r.startDate, { shouldValidate: false });
                    setValue('endDate', r.endDate, { shouldValidate: false });
                  }}
                />
                {(form.formState.errors.startDate ?? form.formState.errors.endDate) && (
                  <Alert variant="error">
                    {form.formState.errors.startDate?.message ??
                      form.formState.errors.endDate?.message}
                  </Alert>
                )}
              </div>
            )}
          />

          <ConflictAlert result={conflicts.data} />

          <div className="flex flex-col gap-4 rounded-card border border-line bg-card p-[18px] md:gap-[22px] md:p-7">
            <Field label="Quem cobre suas entregas" error={form.formState.errors.coverId?.message}>
              {(p) => (
                <Select
                  {...p}
                  {...form.register('coverId')}
                  disabled={disableEditFields}
                  placeholder="Selecione"
                >
                  {covers.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.projectName ? `${c.name} — projeto ${c.projectName}` : c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label="Aprovador"
              hint={mode === 'create' ? MESSAGES.defaultApproverHint : undefined}
              error={form.formState.errors.approverId?.message}
            >
              {(p) => (
                <Select
                  {...p}
                  {...form.register('approverId')}
                  disabled={disableEditFields}
                  placeholder="Selecione"
                >
                  {approvers.data?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Observações" optional error={form.formState.errors.notes?.message}>
              {(p) => (
                <Textarea
                  {...p}
                  {...form.register('notes')}
                  disabled={disableEditFields}
                  className="max-md:min-h-[72px]"
                />
              )}
            </Field>
          </div>
        </form>
      )}
    </FocusedShell>
  );
}
