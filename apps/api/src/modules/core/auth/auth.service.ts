import {
  MESSAGES,
  isAllowedDomain,
  type SessionUser,
  type SetPasswordBody,
  type SetPasswordInfo,
  type SetPasswordMode,
} from '@nacif/shared';
import { AppError, ValidationError } from '../../../infra/http/errors';
import { db } from '../../../infra/prisma/client';
import { toSessionUser } from '../users/user.mapper';
import { usersRepository } from '../users/users.repository';
import { hashPassword, sha256 } from './password';
import { passwordSetupTokenRepository } from './password-setup-token.repository';
import type { AuthProvider } from './providers/auth-provider';
import { localPasswordProvider } from './providers/local-password.provider';
import { sessionService } from './session.service';

export class DomainNotAllowedError extends AppError {
  constructor(email: string) {
    super(403, 'DOMAIN_NOT_ALLOWED', MESSAGES.domainNotAllowed(email), { email });
  }
}
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', MESSAGES.invalidCredentials);
  }
}
export class UserInactiveError extends AppError {
  constructor() {
    super(403, 'USER_INACTIVE', MESSAGES.userInactive);
  }
}

/** Quem já tem senha recebe link de redefinição; quem não tem, de convite (issue #9). */
function setupMode(user: { passwordHash: string | null }): SetPasswordMode {
  return user.passwordHash ? 'reset' : 'invite';
}

/** Token válido (não usado, não expirado) de uma pessoa ativa; desativar invalida o link. */
async function findValidSetup(token: string, now: Date) {
  const record = await passwordSetupTokenRepository.findValid(sha256(token), now);
  if (!record) throw new AppError(404, 'NOT_FOUND', 'Link inválido ou expirado.');
  if (!record.user.active) throw new UserInactiveError();
  return record;
}

export function createAuthService(provider: AuthProvider = localPasswordProvider) {
  return {
    /** Valida domínio → provider → usuário ativo. Não cria a sessão (o controller faz). */
    async login(email: string, password: string): Promise<SessionUser> {
      if (!isAllowedDomain(email)) throw new DomainNotAllowedError(email);
      const user = await provider.authenticate({ email, password });
      if (!user) throw new InvalidCredentialsError();
      if (!user.active) throw new UserInactiveError();
      const full = await usersRepository.findByIdWithProject(user.id);
      if (!full) throw new InvalidCredentialsError();
      return toSessionUser(full);
    },

    async getSetupInfo(token: string, now: Date = new Date()): Promise<SetPasswordInfo> {
      const record = await findValidSetup(token, now);
      return { email: record.user.email, name: record.user.name, mode: setupMode(record.user) };
    },

    /**
     * Usa um link de definição de senha. No convite define nome e senha; na redefinição
     * (pessoa que já tem senha) troca só a senha. Em ambos revoga as sessões anteriores.
     */
    async setPassword(input: SetPasswordBody, now: Date = new Date()): Promise<SessionUser> {
      const record = await findValidSetup(input.token, now);
      const isInvite = setupMode(record.user) === 'invite';
      if (isInvite && !input.name) {
        throw new ValidationError(MESSAGES.nameRequired, [
          { path: 'body.name', message: MESSAGES.nameRequired },
        ]);
      }
      const passwordHash = await hashPassword(input.password);
      const userId = await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: record.userId },
          data: isInvite ? { name: input.name, passwordHash } : { passwordHash },
        });
        await passwordSetupTokenRepository.markUsed(record.id, now, tx);
        await passwordSetupTokenRepository.invalidateAllForUser(record.userId, now, tx);
        return record.userId;
      });
      await sessionService.revokeAllForUser(userId);
      const full = await usersRepository.findByIdWithProject(userId);
      if (!full) throw new AppError(404, 'NOT_FOUND', 'Usuário não encontrado.');
      return toSessionUser(full);
    },
  };
}

export const authService = createAuthService();
