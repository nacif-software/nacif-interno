import {
  MESSAGES,
  setPasswordBodySchema,
  type SetPasswordBody,
  type SetPasswordMode,
} from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { Alert, Button, Field, Input, Logo, SkeletonCard } from '@/ui';
import { useSetPassword, useSetupInfo } from '../../controllers/use-session';

const TITLE: Record<SetPasswordMode, string> = {
  invite: MESSAGES.setPasswordTitle,
  reset: MESSAGES.resetPasswordTitle,
};

/** Convite define nome e senha; redefinição (issue #9) só a senha. O modo vem da API. */
export function SetPasswordPage() {
  const { token = '' } = useParams();
  const info = useSetupInfo(token);
  const setPassword = useSetPassword();
  const navigate = useNavigate();
  const mode: SetPasswordMode = info.data?.mode ?? 'invite';
  const isInvite = mode === 'invite';
  const form = useForm<SetPasswordBody>({
    resolver: zodResolver(setPasswordBodySchema),
    defaultValues: { token, name: '', password: '' },
  });

  useEffect(() => {
    if (info.data && !form.getValues('name')) form.setValue('name', info.data.name);
  }, [info.data, form]);

  const onSubmit = form.handleSubmit((values) => {
    // Na redefinição o nome não muda; não enviamos para a API decidir só pela senha.
    const body = isInvite ? values : { token: values.token, password: values.password };
    setPassword.mutate(body, { onSuccess: () => void navigate('/', { replace: true }) });
  });

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas p-5">
      <div aria-hidden className="absolute inset-0 bg-dots opacity-55" />
      <div className="relative flex w-full max-w-[420px] flex-col gap-6 rounded-card border border-line bg-card px-6 py-9 md:px-10 md:py-11">
        <div className="flex flex-col gap-3">
          <Logo size="lg" to={null} />
          <h1 className="text-[30px] leading-[1.1] font-bold tracking-[-0.03em] text-ink">
            {TITLE[mode]}
          </h1>
          {info.data && (
            <p className="text-[16px] leading-[1.5] text-ink-muted">
              Acesso para <span className="font-mono text-ink">{info.data.email}</span>.
            </p>
          )}
        </div>
        {info.isPending && <SkeletonCard />}
        {info.isError && (
          <Alert variant="error" title="Link inválido ou expirado">
            Peça a um administrador para gerar um novo link.
          </Alert>
        )}
        {setPassword.isError && (
          <Alert variant="error" title="Não foi possível definir a senha">
            {setPassword.error.message}
          </Alert>
        )}
        {info.data && (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {isInvite && (
              <Field label="Nome" error={form.formState.errors.name?.message}>
                {(p) => <Input {...p} {...form.register('name')} autoComplete="name" />}
              </Field>
            )}
            <Field
              label="Senha"
              hint="Mínimo de 8 caracteres."
              error={form.formState.errors.password?.message}
            >
              {(p) => (
                <Input
                  {...p}
                  {...form.register('password')}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </Field>
            <Button type="submit" size="lg" block loading={setPassword.isPending}>
              Salvar e entrar
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
