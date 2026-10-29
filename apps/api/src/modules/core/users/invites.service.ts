import {
  getInitials,
  MESSAGES,
  type InviteBody,
  type InviteResult,
  type SetupLinkResult,
} from '@nacif/shared';
import type { BatchItem } from 'drizzle-orm/batch';
import { config } from '../../../config/env';
import { batchAll, db } from '../../../db/client';
import type { AuthenticatedUser } from '../../../infra/http/context';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import { logger } from '../../../infra/logger';
import { generateToken, sha256 } from '../auth/password';
import { passwordSetupTokenRepository } from '../auth/password-setup-token.repository';
import { toUserDto } from './user.mapper';
import { usersRepository } from './users.repository';

const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function setupLink(token: string): string {
  return `${config().APP_URL}/definir-senha/${token}`;
}

/**
 * Statements que invalidam os tokens pendentes da pessoa e gravam um novo (para um `batch`).
 * Devolve o token em claro.
 */
export async function setupTokenStatements(
  userId: string,
  now: Date,
): Promise<{ token: string; statements: BatchItem<'sqlite'>[] }> {
  const token = generateToken(32);
  const statements: BatchItem<'sqlite'>[] = [
    passwordSetupTokenRepository.invalidateAllForUser(userId, now),
    passwordSetupTokenRepository.insert({
      tokenHash: await sha256(token),
      userId,
      expiresAt: new Date(now.getTime() + SETUP_TOKEN_TTL_MS),
    }),
  ];
  return { token, statements };
}

async function issueSetupToken(userId: string, now: Date): Promise<string> {
  const { token, statements } = await setupTokenStatements(userId, now);
  await batchAll(statements);
  return token;
}

/** Nome provisório a partir do e-mail: "marina.duarte@" → "Marina Duarte". */
function provisionalName(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export const invitesService = {
  /**
   * Cria (ou reaproveita) o usuário sem senha e gera um link de definição de senha.
   * Sem e-mail no MVP: o link é devolvido ao administrador e registrado no log.
   */
  async invite(input: InviteBody, now: Date = new Date()): Promise<InviteResult> {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing?.passwordHash) {
      throw new AppError(409, 'CONFLICT', 'Esta pessoa já tem acesso.');
    }
    const userId = existing?.id ?? crypto.randomUUID();
    const userStatement = existing
      ? usersRepository.updateById(existing.id, {
          invitedAt: now,
          ...(input.name ? { name: input.name } : {}),
          ...(input.role ? { role: input.role } : {}),
          ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        })
      : usersRepository.insert({
          id: userId,
          email: input.email,
          name: input.name ?? provisionalName(input.email),
          role: input.role ?? 'MEMBER',
          projectId: input.projectId ?? null,
          invitedAt: now,
        });
    const { token, statements } = await setupTokenStatements(userId, now);
    await db().batch([userStatement, ...statements]);
    const user = await usersRepository.mustFind(userId);
    const link = setupLink(token);
    logger.info({ email: user.email, initials: getInitials(user.name), link }, 'Convite criado');
    return { user: toUserDto(user), setupLink: link };
  },

  async resend(userId: string, now: Date = new Date()): Promise<SetupLinkResult> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    if (user.passwordHash) throw new AppError(409, 'CONFLICT', 'Esta pessoa já definiu a senha.');
    const token = await issueSetupToken(user.id, now);
    const link = setupLink(token);
    logger.info({ email: user.email, link }, 'Convite reenviado');
    return { setupLink: link };
  },

  /**
   * Link de redefinição de senha para uma pessoa ativa que já tem senha (issue #9).
   * A senha atual continua valendo até o link ser usado; aí `auth.service.setPassword`
   * troca só a senha e revoga as sessões.
   */
  async resetPassword(
    userId: string,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<SetupLinkResult> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    if (!user.passwordHash) throw new AppError(409, 'CONFLICT', MESSAGES.resetPasswordNoPassword);
    if (!user.active) throw new AppError(409, 'CONFLICT', MESSAGES.resetPasswordInactive);
    const token = await issueSetupToken(user.id, now);
    const link = setupLink(token);
    logger.info(
      { email: user.email, by: actor.email, link },
      'Link de redefinição de senha criado',
    );
    return { setupLink: link };
  },
};
