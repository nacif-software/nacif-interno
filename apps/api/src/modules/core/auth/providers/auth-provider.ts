import type { User } from '../../../../generated/prisma/client';

export interface AuthenticateInput {
  email: string;
  password?: string;
}

/**
 * Abstração do mecanismo de autenticação.
 * Hoje: e-mail/senha local. Futuro: login corporativo (issue #7 no GitHub).
 * Regras de domínio, usuário inativo e sessão ficam fora do provider.
 */
export interface AuthProvider {
  authenticate(input: AuthenticateInput): Promise<User | null>;
}
