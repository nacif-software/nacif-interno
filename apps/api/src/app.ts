import type { ApiErrorBody } from '@nacif/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { bindConfig, config } from './config/env';
import { bindDb } from './db/client';
import type { AppEnv, AppRouter } from './infra/http/context';
import { notFound, onError } from './infra/http/error-handler';
import { registerModules, type ApiModule } from './infra/http/module';
import { requestLogger } from './infra/http/request-logger';
import { modules } from './modules';

const BODY_LIMIT_BYTES = 256 * 1024;

export function createApp(options: { modules?: readonly ApiModule[] } = {}): AppRouter {
  const app = new Hono<AppEnv>();

  // Bindings do Worker valem para a requisição inteira: config validada e banco prontos antes de tudo.
  app.use('*', async (c, next) => {
    bindConfig(c.env);
    bindDb(c.env.DB);
    await next();
  });
  app.use(secureHeaders());
  // A origem permitida vem da config da requisição (bindings), por isso é uma função.
  app.use(cors({ origin: () => config().APP_URL, credentials: true }));
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
  app.use(requestLogger);

  registerModules(app, options.modules ?? modules);

  app.notFound(notFound);
  app.onError(onError);
  return app;
}
