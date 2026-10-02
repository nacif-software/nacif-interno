import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './infra/http/error-handler';
import { registerModules, type ApiModule } from './infra/http/module';
import { logger } from './infra/logger';
import { modules } from './modules';

export function createApp(options: { modules?: readonly ApiModule[] } = {}): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '256kb' }));
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  }

  registerModules(app, options.modules ?? modules);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
