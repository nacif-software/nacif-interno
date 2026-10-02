import { loginBodySchema, MESSAGES, type LoginBody } from '@nacif/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { isApiError } from '@/lib/api-client';
import { Alert, Button, Field, Input, Logo } from '@/ui';
import { useLogin, useSession } from '../../controllers/use-session';

type LoginError = { title: string; body: string } | null;

export function LoginPage() {
  const { user, isLoading } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState<LoginError>(null);
  const form = useForm<LoginBody>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: '', password: '' },
  });

  if (!isLoading && user) return <Navigate to={params.get('next') ?? '/'} replace />;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    login.mutate(values, {
      onSuccess: () => void navigate(params.get('next') ?? '/', { replace: true }),
      onError: (err) => {
        if (isApiError(err, 'DOMAIN_NOT_ALLOWED')) {
          setError({ title: MESSAGES.domainNotAllowedTitle, body: err.message });
        } else if (isApiError(err, 'USER_INACTIVE')) {
          setError({ title: MESSAGES.userInactiveTitle, body: MESSAGES.userInactive });
        } else {
          setError({ title: MESSAGES.invalidCredentialsTitle, body: MESSAGES.invalidCredentials });
        }
      },
    });
  });

  const emailInError =
    error?.title === MESSAGES.domainNotAllowedTitle ? form.getValues('email') : null;

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas p-5">
      <div aria-hidden className="absolute inset-0 bg-dots opacity-55" />
      <div className="relative flex w-full max-w-[420px] flex-col gap-6 rounded-card border border-line bg-card px-6 py-9 md:px-10 md:py-11">
        <div className="flex flex-col gap-3">
          <Logo size="lg" to={null} />
          <h1 className="text-[30px] leading-[1.1] font-bold tracking-[-0.03em] text-ink">
            {MESSAGES.portalTitle}
          </h1>
          {!error && (
            <p className="text-[16px] leading-[1.5] text-ink-muted">
              {MESSAGES.portalLoginDescription}
            </p>
          )}
        </div>

        {error && (
          <Alert variant="error" title={error.title}>
            {emailInError ? (
              <>
                A conta <span className="font-mono">{emailInError}</span> não pertence ao domínio
                nacif.xyz. Entre com seu e-mail Nacif.
              </>
            ) : (
              error.body
            )}
          </Alert>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="E-mail" error={form.formState.errors.email?.message}>
            {(p) => (
              <Input
                {...p}
                {...form.register('email')}
                type="email"
                autoComplete="email"
                placeholder="nome@nacif.xyz"
                className="font-mono text-[15px]"
              />
            )}
          </Field>
          <Field label="Senha" error={form.formState.errors.password?.message}>
            {(p) => (
              <Input
                {...p}
                {...form.register('password')}
                type="password"
                autoComplete="current-password"
              />
            )}
          </Field>
          <Button type="submit" size="lg" block loading={login.isPending}>
            {error ? 'Tentar com outra conta' : 'Entrar com e-mail Nacif'}
          </Button>
        </form>

        <p className="border-t border-line pt-5 text-[14px] leading-[1.5] text-ink-muted">
          Apenas contas <span className="font-mono text-ink">@nacif.xyz</span> têm acesso.
          {!error &&
            ' Se você é prestador do time e não consegue entrar, procure um administrador.'}
        </p>
      </div>
    </div>
  );
}
