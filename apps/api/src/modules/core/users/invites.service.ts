import { getInitials, type InviteBody, type InviteResult } from '@nacif/shared';
import { env } from '../../../config/env';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import { db } from '../../../infra/prisma/client';
import { logger } from '../../../infra/logger';
import { generateToken, sha256 } from '../auth/password';
import { passwordSetupTokenRepository } from '../auth/password-setup-token.repository';
import { toUserDto } from './user.mapper';
import { usersRepository } from './users.repository';

const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function setupLink(token: string): string {
  return `${env.APP_URL}/definir-senha/${token}`;
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
    const token = generateToken(32);
    const user = await db.$transaction(async (tx) => {
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
      await passwordSetupTokenRepository.invalidateAllForUser(record.id, now, tx);
      await passwordSetupTokenRepository.create(
        {
          tokenHash: sha256(token),
          userId: record.id,
          expiresAt: new Date(now.getTime() + SETUP_TOKEN_TTL_MS),
        },
        tx,
      );
      return record;
    });
    const link = setupLink(token);
    logger.info({ email: user.email, initials: getInitials(user.name), link }, 'Convite criado');
    return { user: toUserDto(user), setupLink: link };
  },

  async resend(userId: string, now: Date = new Date()): Promise<{ setupLink: string }> {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Pessoa não encontrada.');
    if (user.passwordHash) throw new AppError(409, 'CONFLICT', 'Esta pessoa já definiu a senha.');
    const token = generateToken(32);
    await db.$transaction(async (tx) => {
      await passwordSetupTokenRepository.invalidateAllForUser(user.id, now, tx);
      await passwordSetupTokenRepository.create(
        {
          tokenHash: sha256(token),
          userId: user.id,
          expiresAt: new Date(now.getTime() + SETUP_TOKEN_TTL_MS),
        },
        tx,
      );
    });
    const link = setupLink(token);
    logger.info({ email: user.email, link }, 'Convite reenviado');
    return { setupLink: link };
  },
};
