import type { User } from '../../../../db/types';

export interface AuthenticateInput {
  email: string;
  password?: string;
}

/**
 * Abstração do mecanismo de autenticação.
 * Hoje: e-mail/senha local. Futuro: login corporativo pelo Cloudflare Access (issue #7).
 * Regras de domínio, usuário inativo e sessão ficam fora do provider.
 */
export interface AuthProvider {
  authenticate(input: AuthenticateInput): Promise<User | null>;
}
