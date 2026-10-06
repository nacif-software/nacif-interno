import { z } from 'zod';
import { ALLOWED_EMAIL_DOMAIN, PASSWORD_MIN_CHARS } from '../constants';
import { roleSchema } from '../enums/role';
import { MESSAGES } from '../labels/pt-br';
import { projectRefSchema } from './common';

/** E-mail válido, normalizado para minúsculas. Não valida o domínio (ver nacifEmailSchema). */
export const emailSchema = z
  .string({ error: MESSAGES.invalidEmail })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: MESSAGES.invalidEmail }));

export function isAllowedDomain(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/** E-mail obrigatoriamente do domínio permitido. */
export const nacifEmailSchema = emailSchema.refine(isAllowedDomain, {
  error: MESSAGES.onlyNacifAccounts,
});

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_CHARS, { error: MESSAGES.passwordTooShort });

/** Login não valida o domínio no schema: o service devolve DOMAIN_NOT_ALLOWED com o e-mail ecoado. */
export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Informe a senha.' }),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

/**
 * Modo do link de definição de senha: `invite` (primeiro acesso, define nome e senha)
 * ou `reset` (redefinição pelo administrador, só troca a senha). Derivado no servidor
 * de a pessoa já ter senha ou não.
 */
export const setPasswordModeSchema = z.enum(['invite', 'reset']);
export type SetPasswordMode = z.infer<typeof setPasswordModeSchema>;

/** `name` é obrigatório no convite e ignorado na redefinição; o service decide. */
export const setPasswordBodySchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2, { error: MESSAGES.nameRequired }).max(120).optional(),
  password: passwordSchema,
});
export type SetPasswordBody = z.infer<typeof setPasswordBodySchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  email: z.string(),
  role: roleSchema,
  active: z.boolean(),
  project: projectRefSchema.nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const setPasswordInfoSchema = z.object({
  email: z.string(),
  name: z.string(),
  mode: setPasswordModeSchema,
});
export type SetPasswordInfo = z.infer<typeof setPasswordInfoSchema>;
