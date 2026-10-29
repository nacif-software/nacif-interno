import { Hono, type Context, type MiddlewareHandler } from 'hono';
import type { UserWithProject } from '../../db/types';
import type { ApiModule } from './module';
import { NotFoundError } from './errors';
import type { ValidatedInput } from './validate';

/** Pessoa autenticada, como `requireAuth` deixa em `c.get('user')`. */
export type AuthenticatedUser = UserWithProject;

/** Variáveis de contexto compartilhadas por toda a API. */
export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: AuthenticatedUser;
    sessionId: string;
    input: ValidatedInput;
    modules: readonly ApiModule[];
  };
};

export type AppContext = Context<AppEnv>;
export type AppRouter = Hono<AppEnv>;

export function createRouter(): AppRouter {
  return new Hono<AppEnv>();
}

/** Aplica middlewares a um prefixo e a tudo abaixo dele (`/x/*` no Hono cobre `/x` e os filhos). */
export function guard(
  router: AppRouter,
  prefix: string,
  ...middlewares: MiddlewareHandler<AppEnv>[]
): void {
  router.use(`${prefix}/*`, ...middlewares);
}

/** Parâmetro de rota obrigatório (o tipo do Hono é `string | undefined` fora da rota tipada). */
export function param(c: AppContext, name: string): string {
  const value = c.req.param(name);
  if (value === undefined) throw new NotFoundError();
  return value;
}
