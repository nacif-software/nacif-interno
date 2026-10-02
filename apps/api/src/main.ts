import { createApp } from './app';
import { env } from './config/env';
import { db } from './infra/prisma/client';
import { logger } from './infra/logger';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API no ar');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Encerrando');
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
