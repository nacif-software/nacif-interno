import { SESSION_COOKIE_NAME } from '@nacif/shared';
import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../../config/env';
import { generateToken } from './password';
import { sessionRepository } from './session.repository';

const TTL_MS = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
/** Só atualiza lastSeen/expiração se passou mais de 1h, para não escrever a cada request. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: TTL_MS,
  };
}

export const sessionService = {
  async start(res: Response, userId: string, now: Date = new Date()): Promise<string> {
    const id = generateToken(32);
    await sessionRepository.create({ id, userId, expiresAt: new Date(now.getTime() + TTL_MS) });
    res.cookie(SESSION_COOKIE_NAME, id, cookieOptions());
    return id;
  },

  readToken(req: Request): string | null {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const token = cookies?.[SESSION_COOKIE_NAME];
    return typeof token === 'string' && token.length > 0 ? token : null;
  },

  /** Retorna a sessão com usuário se válida; null caso contrário. Renova a expiração de forma deslizante. */
  async resolve(token: string, now: Date = new Date()) {
    const session = await sessionRepository.findWithUser(token);
    if (!session) return null;
    if (session.expiresAt.getTime() <= now.getTime()) {
      await sessionRepository.delete(token);
      return null;
    }
    if (now.getTime() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
      await sessionRepository.touch(token, now, new Date(now.getTime() + TTL_MS));
    }
    return session;
  },

  async end(req: Request, res: Response): Promise<void> {
    const token = this.readToken(req);
    if (token) await sessionRepository.delete(token);
    res.clearCookie(SESSION_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  },

  revokeAllForUser(userId: string) {
    return sessionRepository.deleteAllForUser(userId);
  },
};
