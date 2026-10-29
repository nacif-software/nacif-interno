import type { ApiErrorBody } from '@nacif/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './config/env';
import type { AppEnv, AppRouter } from './infra/http/context';
import { notFound, onError } from './infra/http/error-handler';
import { registerModules, type ApiModule } from './infra/http/module';
import { requestLogger } from './infra/http/request-logger';
import { modules } from './modules';

const BODY_LIMIT_BYTES = 256 * 1024;

export function createApp(options: { modules?: readonly ApiModule[] } = {}): AppRouter {
  const app = new Hono<AppEnv>();

  app.use(secureHeaders());
  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(
    bodyLimit({
      maxSize: BODY_LIMIT_BYTES,
      onError: (c) => {
        const body: ApiErrorBody = {
          error: { code: 'VALIDATION_ERROR', message: 'Corpo da requisição muito grande.' },
        };
        return c.json(body, 413);
      },
    }),
  );
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  registerModules(app, options.modules ?? modules);

  app.notFound(notFound);
  app.onError(onError);
  return app;
}
