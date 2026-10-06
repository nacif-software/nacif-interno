import { getInitials, MESSAGES, type InviteBody, type InviteResult } from '@nacif/shared';
import { env } from '../../../config/env';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import type { AuthenticatedUser } from '../../../infra/http/require-auth';
import { db, type DbOrTx } from '../../../infra/prisma/client';
import { logger } from '../../../infra/logger';
import { generateToken, sha256 } from '../auth/password';
import { passwordSetupTokenRepository } from '../auth/password-setup-token.repository';
import { toUserDto } from './user.mapper';
import { usersRepository } from './users.repository';

const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function setupLink(token: string): string {
  return `${env.APP_URL}/definir-senha/${token}`;
}

/** Invalida os tokens pendentes da pessoa e grava um novo; devolve o token em claro. */
async function issueSetupToken(userId: string, now: Date, tx: DbOrTx): Promise<string> {
  const token = generateToken(32);
  await passwordSetupTokenRepository.invalidateAllForUser(userId, now, tx);
  await passwordSetupTokenRepository.create(
    { tokenHash: sha256(token), userId, expiresAt: new Date(now.getTime() + SETUP_TOKEN_TTL_MS) },
    tx,
  );
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
    const { user, token } = await db.$transaction(async (tx) => {
      const record = existing
        ? await usersRepository.update(
            existing.id,
            {
              invitedAt: now,
              ...(input.name ? { name: input.name } : {}),
              ...(input.role ? { role: input.role } : {}),
              ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
            },
            tx,
          )
        : await usersRepository.create(
            {
              email: input.email,
              name: input.name ?? provisionalName(input.email),
              role: input.role ?? 'MEMBER',
              projectId: input.projectId ?? null,
              invitedAt: now,
            },
            tx,
          );
      return { user: record, token: await issueSetupToken(record.id, now, tx) };
    });
    const link = setupLink(token);
    logger.info({ email: user.email, initials: getInitials(user.name), link }, 'Convite criado');
    return { user: toUserDto(user), setupLink: link };
  },

  async resend(userId: string, now: Date = new Date()): Promise<{ setupLink: string }> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    if (user.passwordHash) throw new AppError(409, 'CONFLICT', 'Esta pessoa já definiu a senha.');
    const token = await db.$transaction((tx) => issueSetupToken(user.id, now, tx));
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
  ): Promise<{ setupLink: string }> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    if (!user.passwordHash) throw new AppError(409, 'CONFLICT', MESSAGES.resetPasswordNoPassword);
    if (!user.active) throw new AppError(409, 'CONFLICT', MESSAGES.resetPasswordInactive);
    const token = await db.$transaction((tx) => issueSetupToken(user.id, now, tx));
    const link = setupLink(token);
    logger.info(
      { email: user.email, by: actor.email, link },
      'Link de redefinição de senha criado',
    );
    return { setupLink: link };
  },
};
