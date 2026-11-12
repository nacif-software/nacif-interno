import { inviteBodySchema, MESSAGES, type InviteBody, type ProjectDto } from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Input, RefChips, useToast } from '@/ui';
import { useInviteUser } from '../../controllers/use-users';
import type { SetupLink } from './setup-link-modal';

export function InviteForm({
  onInvited,
  projects = [],
}: {
  onInvited: (setup: SetupLink) => void;
  projects?: ProjectDto[];
}) {
  const invite = useInviteUser();
  const toast = useToast();
  const form = useForm<InviteBody>({
    resolver: zodResolver(inviteBodySchema),
    defaultValues: { email: '', projectIds: [], creditBaseDate: null },
  });
  const onSubmit = form.handleSubmit((values) => {
    invite.mutate(values, {
      onSuccess: (res) => {
        form.reset({ email: '', projectIds: [], creditBaseDate: null });
        toast.success(MESSAGES.inviteSentToast);
        onInvited({ link: res.setupLink, email: res.user.email, mode: 'invite' });
      },
      onError: (e) => toast.error(e.message),
    });
  });
  const error = form.formState.errors.email?.message;
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 bg-canvas px-[22px] py-[18px]"
      noValidate
    >
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          {...form.register('email')}
          type="email"
          placeholder="nome@nacif.xyz"
          aria-label="E-mail para convite"
          aria-invalid={error ? true : undefined}
          className="py-[11px] font-mono text-[15px]"
        />
        <Button
          variant="accent"
          type="submit"
          size="sm"
          loading={invite.isPending}
          className="px-[18px] py-3 text-[14px]"
        >
          Enviar convite
        </Button>
      </div>
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <Controller
          control={form.control}
          name="projectIds"
          render={({ field }) => (
            <RefChips
              label={MESSAGES.projectsOptional}
              selected={projects
                .filter((p) => (field.value ?? []).includes(p.id))
                .map((p) => ({ id: p.id, name: p.name }))}
              options={projects.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name }))}
              onChange={field.onChange}
              addLabel={MESSAGES.projectsAdd}
              size="md"
              className="gap-[6px]"
            />
          )}
        />
        <label className="flex items-center gap-2 text-[13px] text-ink-muted">
          {MESSAGES.creditBaseDateOptional}
          <Input
            type="date"
            title={MESSAGES.creditBaseDateHint}
            className="w-auto py-[7px] font-mono text-[13px]"
            {...form.register('creditBaseDate', { setValueAs: (v: string) => v || null })}
          />
        </label>
      </div>
    </form>
  );
}
