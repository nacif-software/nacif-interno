import { inviteBodySchema, MESSAGES, type InviteBody } from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Input, useToast } from '@/ui';
import { useInviteUser } from '../../controllers/use-users';
import type { SetupLink } from './setup-link-modal';

export function InviteForm({ onInvited }: { onInvited: (setup: SetupLink) => void }) {
  const invite = useInviteUser();
  const toast = useToast();
  const form = useForm<InviteBody>({
    resolver: zodResolver(inviteBodySchema),
    defaultValues: { email: '' },
  });
  const onSubmit = form.handleSubmit((values) => {
    invite.mutate(values, {
      onSuccess: (res) => {
        form.reset({ email: '' });
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
    </form>
  );
}
