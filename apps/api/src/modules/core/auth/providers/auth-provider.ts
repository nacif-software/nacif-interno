import type { User } from '../../../../generated/prisma/client';

export interface AuthenticateInput {
  email: string;
  password?: string;
}

/**
 * Abstração do mecanismo de autenticação.
 * Hoje: e-mail/senha local. Futuro: OAuth Google (docs/issues/003-oauth-google.md).
 * Regras de domínio, usuário inativo e sessão ficam fora do provider.
 */
export interface AuthProvider {
  authenticate(input: AuthenticateInput): Promise<User | null>;
}
