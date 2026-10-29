import { SESSION_COOKIE_NAME } from '@nacif/shared';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { config } from '../../../config/env';
import type { AppContext } from '../../../infra/http/context';
import { generateToken } from './password';
import { sessionRepository } from './session.repository';

/** Só atualiza lastSeen/expiração se passou mais de 1h, para não escrever a cada request. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

const ttlSeconds = () => config().SESSION_TTL_DAYS * 24 * 60 * 60;
const ttlMs = () => ttlSeconds() * 1000;

export const sessionService = {
  async start(c: AppContext, userId: string, now: Date = new Date()): Promise<string> {
    const id = generateToken(32);
    await sessionRepository.create({ id, userId, expiresAt: new Date(now.getTime() + ttlMs()) });
    setCookie(c, SESSION_COOKIE_NAME, id, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: config().COOKIE_SECURE,
      path: '/',
      maxAge: ttlSeconds(),
    });
    return id;
  },

  readToken(c: AppContext): string | null {
    const token = getCookie(c, SESSION_COOKIE_NAME);
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
      await sessionRepository.touch(token, now, new Date(now.getTime() + ttlMs()));
    }
    return session;
  },

  /** Apaga a sessão atual no banco sem mexer no cookie (uso: antes de iniciar outra). */
  async revokeCurrent(c: AppContext): Promise<void> {
    const token = this.readToken(c);
    if (token) await sessionRepository.delete(token);
  },

  async end(c: AppContext): Promise<void> {
    await this.revokeCurrent(c);
    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/', secure: config().COOKIE_SECURE });
  },

  revokeAllForUser(userId: string) {
    return sessionRepository.deleteAllForUser(userId);
  },
};
